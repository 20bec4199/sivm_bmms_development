import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { PropertiesModule } from './properties/properties.module';
import { BlocksModule } from './blocks/blocks.module';
import { UnitsModule } from './units/units.module';
import { UsersModule } from './users/users.module';
import { ResidentsModule } from './residents/residents.module';
import { ComplaintsModule } from './complaints/complaints.module';
import { VisitorsModule } from './visitors/visitors.module';
import { FacilitiesModule } from './facilities/facilities.module';
import { DocumentsModule } from './documents/documents.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AssetsModule } from './assets/assets.module';
import { MaintenanceModule } from './maintenance/maintenance.module';
import { FloorsModule } from './floors/floors.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { EmailModule } from './email/email.module';
import { RolesModule } from './roles/roles.module';
import { TechniciansModule } from './technicians/technicians.module';
import { BuildingManagersModule } from './building-managers/building-managers.module';
import { AuditModule } from './audit/audit.module';
import { AuditInterceptor } from './audit/audit.interceptor';
import { ParkingModule } from './parking/parking.module';
import { PackagesModule } from './packages/packages.module';
import { AlertsModule } from './alerts/alerts.module';
import { RedisModule } from './redis/redis.module';
import { SecurityModule } from './security/security.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    PrismaModule,
    AuthModule,
    PropertiesModule,
    BlocksModule,
    FloorsModule,
    UnitsModule,
    UsersModule,
    ResidentsModule,
    ComplaintsModule,
    VisitorsModule,
    FacilitiesModule,
    DocumentsModule,
    NotificationsModule,
    AssetsModule,
    MaintenanceModule,
    OrganizationsModule,
    EmailModule,
    RolesModule,
    TechniciansModule,
    BuildingManagersModule,
    AuditModule,
    ParkingModule,
    PackagesModule,
    AlertsModule,
    RedisModule,
    SecurityModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Global JWT guard — every route requires authentication unless @Public() is used
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // Global Audit Interceptor — automatically records mutations across all modules
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule {}

