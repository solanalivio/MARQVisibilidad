import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { AuditService } from '../audit/audit.service';
import * as argon2 from 'argon2';
import { AdminUser, CreateUserRequest, PASSWORD_MIN_LENGTH, UpdateUserRequest, UserRef } from '@marq/shared';

@Injectable()
export class UsersService {
  constructor(
    private usersRepo: UsersRepository,
    private auditService: AuditService,
  ) {}

  async findAll(): Promise<AdminUser[]> {
    const users = await this.usersRepo.findMany();
    return users.map((u) => ({
      id: u.id,
      email: u.email,
      fullName: u.fullName,
      isActive: u.isActive,
      roles: u.roles.map((r) => r.role.key),
      lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : null,
      lockedUntil: u.lockedUntil ? u.lockedUntil.toISOString() : null,
      createdAt: u.createdAt.toISOString(),
    }));
  }

  async findAssignableAdvisors(): Promise<UserRef[]> {
    const users = await this.usersRepo.findMany({ isActive: true });
    return users.map((u) => ({ id: u.id, fullName: u.fullName }));
  }

  async create(dto: CreateUserRequest, currentUserId?: string): Promise<AdminUser> {
    const existing = await this.usersRepo.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Ya existe un usuario registrado con este correo electrónico');
    }

    if (!dto.password || dto.password.length < PASSWORD_MIN_LENGTH) {
      throw new BadRequestException(`La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres`);
    }

    const passwordHash = await argon2.hash(dto.password, {
      type: argon2.argon2id,
      memoryCost: 19456,
      timeCost: 2,
      parallelism: 1,
    });

    const user = await this.usersRepo.create({
      email: dto.email,
      fullName: dto.fullName,
      passwordHash,
      roleKeys: dto.roleKeys || [],
    });

    await this.auditService.record({
      actorUserId: currentUserId,
      action: 'users:create',
      entityType: 'User',
      entityId: user.id,
      changes: { email: user.email, fullName: user.fullName, roles: dto.roleKeys },
    });

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      isActive: user.isActive,
      roles: user.roles.map((r) => r.role.key),
      lastLoginAt: null,
      lockedUntil: null,
      createdAt: user.createdAt.toISOString(),
    };
  }

  async update(id: string, dto: UpdateUserRequest, currentUserId?: string): Promise<AdminUser> {
    const user = await this.usersRepo.findById(id);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    let passwordHash: string | undefined;
    if (dto.password) {
      if (dto.password.length < PASSWORD_MIN_LENGTH) {
        throw new BadRequestException(`La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres`);
      }
      passwordHash = await argon2.hash(dto.password, {
        type: argon2.argon2id,
        memoryCost: 19456,
        timeCost: 2,
        parallelism: 1,
      });
    }

    const updated = await this.usersRepo.update(id, {
      fullName: dto.fullName,
      isActive: dto.isActive,
      passwordHash,
      roleKeys: dto.roleKeys,
    });

    await this.auditService.record({
      actorUserId: currentUserId,
      action: 'users:update',
      entityType: 'User',
      entityId: updated.id,
      changes: {
        fullName: dto.fullName,
        isActive: dto.isActive,
        roles: dto.roleKeys,
        passwordChanged: Boolean(dto.password),
      },
    });

    return {
      id: updated.id,
      email: updated.email,
      fullName: updated.fullName,
      isActive: updated.isActive,
      roles: updated.roles.map((r) => r.role.key),
      lastLoginAt: updated.lastLoginAt ? updated.lastLoginAt.toISOString() : null,
      lockedUntil: updated.lockedUntil ? updated.lockedUntil.toISOString() : null,
      createdAt: updated.createdAt.toISOString(),
    };
  }

  async delete(id: string, currentUserId?: string): Promise<void> {
    const user = await this.usersRepo.findById(id);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    await this.usersRepo.softDelete(id);

    await this.auditService.record({
      actorUserId: currentUserId,
      action: 'users:delete',
      entityType: 'User',
      entityId: id,
    });
  }
}
