import { Module } from '@nestjs/common';
import { AssetsService } from './assets.service';
import { AssetsController } from './assets.controller';
import { AssetCategoriesService } from './asset-categories.service';
import { AssetCategoriesController } from './asset-categories.controller';
import { AssetDocumentsService } from './asset-documents.service';
import { AssetDocumentsController } from './asset-documents.controller';

@Module({
  controllers: [AssetsController, AssetCategoriesController, AssetDocumentsController],
  providers: [AssetsService, AssetCategoriesService, AssetDocumentsService],
  exports: [AssetsService],
})
export class AssetsModule {}
