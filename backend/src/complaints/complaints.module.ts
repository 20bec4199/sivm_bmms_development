import { Module } from '@nestjs/common';
import { ComplaintsService } from './complaints.service';
import { ComplaintsController } from './complaints.controller';
import { ComplaintCategoriesService } from './complaint-categories.service';
import { ComplaintCategoriesController } from './complaint-categories.controller';

@Module({
  controllers: [ComplaintsController, ComplaintCategoriesController],
  providers: [ComplaintsService, ComplaintCategoriesService],
  exports: [ComplaintsService],
})
export class ComplaintsModule {}
