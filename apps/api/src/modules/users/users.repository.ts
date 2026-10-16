import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class UsersRepository {
  constructor(private prisma: PrismaService) {}

  async findMany(where: Prisma.UserWhereInput = {}) {
    return this.prisma.user.findMany({
      where: { ...where, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  async findById(id: string) {
    return this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: {
        roles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findFirst({
      where: { email: email.toLowerCase().trim(), deletedAt: null },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  async create(data: { email: string; fullName: string; passwordHash: string; roleKeys: string[] }) {
    const roles = await this.prisma.role.findMany({
      where: { key: { in: data.roleKeys } },
    });

    return this.prisma.user.create({
      data: {
        email: data.email.toLowerCase().trim(),
        fullName: data.fullName.trim(),
        passwordHash: data.passwordHash,
        roles: {
          create: roles.map((r) => ({ roleId: r.id })),
        },
      },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  async update(id: string, data: { fullName?: string; isActive?: boolean; passwordHash?: string; roleKeys?: string[] }) {
    const updateData: Prisma.UserUpdateInput = {};
    if (data.fullName !== undefined) updateData.fullName = data.fullName.trim();
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.passwordHash !== undefined) updateData.passwordHash = data.passwordHash;

    if (data.roleKeys) {
      const roles = await this.prisma.role.findMany({
        where: { key: { in: data.roleKeys } },
      });
      await this.prisma.userRole.deleteMany({ where: { userId: id } });
      updateData.roles = {
        create: roles.map((r) => ({ roleId: r.id })),
      };
    }

    return this.prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  async softDelete(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }
}
