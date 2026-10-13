import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { authConfig } from './config/auth.config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthRepository } from './repositories/auth.repository';
import { TokenService } from './services/token.service';
import { SessionService } from './services/session.service';
import { PasswordService } from './services/password.service';
import { AccountLockService } from './services/account-lock.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailModule } from '../email/email.module';
import { ModuleAccessService } from './services/module-access.service';

@Global()
@Module({
  imports: [
    // Expose authConfig under 'auth.*' namespace
    ConfigModule.forFeature(authConfig),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret:
          config.get<string>('auth.jwt.accessSecret') ??
          'fallback-secret-CHANGE-IN-PRODUCTION',
        signOptions: {
          expiresIn: 900, // 15 minutes in seconds (number avoids StringValue type issue)
        },
      }),
    }),
    PrismaModule,
    EmailModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthRepository,
    TokenService,
    SessionService,
    PasswordService,
    AccountLockService,
    ModuleAccessService,
    JwtStrategy,
    LocalStrategy,
  ],
  exports: [AuthService, JwtModule, ModuleAccessService, PasswordService, TokenService],
})
export class AuthModule {}
