import { Module } from '@nestjs/common';
import { VisitorsService } from './visitors.service';
import { VisitorsController } from './visitors.controller';
import { VisitorRegistrationsService } from './visitor-registrations.service';
import { VisitorRegistrationsController } from './visitor-registrations.controller';

@Module({
  controllers: [VisitorsController, VisitorRegistrationsController],
  providers: [VisitorsService, VisitorRegistrationsService],
  exports: [VisitorsService, VisitorRegistrationsService],
})
export class VisitorsModule {}
