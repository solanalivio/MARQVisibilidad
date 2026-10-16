import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { Permission, RoleView, ALL_PERMISSIONS, PERMISSION_DESCRIPTIONS } from '@marq/shared';

@Injectable()
export class RolesService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async findAll(): Promise<RoleView[]> {
    const roles = await this.prisma.role.findMany({
      orderBy: { key: 'asc' },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    return roles.map((r) => ({
      id: r.id,
      key: r.key,
      name: r.name,
      isSystem: r.isSystem,
      permissions: r.rolePermissions.map((rp) => rp.permission.key as Permission),
    }));
  }

  async findAllPermissions() {
    return ALL_PERMISSIONS.map((key) => ({
      key,
      description: PERMISSION_DESCRIPTIONS[key] || key,
    }));
  }

  async updatePermissions(roleId: string, permissions: Permission[], currentUserId?: string): Promise<RoleView> {
    const role = await this.prisma.role.findUnique({ where: { id: roleId } });
    if (!role) {
      throw new NotFoundException('Rol no encontrado');
    }

    const permissionRecords = await this.prisma.permission.findMany({
      where: { key: { in: permissions } },
    });

    await this.prisma.rolePermission.deleteMany({ where: { roleId } });
    await this.prisma.rolePermission.createMany({
      data: permissionRecords.map((p) => ({ roleId, permissionId: p.id })),
    });

    await this.auditService.record({
      actorUserId: currentUserId,
      action: 'roles:update_permissions',
      entityType: 'Role',
      entityId: roleId,
      changes: { permissions },
    });

    return {
      id: role.id,
      key: role.key,
      name: role.name,
      isSystem: role.isSystem,
      permissions,
    };
  }
}
