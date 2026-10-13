import { Controller, Get, Post, Patch, Body, Param, Delete, UseGuards, Query, Req } from '@nestjs/common';
import { ParkingService } from './parking.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { ModuleGuard } from '../auth/guards/module.guard';
import { RequireModule } from '../auth/decorators/require-module.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { 
  CreateParkingAreaDto, 
  CreateParkingSlotDto, 
  AllocateParkingSlotDto, 
  CreateParkingViolationDto,
  GateCheckInDto,
  GateCheckOutDto,
  UpdateParkingConfigurationDto,
  CreateParkingRuleDto,
  CreateParkingReservationDto,
  CreateParkingPermitDto,
  CreateParkingRateDto,
  RecordParkingAccessEventDto,
  UpdateParkingBayStatusDto,
  UpdateViolationWorkflowDto,
  ParkingSessionEntryDto,
  ParkingSessionExitDto
} from './dto/parking.dto';

@Controller('parking')
@UseGuards(JwtAuthGuard, ModuleGuard, PermissionsGuard)
@RequireModule('PARKING_MANAGEMENT')
export class ParkingController {
  constructor(private readonly parkingService: ParkingService) {}

  // --- Configuration Engine ---
  @Get('config')
  @RequirePermissions({ action: 'READ', subject: 'ParkingSlot' })
  getConfiguration(@Req() req) {
    return this.parkingService.getConfiguration(req.user.organizationId);
  }

  @Patch('config')
  @RequirePermissions({ action: 'UPDATE', subject: 'ParkingSlot' })
  updateConfiguration(@Req() req, @Body() dto: UpdateParkingConfigurationDto) {
    return this.parkingService.updateConfiguration(req.user.organizationId, dto);
  }

  // --- Rule Engine ---
  @Get('rules')
  @RequirePermissions({ action: 'READ', subject: 'ParkingSlot' })
  getRules(@Req() req) {
    return this.parkingService.getRules(req.user.organizationId);
  }

  @Post('rules')
  @RequirePermissions({ action: 'CREATE', subject: 'ParkingSlot' })
  createRule(@Req() req, @Body() dto: CreateParkingRuleDto) {
    return this.parkingService.createRule(req.user.organizationId, dto);
  }

  @Delete('rules/:id')
  @RequirePermissions({ action: 'DELETE', subject: 'ParkingSlot' })
  deleteRule(@Req() req, @Param('id') id: string) {
    return this.parkingService.deleteRule(req.user.organizationId, id);
  }

  // --- Interactive Visual Map ---
  @Get('map')
  @RequirePermissions({ action: 'READ', subject: 'ParkingSlot' })
  getVisualMap(@Req() req, @Query() query: any) {
    return this.parkingService.getVisualMap(req.user.organizationId, query);
  }

  @Patch('slots/:id/status')
  @RequirePermissions({ action: 'UPDATE', subject: 'ParkingSlot' })
  updateSlotStatus(@Req() req, @Param('id') id: string, @Body() dto: UpdateParkingBayStatusDto) {
    return this.parkingService.updateSlotStatus(req.user.organizationId, id, dto);
  }

  // --- Sessions & Gate Lifecycle ---
  @Get('sessions')
  @RequirePermissions({ action: 'READ', subject: 'ParkingSession' })
  getSessions(@Req() req, @Query() query: any) {
    return this.parkingService.getSessions(req.user.organizationId, query);
  }

  @Post('sessions/entry')
  @RequirePermissions({ action: 'CREATE', subject: 'ParkingSession' })
  createSessionEntry(@Req() req, @Body() dto: ParkingSessionEntryDto) {
    return this.parkingService.createSessionEntry(req.user.organizationId, dto);
  }

  @Post('sessions/exit')
  @RequirePermissions({ action: 'UPDATE', subject: 'ParkingSession' })
  createSessionExit(@Req() req, @Body() dto: ParkingSessionExitDto) {
    return this.parkingService.createSessionExit(req.user.organizationId, dto);
  }

  // --- Reservations ---
  @Get('reservations')
  @RequirePermissions({ action: 'READ', subject: 'ParkingReservation' })
  getReservations(@Req() req, @Query() query: any) {
    return this.parkingService.getReservations(req.user.organizationId, query);
  }

  @Post('reservations')
  @RequirePermissions({ action: 'CREATE', subject: 'ParkingReservation' })
  createReservation(@Req() req, @Body() dto: CreateParkingReservationDto) {
    return this.parkingService.createReservation(req.user.organizationId, req.user.id || req.user.userId, dto);
  }

  // --- Digital Permits ---
  @Get('permits')
  @RequirePermissions({ action: 'READ', subject: 'ParkingPermit' })
  getPermits(@Req() req, @Query() query: any) {
    return this.parkingService.getPermits(req.user.organizationId, query);
  }

  @Post('permits')
  @RequirePermissions({ action: 'CREATE', subject: 'ParkingPermit' })
  createPermit(@Req() req, @Body() dto: CreateParkingPermitDto) {
    return this.parkingService.createPermit(req.user.organizationId, dto);
  }

  // --- Rates & Pricing Engine ---
  @Get('rates')
  @RequirePermissions({ action: 'READ', subject: 'ParkingSlot' })
  getRates(@Req() req) {
    return this.parkingService.getRates(req.user.organizationId);
  }

  @Post('rates')
  @RequirePermissions({ action: 'CREATE', subject: 'ParkingSlot' })
  createRate(@Req() req, @Body() dto: CreateParkingRateDto) {
    return this.parkingService.createRate(req.user.organizationId, dto);
  }

  // --- Hardware-Agnostic Access Integration ---
  @Post('events')
  @RequirePermissions({ action: 'CREATE', subject: 'ParkingSlot' })
  recordAccessEvent(@Req() req, @Body() dto: RecordParkingAccessEventDto) {
    return this.parkingService.recordAccessEvent(req.user.organizationId, dto);
  }

  // --- Violation Workflow ---
  @Patch('violations/:id/workflow')
  @RequirePermissions({ action: 'UPDATE', subject: 'ParkingViolation' })
  updateViolationWorkflow(@Req() req, @Param('id') id: string, @Body() dto: UpdateViolationWorkflowDto) {
    return this.parkingService.updateViolationWorkflow(req.user.organizationId, id, dto);
  }

  // --- Analytics Dashboard ---
  @Get('analytics')
  @RequirePermissions({ action: 'READ', subject: 'ParkingSlot' })
  getAnalytics(@Req() req, @Query() query: any) {
    return this.parkingService.getAnalytics(req.user.organizationId, query);
  }

  // --- Preserved Core Endpoints ---
  @Get('my-parking')
  @RequirePermissions({ action: 'READ', subject: 'ParkingSlot' })
  getMyParking(@Req() req) {
    return this.parkingService.getMyParking(req.user);
  }

  @Post('gate/check-in')
  @RequirePermissions({ action: 'CREATE', subject: 'ParkingAllocation' })
  gateCheckIn(@Req() req, @Body() dto: GateCheckInDto) {
    return this.parkingService.gateCheckIn(req.user.organizationId, dto);
  }

  @Post('gate/check-out')
  @RequirePermissions({ action: 'DELETE', subject: 'ParkingAllocation' })
  gateCheckOut(@Req() req, @Body() dto: GateCheckOutDto) {
    return this.parkingService.gateCheckOut(req.user.organizationId, dto);
  }

  @Get('areas')
  @RequirePermissions({ action: 'READ', subject: 'ParkingArea' })
  getAreas(@Req() req) {
    return this.parkingService.getParkingAreas(req.user.organizationId);
  }

  @Post('areas')
  @RequirePermissions({ action: 'CREATE', subject: 'ParkingArea' })
  createArea(@Req() req, @Body() dto: CreateParkingAreaDto) {
    return this.parkingService.createParkingArea(req.user.organizationId, dto);
  }

  @Delete('areas/:id')
  @RequirePermissions({ action: 'DELETE', subject: 'ParkingArea' })
  deleteArea(@Req() req, @Param('id') id: string) {
    return this.parkingService.deleteParkingArea(req.user.organizationId, id);
  }

  @Get('slots')
  @RequirePermissions({ action: 'READ', subject: 'ParkingSlot' })
  getSlots(@Req() req, @Query('areaId') areaId?: string) {
    return this.parkingService.getParkingSlots(req.user.organizationId, areaId);
  }

  @Post('slots')
  @RequirePermissions({ action: 'CREATE', subject: 'ParkingSlot' })
  createSlot(@Req() req, @Body() dto: CreateParkingSlotDto) {
    return this.parkingService.createParkingSlot(req.user.organizationId, dto);
  }

  @Delete('slots/:id')
  @RequirePermissions({ action: 'DELETE', subject: 'ParkingSlot' })
  deleteSlot(@Req() req, @Param('id') id: string) {
    return this.parkingService.deleteParkingSlot(req.user.organizationId, id);
  }

  @Post('allocations')
  @RequirePermissions({ action: 'CREATE', subject: 'ParkingAllocation' })
  allocateSlot(@Req() req, @Body() dto: AllocateParkingSlotDto) {
    return this.parkingService.allocateSlot(req.user.organizationId, dto);
  }

  @Delete('allocations/:id')
  @RequirePermissions({ action: 'DELETE', subject: 'ParkingAllocation' })
  deallocateSlot(@Req() req, @Param('id') id: string) {
    return this.parkingService.deallocateSlot(req.user.organizationId, id);
  }

  @Get('violations')
  @RequirePermissions({ action: 'READ', subject: 'ParkingViolation' })
  getViolations(@Req() req) {
    return this.parkingService.getViolations(req.user.organizationId);
  }

  @Post('violations')
  @RequirePermissions({ action: 'CREATE', subject: 'ParkingViolation' })
  reportViolation(@Req() req, @Body() dto: CreateParkingViolationDto) {
    return this.parkingService.reportViolation(req.user.organizationId, req.user.id || req.user.userId, dto);
  }
}


