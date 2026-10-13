import { IsString, IsOptional, IsNumber, IsBoolean, IsArray, IsDateString, IsEnum } from 'class-validator';

export class CreateParkingAreaDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsNumber()
  totalSlots?: number;

  @IsOptional()
  @IsString()
  propertyNodeId?: string;
}

export class CreateParkingSlotDto {
  @IsString()
  areaId: string;

  @IsString()
  slotNumber: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  status?: string;
}

export class AllocateParkingSlotDto {
  @IsString()
  slotId: string;

  @IsOptional()
  @IsString()
  vehicleId?: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  visitorId?: string;

  @IsOptional()
  @IsString()
  propertyNodeId?: string;

  @IsOptional()
  @IsString()
  allocationType?: string;
}

export class CreateParkingViolationDto {
  @IsOptional()
  @IsString()
  slotId?: string;

  @IsOptional()
  @IsString()
  vehicleId?: string;

  @IsString()
  violationType: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  fineAmount?: number;
}

export class GateCheckInDto {
  @IsString()
  licensePlate: string;

  @IsOptional()
  @IsString()
  slotId?: string;

  @IsOptional()
  @IsString()
  visitorName?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  propertyNodeId?: string;
}

export class GateCheckOutDto {
  @IsString()
  slotId: string;
}

export class UpdateParkingConfigurationDto {
  @IsOptional()
  @IsString()
  parkingMode?: string;

  @IsOptional()
  @IsString()
  allocationModel?: string;

  @IsOptional()
  @IsBoolean()
  visitorParkingEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  reservationEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  paidParkingEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  evParkingEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  qrAccessEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  rfidAccessEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  anprEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  temporaryParkingEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  violationsEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  subscriptionsEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  dynamicPricingEnabled?: boolean;

  @IsOptional()
  settings?: any;
}

export class CreateParkingRuleDto {
  @IsString()
  name: string;

  @IsString()
  ruleType: string;

  @IsOptional()
  conditions?: any;

  @IsOptional()
  actions?: any;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateParkingReservationDto {
  @IsOptional()
  @IsString()
  slotId?: string;

  @IsOptional()
  @IsString()
  areaId?: string;

  @IsOptional()
  @IsString()
  vehicleId?: string;

  @IsString()
  startTime: string;

  @IsString()
  endTime: string;

  @IsOptional()
  @IsString()
  parkingType?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateParkingPermitDto {
  @IsString()
  permitType: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  vehicleId?: string;

  @IsOptional()
  @IsString()
  slotId?: string;

  @IsOptional()
  @IsString()
  validFrom?: string;

  @IsOptional()
  @IsString()
  validTo?: string;

  @IsOptional()
  metadata?: any;
}

export class CreateParkingRateDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  rateType?: string;

  @IsOptional()
  @IsNumber()
  baseAmount?: number;

  @IsOptional()
  @IsNumber()
  hourlyRate?: number;

  @IsOptional()
  @IsNumber()
  gracePeriodMinutes?: number;

  @IsOptional()
  @IsNumber()
  maxDailyAmount?: number;

  @IsOptional()
  @IsNumber()
  overnightAmount?: number;

  @IsOptional()
  @IsNumber()
  overstayPenaltyRate?: number;

  @IsOptional()
  @IsString()
  vehicleType?: string;
}

export class RecordParkingAccessEventDto {
  @IsString()
  eventType: string;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsString()
  deviceIdentifier?: string;

  @IsOptional()
  @IsString()
  licensePlate?: string;

  @IsOptional()
  @IsNumber()
  confidenceScore?: number;

  @IsOptional()
  @IsString()
  bayCode?: string;

  @IsOptional()
  payload?: any;
}

export class UpdateParkingBayStatusDto {
  @IsString()
  status: string; // AVAILABLE, OCCUPIED, RESERVED, BLOCKED, MAINTENANCE, OUT_OF_SERVICE

  @IsOptional()
  @IsString()
  maintenanceStatus?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateViolationWorkflowDto {
  @IsString()
  status: string; // REPORTED, UNDER_REVIEW, SECURITY_NOTIFIED, WARNING_ISSUED, TOWING_REQUESTED, RESOLVED, DISMISSED

  @IsOptional()
  @IsString()
  actionTaken?: string;
}

export class ParkingSessionEntryDto {
  @IsString()
  licensePlate: string;

  @IsOptional()
  @IsString()
  slotId?: string;

  @IsOptional()
  @IsString()
  areaId?: string;

  @IsOptional()
  @IsString()
  accessPoint?: string;

  @IsOptional()
  @IsString()
  entryMethod?: string;
}

export class ParkingSessionExitDto {
  @IsString()
  licensePlate: string;

  @IsOptional()
  @IsString()
  exitMethod?: string;
}

