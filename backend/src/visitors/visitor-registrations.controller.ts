import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Controller, Get, Post, Body, Param, Patch, UseGuards, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { VisitorRegistrationsService } from './visitor-registrations.service';
import { CreateRegistrationDto, RegistrationQueryDto, VerifyQrDto, CheckInDto, CheckOutDto } from './dto/visitor-registration.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ModuleGuard } from '../auth/guards/module.guard';
import { RequireModule } from '../auth/decorators/require-module.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Visitor Registrations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard, ModuleGuard)
@RequireModule('SMARTI_VISIT')
@Controller('visitor-registrations')
export class VisitorRegistrationsController {
  constructor(private readonly service: VisitorRegistrationsService) {}

  @Post()
  @RequirePermissions({ action: 'CREATE', subject: 'VisitorRegistration' })
  @ApiOperation({ summary: 'Register a visitor, contractor, or delivery (generates QR)' })
  register(@CurrentUser() user: any, @Body() dto: CreateRegistrationDto) {
    return this.service.register(user, dto);
  }

  @Get()
  @RequirePermissions({ action: 'READ', subject: 'VisitorRegistration' })
  @ApiOperation({ summary: 'Get all registrations' })
  findAll(@CurrentUser() user: any, @Query() query: RegistrationQueryDto) {
    return this.service.findAll(user, query);
  }

  @Get(':id/pass')
  @RequirePermissions({ action: 'READ', subject: 'VisitorRegistration' })
  @ApiOperation({ summary: 'Get QR pass and details for a visitor registration' })
  getPass(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.getPass(user, id);
  }

  @Post('verify-qr')
  @RequirePermissions({ action: 'CREATE', subject: 'VisitorRegistration' })
  @ApiOperation({ summary: 'Verify a QR code' })
  verifyQr(@CurrentUser() user: any, @Body() dto: VerifyQrDto) {
    return this.service.verifyQr(user.organizationId, dto.qrData);
  }

  @Post(':id/check-in')
  @RequirePermissions({ action: 'CREATE', subject: 'VisitorRegistration' })
  @ApiOperation({ summary: 'Log visitor entry (check-in)' })
  checkIn(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: CheckInDto) {
    return this.service.checkIn(user.organizationId, id, dto.notes);
  }

  @Patch('logs/:logId/check-out')
  @RequirePermissions({ action: 'UPDATE', subject: 'VisitorRegistration' })
  @ApiOperation({ summary: 'Log visitor exit (check-out)' })
  checkOut(@CurrentUser() user: any, @Param('logId') logId: string, @Body() dto: CheckOutDto) {
    return this.service.checkOut(user.organizationId, logId, dto.notes);
  }
}
