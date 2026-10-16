/**
 * Catálogo de permisos (formato `recurso:accion`) y roles semilla del RBAC.
 * La API es la única fuente de verdad en tiempo de ejecución (tabla permissions / role_permissions);
 * este catálogo se usa para sembrar la base y para que el frontend oculte acciones no permitidas.
 */
export const PERMISSIONS = {
  DASHBOARD_READ: 'dashboard:read',
  CLIENTS_READ: 'clients:read',
  CLIENTS_WRITE: 'clients:write',
  CLIENTS_DELETE: 'clients:delete',
  CLIENTS_EXPORT: 'clients:export',
  /** Sin este permiso, un usuario solo ve y edita los clientes que tiene asignados. */
  CLIENTS_SCOPE_ALL: 'clients:scope_all',
  CLIENTS_ASSIGN: 'clients:assign',
  SHOWROOM_MANAGE: 'showroom:manage',
  PROJECTS_READ: 'projects:read',
  PROJECTS_WRITE: 'projects:write',
  NEWS_WRITE: 'news:write',
  INVENTORY_WRITE: 'inventory:write',
  CAMPAIGNS_READ: 'campaigns:read',
  CAMPAIGNS_WRITE: 'campaigns:write',
  USERS_MANAGE: 'users:manage',
  ROLES_MANAGE: 'roles:manage',
  AUDIT_READ: 'audit:read',
} as const;
export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
export const ALL_PERMISSIONS: readonly Permission[] = Object.values(PERMISSIONS);

export const PERMISSION_DESCRIPTIONS: Record<Permission, string> = {
  'dashboard:read': 'Ver el resumen comercial',
  'clients:read': 'Ver clientes',
  'clients:write': 'Crear y editar clientes, interacciones y próximos pasos',
  'clients:delete': 'Eliminar clientes',
  'clients:export': 'Exportar la cartera',
  'clients:scope_all': 'Ver toda la cartera (no solo los clientes asignados)',
  'clients:assign': 'Asignar clientes a asesores',
  'showroom:manage': 'Generar y revocar showrooms personales',
  'projects:read': 'Ver proyectos en MARQ Contigo',
  'projects:write': 'Crear y editar proyectos y su ubicación en el mapa',
  'news:write': 'Publicar novedades de proyectos',
  'inventory:write': 'Actualizar stock por tipología',
  'campaigns:read': 'Ver campañas',
  'campaigns:write': 'Crear y editar campañas',
  'users:manage': 'Administrar usuarios',
  'roles:manage': 'Administrar roles y permisos',
  'audit:read': 'Ver el registro de auditoría',
};

export const ROLE_KEYS = ['admin', 'gerente', 'asesor', 'contenido', 'auditor'] as const;
export type RoleKey = (typeof ROLE_KEYS)[number];

const P = PERMISSIONS;
export const SEED_ROLES: Record<RoleKey, { name: string; permissions: readonly Permission[] }> = {
  admin: { name: 'Administrador', permissions: ALL_PERMISSIONS },
  gerente: {
    name: 'Gerente comercial',
    permissions: [
      P.DASHBOARD_READ, P.CLIENTS_READ, P.CLIENTS_WRITE, P.CLIENTS_DELETE, P.CLIENTS_EXPORT, P.CLIENTS_SCOPE_ALL,
      P.CLIENTS_ASSIGN, P.SHOWROOM_MANAGE, P.PROJECTS_READ, P.PROJECTS_WRITE, P.NEWS_WRITE, P.INVENTORY_WRITE,
      P.CAMPAIGNS_READ, P.CAMPAIGNS_WRITE,
    ],
  },
  asesor: {
    name: 'Asesor comercial',
    permissions: [P.DASHBOARD_READ, P.CLIENTS_READ, P.CLIENTS_WRITE, P.SHOWROOM_MANAGE, P.PROJECTS_READ, P.CAMPAIGNS_READ],
  },
  contenido: {
    name: 'Contenido y proyectos',
    permissions: [P.PROJECTS_READ, P.PROJECTS_WRITE, P.NEWS_WRITE, P.INVENTORY_WRITE],
  },
  auditor: { name: 'Auditor', permissions: [P.AUDIT_READ] },
};
