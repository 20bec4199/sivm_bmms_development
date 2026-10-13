import { Controller, Get, Post, Body, Param, UseGuards, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { VisitorsService } from './visitors.service';
import { CreateVisitorDto, VisitorQueryDto } from './dto/visitor.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ModuleGuard } from '../auth/guards/module.guard';
import { RequireModule } from '../auth/decorators/require-module.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@ApiTags('Visitors')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, ModuleGuard, PermissionsGuard)
@RequireModule('SMARTI_VISIT')
@Controller('visitors')
export class VisitorsController {
  constructor(private readonly visitorsService: VisitorsService) {}

  @Post()
  @RequirePermissions({ action: 'CREATE', subject: 'Visitor' })
  @ApiOperation({ summary: 'Create a new visitor record' })
  create(@CurrentUser() user: any, @Body() dto: CreateVisitorDto) {
    return this.visitorsService.create(user, dto);
  }

  @Get()
  @RequirePermissions({ action: 'READ', subject: 'Visitor' })
  @ApiOperation({ summary: 'Search and get visitors' })
  findAll(@CurrentUser() user: any, @Query() query: VisitorQueryDto) {
    return this.visitorsService.findAll(user, query);
  }

  @Get(':id')
  @RequirePermissions({ action: 'READ', subject: 'Visitor' })
  @ApiOperation({ summary: 'Get visitor by id including visit history' })
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.visitorsService.findOne(user, id);
  }
}
