import { Controller, Get, Put, Param, Body, UseGuards } from '@nestjs/common';
import { RolesService } from './roles.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PERMISSIONS, AuthUser, Permission, RoleView } from '@marq/shared';

@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RolesController {
  constructor(private rolesService: RolesService) {}

  @Get('roles')
  @RequirePermissions(PERMISSIONS.ROLES_MANAGE)
  async getRoles(): Promise<RoleView[]> {
    return this.rolesService.findAll();
  }

  @Get('permissions')
  @RequirePermissions(PERMISSIONS.ROLES_MANAGE)
  async getPermissions() {
    return this.rolesService.findAllPermissions();
  }

  @Put('roles/:id/permissions')
  @RequirePermissions(PERMISSIONS.ROLES_MANAGE)
  async updateRolePermissions(
    @Param('id') id: string,
    @Body('permissions') permissions: Permission[],
    @CurrentUser() currentUser: AuthUser,
  ): Promise<RoleView> {
    return this.rolesService.updatePermissions(id, permissions, currentUser.id);
  }
}
