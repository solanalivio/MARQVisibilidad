import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PERMISSIONS, AdminUser, CreateUserRequest, UpdateUserRequest, AuthUser, UserRef } from '@marq/shared';

@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.USERS_MANAGE)
  async getUsers(): Promise<AdminUser[]> {
    return this.usersService.findAll();
  }

  @Get('assignable')
  @RequirePermissions(PERMISSIONS.CLIENTS_ASSIGN)
  async getAssignableAdvisors(): Promise<UserRef[]> {
    return this.usersService.findAssignableAdvisors();
  }

  @Post()
  @RequirePermissions(PERMISSIONS.USERS_MANAGE)
  async createUser(
    @Body() dto: CreateUserRequest,
    @CurrentUser() currentUser: AuthUser,
  ): Promise<AdminUser> {
    return this.usersService.create(dto, currentUser.id);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.USERS_MANAGE)
  async updateUser(
    @Param('id') id: string,
    @Body() dto: UpdateUserRequest,
    @CurrentUser() currentUser: AuthUser,
  ): Promise<AdminUser> {
    return this.usersService.update(id, dto, currentUser.id);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.USERS_MANAGE)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthUser,
  ): Promise<void> {
    await this.usersService.delete(id, currentUser.id);
  }
}
