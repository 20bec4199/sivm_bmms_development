import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Controller, Get, Post, Body, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { DocumentCategoriesService } from './document-categories.service';
import { CreateDocumentCategoryDto } from './dto/document-category.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ModuleGuard } from '../auth/guards/module.guard';
import { RequireModule } from '../auth/decorators/require-module.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Document Categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard, ModuleGuard)
@RequireModule('DOCUMENT')
@Controller('document-categories')
export class DocumentCategoriesController {
  constructor(private readonly service: DocumentCategoriesService) {}

  @Post()
  @RequirePermissions({ action: 'CREATE', subject: 'DocumentCategory' })
  @ApiOperation({ summary: 'Create a document category' })
  create(@CurrentUser() user: any, @Body() dto: CreateDocumentCategoryDto) {
    return this.service.create(user.organizationId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all document categories' })
  findAll(@CurrentUser() user: any) {
    return this.service.findAll(user.organizationId);
  }

  @Delete(':id')
  @RequirePermissions({ action: 'DELETE', subject: 'DocumentCategory' })
  @ApiOperation({ summary: 'Delete a document category' })
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.remove(user.organizationId, id);
  }
}
