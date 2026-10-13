import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTechnicianDto, UpdateTechnicianDto } from './dto/create-technician.dto';
import * as argon2 from 'argon2';

@Injectable()
export class TechniciansService {
  constructor(private prisma: PrismaService) {}

  async create(organizationId: string, currentUserId: string, dto: CreateTechnicianDto) {
    const { 
      firstName, lastName, email, phone, departmentId,
      employeeId, specialization, experience, shift, joiningDate, emergencyContact, 
      skills, availability, workingHours, status, assignedTowers, assignedBuildings 
    } = dto;

    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const passwordHash = await argon2.hash('Password123'); // Default password for new technician

    // Get or Create TECHNICIAN role ID
    let technicianRole = await this.prisma.role.findFirst({
      where: { organizationId, name: 'TECHNICIAN' }
    });
    
    if (!technicianRole) {
      technicianRole = await this.prisma.role.create({
        data: {
          name: 'TECHNICIAN',
          description: 'Maintenance Technician',
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
        departmentId: departmentId || null,
        userRoles: {
          create: [{ roleId: technicianRole.id }]
        },
        technicianProfile: {
          create: {
            organizationId,
            employeeId,
            specialization,
            experience,
            shift,
            joiningDate: joiningDate ? new Date(joiningDate) : undefined,
            emergencyContact,
            skills: skills || [],
            availability,
            workingHours,
            status: status || 'ACTIVE',
            assignedTowers: assignedTowers || [],
            assignedBuildings: assignedBuildings || []
          }
        }
      },
      include: {
        technicianProfile: true
      }
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _, ...result } = user;
    return result;
  }

  async findAll(organizationId: string) {
    const users = await this.prisma.user.findMany({
      where: {
        organizationId,
        technicianProfile: { isNot: null }
      },
      include: {
        technicianProfile: true,
        department: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return { data: users };
  }

  async findOne(organizationId: string, id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, organizationId, technicianProfile: { isNot: null } },
      include: {
        technicianProfile: true,
        department: { select: { id: true, name: true } }
      }
    });

    if (!user) throw new NotFoundException(`Technician not found`);
    return user;
  }

  async update(organizationId: string, currentUserId: string, id: string, dto: UpdateTechnicianDto) {
    await this.findOne(organizationId, id); // Ensure it exists

    const { 
      firstName, lastName, email, phone, departmentId,
      employeeId, specialization, experience, shift, joiningDate, emergencyContact, 
      skills, availability, workingHours, status, assignedTowers, assignedBuildings 
    } = dto;

    return this.prisma.user.update({
      where: { id },
      data: {
        firstName,
        lastName,
        email,
        emailNormalized: email ? email.toLowerCase().trim() : undefined,
        phone,
        departmentId: departmentId || null,
        technicianProfile: {
          update: {
            employeeId,
            specialization,
            experience,
            shift,
            joiningDate: joiningDate ? new Date(joiningDate) : undefined,
            emergencyContact,
            skills,
            availability,
            workingHours,
            status,
            assignedTowers,
            assignedBuildings
          }
        }
      },
      include: {
        technicianProfile: true
      }
    });
  }

  async remove(organizationId: string, currentUserId: string, id: string) {
    await this.findOne(organizationId, id);
    // Deleting the user will cascade delete the technicianProfile
    await this.prisma.user.delete({ where: { id } });
    return { success: true };
  }
}
