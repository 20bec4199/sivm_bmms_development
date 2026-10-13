import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { ModuleGuard } from '../auth/guards/module.guard';
import { RequireModule } from '../auth/decorators/require-module.decorator';
import { Controller, Get, Post, Body, Patch, Param, UseGuards, Query, Delete } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { WorkOrdersService } from './work-orders.service';
import { CreateWorkOrderDto, UpdateWorkOrderDto, WorkOrderQueryDto, AddHistoryDto } from './dto/work-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Work Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, ModuleGuard, PermissionsGuard)
@RequireModule('WORK_ORDERS')
@Controller('work-orders')
export class WorkOrdersController {
  constructor(private readonly service: WorkOrdersService) {}

  @Post()
  @RequirePermissions({ action: 'CREATE', subject: 'WorkOrder' })
  @ApiOperation({ summary: 'Create a work order' })
  create(@CurrentUser() user: any, @Body() dto: CreateWorkOrderDto) {
    return this.service.create(user.organizationId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Search and get work orders' })
  findAll(@CurrentUser() user: any, @Query() query: WorkOrderQueryDto) {
    if (user.roles?.includes('TECHNICIAN') && !user.roles?.includes('ORGANIZATION_ADMIN')) {
      query.assignedToId = user.id;
    }
    return this.service.findAll(user.organizationId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get work order by id' })
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.findOne(user.organizationId, id);
  }

  @Patch(':id')
  @RequirePermissions({ action: 'UPDATE', subject: 'WorkOrder' })
  @ApiOperation({ summary: 'Update work order (status, assignments, etc.)' })
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: UpdateWorkOrderDto) {
    return this.service.update(user.organizationId, id, dto);
  }

  @Patch(':id/checklists/:checklistId/toggle')
  @RequirePermissions({ action: 'UPDATE', subject: 'WorkOrder' })
  @ApiOperation({ summary: 'Check/uncheck a checklist item on a work order' })
  toggleChecklist(
    @CurrentUser() user: any, 
    @Param('id') id: string,
    @Param('checklistId') checklistId: string,
    @Body('isCompleted') isCompleted: boolean
  ) {
    return this.service.toggleChecklist(user.organizationId, id, checklistId, isCompleted);
  }

  @Post(':id/history')
  @RequirePermissions({ action: 'CREATE', subject: 'WorkOrder' })
  @ApiOperation({ summary: 'Add a maintenance log/history note' })
  addHistory(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: AddHistoryDto) {
    return this.service.addHistory(user.organizationId, id, dto);
  }

  @Delete(':id')
  @RequirePermissions({ action: 'DELETE', subject: 'WorkOrder' })
  @ApiOperation({ summary: 'Delete a work order' })
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.remove(user.organizationId, id);
  }
}
