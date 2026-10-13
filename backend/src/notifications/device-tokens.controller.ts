import { Controller, Post, Body, Delete, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDeviceTokenDto } from './dto/device-token.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Device Tokens')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('device-tokens')
export class DeviceTokensController {
  constructor(private prisma: PrismaService) {}

  @Post()
  @ApiOperation({ summary: 'Register a device push token' })
  async registerToken(@CurrentUser() user: any, @Body() dto: RegisterDeviceTokenDto) {
    const existing = await this.prisma.deviceToken.findUnique({
      where: { token: dto.token }
    });

    if (existing) {
      if (existing.userId !== user.id) {
        return this.prisma.deviceToken.update({
          where: { id: existing.id },
          data: { userId: user.id }
        });
      }
      return existing;
    }

    return this.prisma.deviceToken.create({
      data: {
        userId: user.id,
        token: dto.token,
        platform: dto.platform
      }
    });
  }

  @Delete(':token')
  @ApiOperation({ summary: 'Unregister a device push token' })
  async removeToken(@CurrentUser() user: any, @Param('token') token: string) {
    return this.prisma.deviceToken.deleteMany({
      where: { token, userId: user.id }
    });
  }
}
