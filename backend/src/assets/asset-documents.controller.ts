import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Controller, Post, Body, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { AssetDocumentsService } from './asset-documents.service';
import { CreateAssetDocumentDto } from './dto/asset-document.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ModuleGuard } from '../auth/guards/module.guard';
import { RequireModule } from '../auth/decorators/require-module.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Asset Documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard, ModuleGuard)
@RequireModule('SMARTI_ASSET')
@Controller('asset-documents')
export class AssetDocumentsController {
  constructor(private readonly service: AssetDocumentsService) {}

  @Post()
  @RequirePermissions({ action: 'CREATE', subject: 'AssetDocument' })
  @ApiOperation({ summary: 'Add a document link to an asset' })
  create(@CurrentUser() user: any, @Body() dto: CreateAssetDocumentDto) {
    return this.service.addDocument(user.organizationId, dto);
  }

  @Delete(':id')
  @RequirePermissions({ action: 'DELETE', subject: 'AssetDocument' })
  @ApiOperation({ summary: 'Remove a document from an asset' })
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.removeDocument(user.organizationId, id);
  }
}
