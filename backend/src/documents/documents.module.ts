import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import { DocumentCategoriesService } from './document-categories.service';
import { DocumentCategoriesController } from './document-categories.controller';

@Module({
  controllers: [DocumentsController, DocumentCategoriesController],
  providers: [StorageService, DocumentsService, DocumentCategoriesService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
