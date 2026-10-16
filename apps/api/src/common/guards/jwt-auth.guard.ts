import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthUser, Permission } from '@marq/shared';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('Sesión no iniciada o token no provisto');
    }

    // CSRF Double Submit Cookie Check for Cookie-based auth on mutating requests
    if (request.cookies?.['marq_at'] && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
      const csrfCookie = request.cookies?.['marq_csrf'];
      const csrfHeader = request.headers['x-csrf-token'];
      if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
        throw new ForbiddenException('Token CSRF inválido o ausente');
      }
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_ACCESS_SECRET || 'marq-jwt-secret-dev-access-key-256bits',
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
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

      if (!user || !user.isActive || user.deletedAt) {
        throw new UnauthorizedException('Usuario inactivo o no encontrado');
      }

      const roles = user.roles.map(r => r.role.key);
      const permissionsSet = new Set<Permission>();
      user.roles.forEach(r => {
        r.role.rolePermissions.forEach(rp => {
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

      request.user = authUser;
      return true;
    } catch (err: any) {
      if (err instanceof ForbiddenException) throw err;
      throw new UnauthorizedException('Token de acceso inválido o expirado');
    }
  }

  private extractToken(request: any): string | null {
    if (request.cookies && request.cookies['marq_at']) {
      return request.cookies['marq_at'];
    }
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    return null;
  }
}
