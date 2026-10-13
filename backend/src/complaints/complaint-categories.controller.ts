import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Controller, Get, Post, Body, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { ComplaintCategoriesService } from './complaint-categories.service';
import { CreateComplaintCategoryDto } from './dto/complaint-category.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ModuleGuard } from '../auth/guards/module.guard';
import { RequireModule } from '../auth/decorators/require-module.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Complaint Categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, ModuleGuard)
@RequireModule('SMARTI_CARE')
@Controller('complaint-categories')
export class ComplaintCategoriesController {
  constructor(private readonly service: ComplaintCategoriesService) {}

  @Post()
  @RequirePermissions({ action: 'CREATE', subject: 'ComplaintCategory' })
  @ApiOperation({ summary: 'Create complaint category' })
  create(@CurrentUser() user: any, @Body() dto: CreateComplaintCategoryDto) {
    return this.service.create(user.organizationId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all complaint categories' })
  findAll(@CurrentUser() user: any) {
    return this.service.findAll(user.organizationId);
  }

  @Delete(':id')
  @RequirePermissions({ action: 'DELETE', subject: 'ComplaintCategory' })
  @ApiOperation({ summary: 'Delete complaint category' })
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.remove(user.organizationId, id);
  }
}
