import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { AuthUser, LoginRequest, Permission } from '@marq/shared';
import { ActorType, AuditOutcome } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private auditService: AuditService,
  ) {}

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async login(dto: LoginRequest, ip?: string, userAgent?: string) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email },
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

    if (!user || user.deletedAt) {
      await this.auditService.record({
        actorType: ActorType.anonymous,
        action: 'auth:login_failed',
        entityType: 'User',
        entityId: email,
        outcome: AuditOutcome.failure,
        ip,
      });
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Cuenta desactivada');
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const waitMin = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      throw new ForbiddenException(`Cuenta temporalmente bloqueada por reiterados intentos fallidos. Intente nuevamente en ${waitMin} minutos.`);
    }

    const isValidPassword = await argon2.verify(user.passwordHash, dto.password);
    if (!isValidPassword) {
      const failedCount = user.failedLoginCount + 1;
      const lockedUntil = failedCount >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginCount: failedCount,
          lockedUntil,
        },
      });

      await this.auditService.record({
        actorUserId: user.id,
        action: failedCount >= 5 ? 'auth:account_locked' : 'auth:login_failed',
        entityType: 'User',
        entityId: user.id,
        outcome: AuditOutcome.failure,
        ip,
      });

      if (failedCount >= 5) {
        throw new ForbiddenException('Cuenta bloqueada por 15 minutos tras 5 intentos fallidos');
      }

      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Reset failed login counter and update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginCount: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      },
    });

    const roles = user.roles.map((r) => r.role.key);
    const permissionsSet = new Set<Permission>();
    user.roles.forEach((r) => {
      r.role.rolePermissions.forEach((rp) => {
        permissionsSet.add(rp.permission.key as Permission);
      });
    });

    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      roles,
      permissions: Array.from(permissionsSet),
    };

    const accessToken = await this.generateAccessToken(authUser);
    const rawRefreshToken = crypto.randomBytes(40).toString('hex');
    const familyId = crypto.randomUUID();
    const tokenHash = this.hashToken(rawRefreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 días

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        familyId,
        expiresAt,
        ip,
        userAgent,
      },
    });

    const csrfToken = crypto.randomBytes(24).toString('hex');

    await this.auditService.record({
      actorUserId: user.id,
      action: 'auth:login_success',
      entityType: 'User',
      entityId: user.id,
      ip,
    });

    return {
      user: authUser,
      accessToken,
      refreshToken: rawRefreshToken,
      csrfToken,
    };
  }

  async refresh(rawRefreshToken: string, ip?: string, userAgent?: string) {
    if (!rawRefreshToken) {
      throw new UnauthorizedException('Token de actualización ausente');
    }

    const tokenHash = this.hashToken(rawRefreshToken);
    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: {
        user: {
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
        },
      },
    });

    if (!tokenRecord) {
      throw new UnauthorizedException('Token de actualización no reconocido');
    }

    // Detección de reuso de token (OWASP A07): si ya fue revocado, invalidar toda la familia de tokens
    if (tokenRecord.revokedAt !== null) {
      await this.prisma.refreshToken.updateMany({
        where: { familyId: tokenRecord.familyId },
        data: { revokedAt: new Date() },
      });

      await this.auditService.record({
        actorUserId: tokenRecord.userId,
        action: 'auth:refresh_token_reuse_detected',
        entityType: 'RefreshToken',
        entityId: tokenRecord.id,
        outcome: AuditOutcome.failure,
        ip,
      });

      throw new UnauthorizedException('Alerta de seguridad: intento de reuso de sesión revocado');
    }

    if (tokenRecord.expiresAt < new Date()) {
      throw new UnauthorizedException('Sesión expirada');
    }

    if (!tokenRecord.user.isActive || tokenRecord.user.deletedAt) {
      throw new UnauthorizedException('Usuario inactivo');
    }

    // Revocar el token actual (rotación)
    await this.prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { revokedAt: new Date() },
    });

    // Generar nuevo refresh token en la misma familia
    const newRawRefreshToken = crypto.randomBytes(40).toString('hex');
    const newTokenHash = this.hashToken(newRawRefreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.prisma.refreshToken.create({
      data: {
        userId: tokenRecord.userId,
        tokenHash: newTokenHash,
        familyId: tokenRecord.familyId,
        expiresAt,
        ip,
        userAgent,
      },
    });

    const user = tokenRecord.user;
    const roles = user.roles.map((r) => r.role.key);
    const permissionsSet = new Set<Permission>();
    user.roles.forEach((r) => {
      r.role.rolePermissions.forEach((rp) => {
        permissionsSet.add(rp.permission.key as Permission);
      });
    });

    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      roles,
      permissions: Array.from(permissionsSet),
    };

    const accessToken = await this.generateAccessToken(authUser);
    const csrfToken = crypto.randomBytes(24).toString('hex');

    return {
      user: authUser,
      accessToken,
      refreshToken: newRawRefreshToken,
      csrfToken,
    };
  }

  async logout(rawRefreshToken?: string, userId?: string) {
    if (rawRefreshToken) {
      const tokenHash = this.hashToken(rawRefreshToken);
      await this.prisma.refreshToken.updateMany({
        where: { tokenHash, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    } else if (userId) {
      await this.prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    if (userId) {
      await this.auditService.record({
        actorUserId: userId,
        action: 'auth:logout',
        entityType: 'User',
        entityId: userId,
      });
    }
  }

  private async generateAccessToken(user: AuthUser): Promise<string> {
    const payload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
    };
    return this.jwtService.signAsync(payload, {
      secret: process.env.JWT_ACCESS_SECRET || 'marq-jwt-secret-dev-access-key-256bits',
      expiresIn: '15m',
    });
  }
}
