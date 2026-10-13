import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBuildingManagerDto } from './dto/create-building-manager.dto';
import * as argon2 from 'argon2';

@Injectable()
export class BuildingManagersService {
  constructor(private prisma: PrismaService) {}

  async create(organizationId: string, currentUserId: string, dto: CreateBuildingManagerDto) {
    const { firstName, lastName, email, phone, assignedBuildingIds } = dto;

    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const passwordHash = await argon2.hash('Password123'); // Default password for new manager

    // Get or Create BUILDING_MANAGER role ID
    let managerRole = await this.prisma.role.findFirst({
      where: { organizationId, name: 'BUILDING_MANAGER' }
    });
    
    if (!managerRole) {
      managerRole = await this.prisma.role.create({
        data: {
          name: 'BUILDING_MANAGER',
          description: 'Building Manager',
          organizationId
        }
      });
    }

    const user = await this.prisma.user.create({
      data: {
        organizationId,
        email,
        emailNormalized: email.toLowerCase().trim(),
        firstName,
        lastName,
        phone,
        passwordHash,
        emailVerified: true,
        emailVerifiedAt: new Date(),
        userRoles: {
          create: [{ roleId: managerRole.id }]
        },
        userPropertyNodes: {
          create: assignedBuildingIds.map(nodeId => ({
            propertyNodeId: nodeId,
            accessLevel: 'MANAGE',
            organizationId
          }))
        }
      },
      include: {
        userPropertyNodes: { include: { propertyNode: true } },
        userRoles: { include: { role: true } }
      }
    });

    const { passwordHash: _, ...result } = user;
    return result;
  }

  async findAll(organizationId: string) {
    return this.prisma.user.findMany({
      where: {
        organizationId,
        userRoles: {
          some: {
            role: { name: 'BUILDING_MANAGER' }
          }
        }
      },
      include: {
        userPropertyNodes: { include: { propertyNode: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async remove(organizationId: string, id: string) {
    // Delete only if they belong to this org and have the role
    const manager = await this.prisma.user.findFirst({
      where: { id, organizationId, userRoles: { some: { role: { name: 'BUILDING_MANAGER' } } } }
    });

    if (!manager) {
      throw new NotFoundException('Building Manager not found');
    }

    return this.prisma.user.delete({ where: { id } });
  }
}
