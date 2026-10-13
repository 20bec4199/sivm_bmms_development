import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Controller, Get, Post, Body, Param, Delete, UseGuards, Query, UseInterceptors, UploadedFile, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto, DocumentQueryDto } from './dto/document.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ModuleGuard } from '../auth/guards/module.guard';
import { RequireModule } from '../auth/decorators/require-module.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { Response } from 'express';

@ApiTags('Documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard, ModuleGuard)
@RequireModule('DOCUMENT')
@Controller('documents')
export class DocumentsController {
  constructor(private readonly service: DocumentsService) {}

  @Post()
  @RequirePermissions({ action: 'CREATE', subject: 'Document' })
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a new document' })
  upload(
    @CurrentUser() user: any, 
    @Body() dto: CreateDocumentDto,
    @UploadedFile() file: Express.Multer.File
  ) {
    return this.service.upload(user.organizationId, user.id, dto, file);
  }

  @Post(':id/version')
  @RequirePermissions({ action: 'CREATE', subject: 'Document' })
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a new version of a document' })
  uploadNewVersion(
    @CurrentUser() user: any, 
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File
  ) {
    return this.service.uploadNewVersion(user.organizationId, id, user.id, file);
  }

  @Get()
  @ApiOperation({ summary: 'Get all documents (with search and filter)' })
  findAll(@CurrentUser() user: any, @Query() query: DocumentQueryDto) {
    return this.service.findAll(user.organizationId, query);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Download document file' })
  async download(@CurrentUser() user: any, @Param('id') id: string, @Res() res: Response) {
    const fileData = await this.service.getFileStream(user.organizationId, id);
    
    if (fileData.type === 'azure') {
      return res.redirect(fileData.url as string);
    } else {
      return res.sendFile(fileData.path as string);
    }
  }

  @Delete(':id')
  @RequirePermissions({ action: 'DELETE', subject: 'Document' })
  @ApiOperation({ summary: 'Delete a document' })
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.remove(user.organizationId, id);
  }
}
