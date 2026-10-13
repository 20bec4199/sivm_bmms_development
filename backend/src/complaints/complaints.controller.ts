import { Controller, Get, Post, Body, Patch, Param, UseGuards, Query, Delete } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { ComplaintsService } from './complaints.service';
import { CreateComplaintDto, UpdateComplaintDto, ComplaintQueryDto } from './dto/complaint.dto';
import { CreateCommentDto } from './dto/complaint-comment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ModuleGuard } from '../auth/guards/module.guard';
import { RequireModule } from '../auth/decorators/require-module.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@ApiTags('Complaints')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, ModuleGuard, PermissionsGuard)
@RequireModule('SMARTI_CARE')
@Controller('complaints')
export class ComplaintsController {
  constructor(private readonly complaintsService: ComplaintsService) {}

  @Get('dashboard/statistics')
  @RequirePermissions({ action: 'READ', subject: 'Complaint' })
  @ApiOperation({ summary: 'Get complaint statistics for dashboard' })
  getStatistics(@CurrentUser() user: any) {
    return this.complaintsService.getStatistics(user);
  }

  @Post()
  @RequirePermissions({ action: 'CREATE', subject: 'Complaint' })
  @ApiOperation({ summary: 'Create a complaint' })
  create(@CurrentUser() user: any, @Body() dto: CreateComplaintDto) {
    return this.complaintsService.create(user.organizationId, user.id, dto);
  }

  @Get()
  @RequirePermissions({ action: 'READ', subject: 'Complaint' })
  @ApiOperation({ summary: 'Get all complaints' })
  findAll(@CurrentUser() user: any, @Query() query: ComplaintQueryDto) {
    if (user.roles?.includes('RESIDENT') || user.roles?.includes('TENANT')) {
      query.creatorId = user.id;
    } else if (user.roles?.includes('TECHNICIAN') && !user.roles?.includes('ORGANIZATION_ADMIN')) {
      query.assignedToId = user.id;
    }
    return this.complaintsService.findAll(user.organizationId, query);
  }

  @Get(':id')
  @RequirePermissions({ action: 'READ', subject: 'Complaint' })
  @ApiOperation({ summary: 'Get complaint by id (includes comments and history)' })
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.complaintsService.findOne(user, id);
  }

  @Patch(':id/status')
  @RequirePermissions({ action: 'UPDATE', subject: 'Complaint' })
  @ApiOperation({ summary: 'Update complaint status or priority' })
  updateStatus(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: UpdateComplaintDto) {
    return this.complaintsService.updateStatus(user, id, dto);
  }

  @Post(':id/comments')
  @RequirePermissions({ action: 'UPDATE', subject: 'Complaint' })
  @ApiOperation({ summary: 'Add a comment to a complaint' })
  addComment(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: CreateCommentDto) {
    return this.complaintsService.addComment(user, id, dto);
  }

  @Post(':id/attachments')
  @RequirePermissions({ action: 'UPDATE', subject: 'Complaint' })
  @ApiOperation({ summary: 'Add an attachment link to a complaint' })
  addAttachment(@CurrentUser() user: any, @Param('id') id: string, @Body() body: { fileUrl: string, fileName: string }) {
    return this.complaintsService.uploadAttachment(user, id, body.fileUrl, body.fileName);
  }

  @Delete(':id')
  @RequirePermissions({ action: 'DELETE', subject: 'Complaint' })
  @ApiOperation({ summary: 'Delete a complaint' })
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.complaintsService.remove(user, id);
  }
}
