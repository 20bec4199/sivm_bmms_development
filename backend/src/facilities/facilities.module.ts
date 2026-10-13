import { Module } from '@nestjs/common';
import { FacilitiesService } from './facilities.service';
import { FacilitiesController } from './facilities.controller';
import { FacilityBookingsService } from './facility-bookings.service';
import { FacilityBookingsController } from './facility-bookings.controller';

@Module({
  controllers: [FacilitiesController, FacilityBookingsController],
  providers: [FacilitiesService, FacilityBookingsService],
  exports: [FacilitiesService, FacilityBookingsService],
})
export class FacilitiesModule {}
