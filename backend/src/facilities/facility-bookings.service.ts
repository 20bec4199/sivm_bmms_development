import { Injectable, NotFoundException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto, UpdateBookingDto, BookingQueryDto } from './dto/facility-booking.dto';
import * as qrcode from 'qrcode';

@Injectable()
export class FacilityBookingsService {
  constructor(private prisma: PrismaService) {}

  async create(organizationId: string, userId: string, dto: CreateBookingDto) {
    const { facilityId, startTime, endTime } = dto;
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) throw new BadRequestException('End time must be after start time');

    const now = new Date();
    if (start.getTime() < now.getTime() - 60000) {
      throw new BadRequestException('Cannot reserve a facility time slot that is in the past. Please select a current or future time slot.');
    }

    const facility = await this.prisma.facility.findFirst({
      where: { id: facilityId, organizationId }
    });
    if (!facility) throw new NotFoundException('Facility not found');
    if (!facility.isActive || (facility.status && facility.status !== 'ACTIVE')) {
      throw new BadRequestException(`Facility is currently unavailable (${facility.status || 'INACTIVE'})`);
    }

    // Check weekday availability in availabilitySchedule & rules (e.g., Sunday holidays)
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = daysOfWeek[start.getDay()];

    if (facility.availabilitySchedule && Array.isArray(facility.availabilitySchedule)) {
      const daySchedule = (facility.availabilitySchedule as any[]).find((s: any) => s.day && s.day.toLowerCase() === dayName.toLowerCase());
      if (daySchedule && daySchedule.enabled === false) {
        throw new BadRequestException(`Facility is closed on ${dayName}s per official operating schedule.`);
      }
      // Also validate that the requested booking falls within the configured time ranges for this day
      if (daySchedule && daySchedule.enabled && Array.isArray(daySchedule.ranges) && daySchedule.ranges.length > 0) {
        const reqStartMins = start.getHours() * 60 + start.getMinutes();
        const reqEndMins = end.getHours() * 60 + end.getMinutes();
        const isValidTime = daySchedule.ranges.some((range: any) => {
          const rStart = parseInt(range.start.split(':')[0]) * 60 + parseInt(range.start.split(':')[1]);
          const rEnd = parseInt(range.end.split(':')[0]) * 60 + parseInt(range.end.split(':')[1]);
          return reqStartMins >= rStart && reqEndMins <= rEnd;
        });
        if (!isValidTime) {
          throw new BadRequestException(`Requested time slot violates configured operating hours for ${dayName} (${daySchedule.ranges.map((r: any) => `${r.start}-${r.end}`).join(', ')}).`);
        }
      }
    }

    // Comprehensive text scanning across all rules and description fields for holiday directives
    const allFacilityText = [
      ...(Array.isArray(facility.rules) ? facility.rules : []),
      facility.description || '',
      facility.shortDescription || ''
    ].join(' ').toLowerCase();

    const holidayKeywords = ['holiday', 'closed', 'no booking', 'off', 'not available', 'leave'];
    if (allFacilityText.includes(dayName.toLowerCase()) || (dayName === 'Sunday' && allFacilityText.includes('sun')) || (dayName === 'Saturday' && allFacilityText.includes('sat'))) {
      for (const kw of holidayKeywords) {
        if (allFacilityText.includes(kw)) {
          throw new BadRequestException(`Facility is restricted on ${dayName}s due to administrative operational rule: "${kw.toUpperCase()} ON ${dayName.toUpperCase()}"`);
        }
      }
    }

    // Check maintenance blocks
    if (facility.maintenanceBlocks && Array.isArray(facility.maintenanceBlocks)) {
      for (const block of (facility.maintenanceBlocks as any[])) {
        const bStart = new Date(block.startTime || block.start);
        const bEnd = new Date(block.endTime || block.end);
        if (start < bEnd && end > bStart) {
          throw new BadRequestException(`Facility is unavailable during this time due to scheduled maintenance: ${block.reason || 'Maintenance block'}`);
        }
      }
    }

    const conflictingBookings = await this.prisma.facilityBooking.findMany({
      where: {
        facilityId,
        status: { in: ['PENDING', 'CONFIRMED', 'APPROVED'] },
        OR: [
          { startTime: { lt: end, gte: start } },
          { endTime: { gt: start, lte: end } },
          { startTime: { lte: start }, endTime: { gte: end } }
        ]
      }
    });

    // Evaluate Exclusive vs. Count-Based capacity rules
    const bConfig: any = facility.bookingConfig || {};
    const facilityName = facility.name.toLowerCase();
    const facilityCat = (facility.category || '').toLowerCase();
    const facilityDesc = [
      ...(Array.isArray(facility.rules) ? facility.rules : []),
      facility.description || '',
      facility.shortDescription || ''
    ].join(' ').toLowerCase();

    const exclusiveKeywords = ['party hall', 'banquet', 'turf', 'court', 'tennis', 'badminton', 'squash', 'field', 'bbq', 'cinema', 'auditorium', 'conference', 'boardroom', 'exclusive', 'private'];
    const isExplicitlyExclusive = bConfig.bookingType === 'EXCLUSIVE' || bConfig.occupancyMode === 'EXCLUSIVE' || bConfig.exclusive === true;
    const isExplicitlyShared = bConfig.bookingType === 'SHARED' || bConfig.occupancyMode === 'SHARED' || bConfig.bookingType === 'COUNT_BASED';
    
    const matchesExclusiveKeyword = exclusiveKeywords.some(kw => facilityName.includes(kw) || facilityCat.includes(kw) || facilityDesc.includes(kw));

    // A facility is treated as EXCLUSIVE (1 booking per time slot) if explicitly set or matching exclusive amenity types
    const isExclusive = isExplicitlyExclusive || (!isExplicitlyShared && matchesExclusiveKeyword);

    if (isExclusive) {
      if (conflictingBookings.length >= 1) {
        throw new ConflictException(`Already Reserved (Exclusive): "${facility.name}" operates under single-occupancy exclusive rules. This time slot is already reserved.`);
      }
    } else {
      // Count-based / shared amenity (e.g., Swimming Pool, Gym, Yoga Studio, Co-Working Area)
      const maxSlots = facility.capacity ? facility.capacity : (bConfig.maxConcurrent || 20);
      if (conflictingBookings.length >= maxSlots) {
        throw new ConflictException(`Capacity Reached: "${facility.name}" has reached its maximum concurrent capacity (${maxSlots} users) for this time slot.`);
      }
    }

    const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    const hourlyCost = facility.hourlyRate ? durationHours * facility.hourlyRate : 0;
    const totalCost = (dto.pricingBreakdown as any)?.total ?? hourlyCost;

    // Evaluate approval rules
    let initialStatus: any = 'PENDING';
    const appConfig = (facility.approvalConfig as any) || {};
    if (appConfig.type === 'AUTO') {
      initialStatus = 'CONFIRMED';
    } else if (appConfig.type === 'CONDITIONAL') {
      const maxAutoGuests = appConfig.conditionalRules?.maxAutoGuests || 10;
      if ((dto.attendeeCount || 1) <= maxAutoGuests) {
        initialStatus = 'CONFIRMED';
      }
    }

    const booking = await this.prisma.facilityBooking.create({
      data: {
        organizationId,
        facilityId,
        userId,
        startTime: start,
        endTime: end,
        totalCost,
        depositAmount: (dto.pricingBreakdown as any)?.deposit ?? facility.depositAmount ?? 0,
        attendeeCount: dto.attendeeCount || 1,
        notes: dto.notes || null,
        purpose: dto.purpose || null,
        customFieldValues: dto.customFieldValues || null,
        pricingBreakdown: dto.pricingBreakdown || null,
        status: initialStatus,
      }
    });

    return booking;
  }

  async findAll(organizationId: string, query: BookingQueryDto) {
    const { facilityId, userId, status, skip, take } = query;

    const where = {
      organizationId,
      ...(facilityId ? { facilityId } : {}),
      ...(userId ? { userId } : {}),
      ...(status ? { status } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.facilityBooking.findMany({
        where,
        skip,
        take,
        include: { facility: true, user: { select: { id: true, firstName: true, lastName: true, email: true } } },
        orderBy: { startTime: 'desc' },
      }),
      this.prisma.facilityBooking.count({ where }),
    ]);

    return { data: items, meta: { total, skip, take } };
  }

  async findOne(organizationId: string, id: string) {
    const booking = await this.prisma.facilityBooking.findFirst({
      where: { id, organizationId },
      include: { facility: true, user: { select: { id: true, firstName: true, lastName: true } } }
    });

    if (!booking) throw new NotFoundException('Booking not found');
    return booking;
  }

  async update(organizationId: string, id: string, dto: UpdateBookingDto, user?: any) {
    const booking = await this.findOne(organizationId, id);

    // Permission check
    if (user) {
      const isOwnerCancelling = dto.status === 'CANCELLED' && booking.userId === user.id && Object.keys(dto).length === 1;
      const isAdmin = user.roles?.includes('ORGANIZATION_ADMIN') || user.roles?.includes('BUILDING_MANAGER') || user.isPlatformAdmin;
      
      if (!isOwnerCancelling && !isAdmin) {
        throw new ForbiddenException('You do not have permission to update this booking.');
      }
    }

    return this.prisma.facilityBooking.update({
      where: { id },
      data: dto
    });
  }

  async generateQr(organizationId: string, id: string) {
    const booking = await this.findOne(organizationId, id);
    if (booking.status !== 'CONFIRMED') {
      throw new BadRequestException('QR codes are only available for confirmed bookings');
    }

    const qrData = Buffer.from(booking.id).toString('base64');
    const qrCodeImage = await qrcode.toDataURL(qrData);

    return { qrData, qrCodeImage };
  }

  async verifyQrAndCheckIn(organizationId: string, qrData: string) {
    try {
      let bookingId = qrData.trim();
      if (bookingId.startsWith('bmms-booking-verify:')) {
        bookingId = bookingId.replace('bmms-booking-verify:', '').trim();
      } else if (!bookingId.includes('-')) {
        try {
          bookingId = Buffer.from(bookingId, 'base64').toString('utf-8');
        } catch (err) {
          bookingId = qrData;
        }
      }

      const booking = await this.findOne(organizationId, bookingId);

      if (booking.status !== 'CONFIRMED' && booking.status !== 'APPROVED') {
        throw new BadRequestException('Booking must be in CONFIRMED status prior to executing check-in.');
      }
      
      const updated = await this.prisma.facilityBooking.update({
        where: { id: bookingId },
        data: { checkInTime: new Date() }
      });

      return { valid: true, booking: updated };
    } catch (e) {
      if (e instanceof NotFoundException || e instanceof BadRequestException) throw e;
      throw new BadRequestException('Invalid QR format or unrecognized reservation pass token.');
    }
  }

  async checkOut(organizationId: string, id: string) {
    await this.findOne(organizationId, id);
    return this.prisma.facilityBooking.update({
      where: { id },
      data: { checkOutTime: new Date(), status: 'COMPLETED' }
    });
  }
}
