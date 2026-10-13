import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Controller, Get, Post, Body, Patch, Param, UseGuards, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { FacilityBookingsService } from './facility-bookings.service';
import { CreateBookingDto, UpdateBookingDto, BookingQueryDto, VerifyBookingQrDto } from './dto/facility-booking.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ModuleGuard } from '../auth/guards/module.guard';
import { RequireModule } from '../auth/decorators/require-module.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Facility Bookings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard, ModuleGuard)
@RequireModule('SMARTI_FACILITY')
@Controller('facility-bookings')
export class FacilityBookingsController {
  constructor(private readonly service: FacilityBookingsService) {}

  @Post()
  @ApiOperation({ summary: 'Request to book a facility' })
  create(@CurrentUser() user: any, @Body() dto: CreateBookingDto) {
    return this.service.create(user.organizationId, user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all bookings (calendar data)' })
  findAll(@CurrentUser() user: any, @Query() query: BookingQueryDto) {
    return this.service.findAll(user.organizationId, query);
  }

  @Post('verify-qr')
  @RequirePermissions({ action: 'CREATE', subject: 'FacilityBooking' })
  @ApiOperation({ summary: 'Verify a booking QR code and check-in' })
  verifyQr(@CurrentUser() user: any, @Body() dto: VerifyBookingQrDto) {
    return this.service.verifyQrAndCheckIn(user.organizationId, dto.qrData);
  }

  @Get(':id/qr')
  @ApiOperation({ summary: 'Generate QR code for a confirmed booking' })
  generateQr(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.generateQr(user.organizationId, id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get booking by id' })
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.findOne(user.organizationId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Approve, reject, or update a booking (deposit tracking)' })
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: UpdateBookingDto) {
    return this.service.update(user.organizationId, id, dto, user);
  }

  @Post(':id/check-out')
  @RequirePermissions({ action: 'CREATE', subject: 'FacilityBooking' })
  @ApiOperation({ summary: 'Check out of a facility' })
  checkOut(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.checkOut(user.organizationId, id);
  }
}
