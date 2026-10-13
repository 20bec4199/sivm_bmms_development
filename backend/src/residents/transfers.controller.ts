import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { TransfersService } from './transfers.service';
import { CreateTransferDto, TransferQueryDto } from './dto/transfers.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Ownership Transfers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('ownership-transfers')
export class TransfersController {
  constructor(private readonly transfersService: TransfersService) {}

  @Post()
  @RequirePermissions({ action: 'CREATE', subject: 'UnitTransferHistory' })
  @ApiOperation({ summary: 'Transfer unit ownership' })
  create(@CurrentUser() user: any, @Body() createTransferDto: CreateTransferDto) {
    return this.transfersService.transferOwnership(user.organizationId, createTransferDto);
  }

  @Get()
  @RequirePermissions({ action: 'READ', subject: 'UnitTransferHistory' })
  @ApiOperation({ summary: 'Get unit transfer history' })
  findAll(@CurrentUser() user: any, @Query() query: TransferQueryDto) {
    return this.transfersService.findAll(user.organizationId, query);
  }
}
