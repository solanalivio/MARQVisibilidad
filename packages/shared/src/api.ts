/**
 * Contrato HTTP de la API (prefijo `/api/v1`). Todos los cuerpos son JSON.
 *
 * Convenciones:
 * - IDs: UUID v4 (string). Los proyectos además tienen `slug` estable (el id de legacy/app.js).
 * - Instantes: ISO 8601 con zona (`2026-10-11T19:22:52.000Z`). Fechas de calendario: `YYYY-MM-DD`. Horas: `HH:MM`.
 * - Montos: number (USD para precios/presupuestos, ARS para inversión en campañas).
 * - Errores: `{ statusCode, message, error }` (formato estándar de NestJS). 401 = sin sesión, 403 = sin permiso.
 * - Sesión: cookies HttpOnly `marq_at` (access, 15 min) y `marq_rt` (refresh, 7 días, path /api/v1/auth).
 *   CSRF: cookie legible `marq_csrf`; todo POST/PUT/PATCH/DELETE autenticado debe enviar su valor en `X-CSRF-Token`.
 * - Los datos de clientes respetan el alcance del usuario: sin `clients:scope_all` solo se ven los asignados
 *   (incluidas las métricas del dashboard).
 */
import type {
  CampaignPlatform, CampaignStatus, Channel, ClientSegment, Financing, InteractionKind, InvestGoal, MeetingPlace,
  Modality, NewsType, PipelineStatus, ProjectCategory, ProjectStage, ShowroomEventType, TargetProfile, TaskCloseReason,
  TaskKind, TaskSource, Typology, VisitOutcome, WebEventType, ActorType, AuditOutcome,
} from './enums';
import type { Permission } from './permissions';

export type IsoDateTime = string;
export type IsoDate = string;
export type Uuid = string;

export interface UserRef { id: Uuid; fullName: string }

/* =====================================================================
 * AUTH
 *   POST /auth/login     body LoginRequest      → AuthUser (setea cookies)   · público, rate-limited
 *   POST /auth/refresh   (cookie marq_rt)       → AuthUser (rota refresh)
 *   POST /auth/logout                           → 204 (revoca y borra cookies)
 *   GET  /auth/me                               → AuthUser
 * ===================================================================== */
export interface LoginRequest { email: string; password: string }
export interface AuthUser {
  id: Uuid;
  email: string;
  fullName: string;
  roles: string[];
  permissions: Permission[];
}

/* =====================================================================
 * PÚBLICO (sin sesión)
 *   GET  /public/projects                → PublicProject[]  (solo publicados, ordenados por sortOrder)
 *   POST /public/events  body WebEventRequest → 204        (anónimo, sin PII, rate-limited)
 *   GET  /showroom/:token                → ShowroomView     (404 si el token no existe, expiró o fue revocado)
 *   POST /showroom/:token/events body ShowroomEventRequest → ShowroomView
 *   GET  /health                         → { status: 'ok' }
 * ===================================================================== */

export interface TeamMember { id: Uuid; name: string; role: string; description: string; imageUrl: string | null }

export interface NewsItem { id: Uuid; publishedOn: IsoDate; type: NewsType; title: string; body: string }

/** Volumen de un edificio en el mapa 3D, en metros. `offset` relativo al punto de la obra (antes de rotar). */
export interface MapVolume {
  offset: [number, number];
  size: [number, number];
  floors: number;
  /** Pieza maciza (techo, columna, cartel): una sola extrusión de `base` a `base + height` metros. */
  solid?: 'slab' | 'glass';
  base?: number;
  height?: number;
}

/** Ubicación de una obra en el mapa 3D (legacy/map3d.js: PLACES y AREAS). */
export interface MapPlacement {
  /** `building`: volumen extruido. `area`: loteo dibujado como zona circular aproximada. */
  kind: 'building' | 'area';
  lng: number;
  lat: number;
  address: string;
  /** Línea de tiempo: `reality` (terminado/en obra) o `future` (preventa/desarrollo). */
  phase: 'reality' | 'future';
  /** Orden dentro de la secuencia del mapa y de la lista lateral. */
  sequence: number;
  /** Se dibuja en dorado claro ("lo que viene"). */
  isFuture: boolean;
  floors?: number | null;
  /** Lado de la planta en metros (edificios de un solo volumen). */
  size?: number | null;
  rotation?: number | null;
  radius?: number | null;
  lotSize?: [number, number] | null;
  volumes?: MapVolume[] | null;
  boulevard?: { offset: [number, number]; size: [number, number] } | null;
}

export interface PublicProject {
  id: Uuid;
  slug: string;
  name: string;
  category: ProjectCategory;
  year: string | null;
  statusLabel: string;
  location: string;
  facts: string[];
  description: string;
  imageUrl: string;
  imageAlt: string;
  forSale: boolean;
  targetProfiles: TargetProfile[];
  stage: ProjectStage;
  livingHint: string | null;
  sortOrder: number;
  team: TeamMember[];
  news: NewsItem[];
  map: MapPlacement | null;
}

export interface WebEventRequest { type: WebEventType }

export interface ShowroomView {
  firstName: string;
  /** Perfil ya conocido del cliente (por su segmento). */
  profile: TargetProfile | null;
  /** Slugs de proyectos por los que consultó. */
  askedProjectSlugs: string[];
  /** Slugs elegidos por el asesor para este showroom. */
  pickedProjectSlugs: string[];
  visitRequested: boolean;
}

export type ShowroomEventRequest =
  | { type: 'open' }
  | { type: 'profile'; profile: TargetProfile }
  | { type: 'team'; projectSlug: string }
  | { type: 'visit'; projectSlug?: string | null };

/* =====================================================================
 * PROYECTOS (MARQ Contigo)
 *   GET    /projects                     → ProjectSummary[]          · projects:read
 *   GET    /projects/:id                 → ProjectDetail             · projects:read
 *   POST   /projects        body ProjectInput        → ProjectDetail · projects:write
 *   PATCH  /projects/:id    body Partial<ProjectInput> → ProjectDetail · projects:write
 *   DELETE /projects/:id                 → 204 (soft delete)          · projects:write
 *   PUT    /projects/:id/map body MapPlacement | null → ProjectDetail · projects:write
 *   POST   /projects/:id/news body NewsInput → NewsItem               · news:write
 *   PUT    /projects/:id/unit-types body UnitTypeInput[] → ProjectDetail · inventory:write
 * ===================================================================== */

export interface UnitType {
  id: Uuid;
  typology: Typology;
  areaM2: number;
  priceFromUsd: number;
  available: number;
  reserved: number;
}
export type UnitTypeInput = Omit<UnitType, 'id'>;

export interface ProjectMetrics {
  /** Interesados con etapa abierta, por segmento (respeta el alcance del usuario). */
  interestedActive: Record<ClientSegment, number>;
  closedDeals: number;
  meetings30d: number;
  scheduledAhead: number;
}

export interface ProjectSummary extends Omit<PublicProject, 'team' | 'news' | 'map'> {
  isPublished: boolean;
  totalUnits: number | null;
  salesPerMonth: number | null;
  unitTypes: UnitType[];
  latestNews: NewsItem | null;
  metrics: ProjectMetrics;
}

export interface ProjectDetail extends ProjectSummary {
  team: TeamMember[];
  news: NewsItem[];
  map: MapPlacement | null;
}

export interface ProjectInput {
  slug: string;
  name: string;
  category: ProjectCategory;
  year?: string | null;
  statusLabel: string;
  location: string;
  facts?: string[];
  description: string;
  imageUrl: string;
  imageAlt: string;
  forSale: boolean;
  targetProfiles?: TargetProfile[];
  stage: ProjectStage;
  livingHint?: string | null;
  totalUnits?: number | null;
  salesPerMonth?: number | null;
  isPublished?: boolean;
  sortOrder?: number;
}

export interface NewsInput { type: NewsType; title: string; body: string }

/* =====================================================================
 * CLIENTES (MARQ Contigo)
 *   GET    /clients?segment=&projectId=&q=&status=   → ClientListItem[]     · clients:read
 *   GET    /clients/:id                              → ClientDetail          · clients:read
 *   POST   /clients               body CreateClientRequest → ClientDetail    · clients:write
 *   PATCH  /clients/:id           body UpdateClientRequest → ClientDetail    · clients:write
 *   DELETE /clients/:id                              → 204 (soft delete)     · clients:delete
 *   PATCH  /clients/:id/status    body { status }    → ClientDetail          · clients:write
 *   POST   /clients/:id/interactions body LogInteractionRequest → ClientDetail · clients:write
 *   PUT    /clients/:id/next-task body NextTaskInput | { clear: true } → ClientDetail · clients:write
 *   PUT    /clients/:id/meeting   body ScheduleMeetingRequest → ClientDetail · clients:write
 *   GET    /clients/:id/recommendations              → ProjectRecommendation[] · clients:read
 *   POST   /clients/:id/showroom  body { projectIds } → ShowroomLinkCreated   · showroom:manage
 *   DELETE /clients/:id/showroom                      → 204 (revoca el link)  · showroom:manage
 *   POST   /clients/:id/followups body FollowupRequest → ClientDetail        · clients:write
 *   GET    /users/assignable                         → UserRef[]             · clients:assign
 * ===================================================================== */

export interface ClientProfile {
  typology?: Typology | null;
  budgetUsd?: number | null;
  financing?: Financing | null;
  goal?: InvestGoal | null;
  modality?: Modality | null;
  units?: number | null;
}

/** Próximo paso abierto (como máximo uno por cliente). */
export interface ClientTask {
  id: Uuid;
  kind: TaskKind;
  text: string;
  dueDate: IsoDate;
  dueTime: string | null;
  place: MeetingPlace | null;
  projectId: Uuid | null;
  source: TaskSource;
  createdAt: IsoDateTime;
  completedAt: IsoDateTime | null;
  closeReason: TaskCloseReason | null;
}

export interface Interaction {
  id: Uuid;
  occurredAt: IsoDateTime;
  kind: InteractionKind;
  channel: Channel | null;
  note: string;
  visitOutcome: VisitOutcome | null;
  projectId: Uuid | null;
  createdBy: UserRef | null;
}

export interface ShowroomSignal {
  id: Uuid;
  occurredAt: IsoDateTime;
  type: ShowroomEventType;
  projectId: Uuid | null;
  label: string;
}

export interface ClientListItem {
  id: Uuid;
  fullName: string;
  phone: string;
  email: string | null;
  segment: ClientSegment;
  status: PipelineStatus;
  source: Channel;
  campaign: { id: Uuid; name: string } | null;
  assignedUser: UserRef | null;
  profile: ClientProfile;
  projectIds: Uuid[];
  firstContactAt: IsoDateTime | null;
  lastInteraction: { occurredAt: IsoDateTime; kind: InteractionKind; channel: Channel | null } | null;
  openTask: ClientTask | null;
  /** Reuniones registradas (realizadas o no) para KPIs: fecha de calendario y resultado. */
  visits: { occurredOn: IsoDate; outcome: VisitOutcome; projectId: Uuid | null }[];
  createdAt: IsoDateTime;
}

export interface ClientShowroomInfo {
  id: Uuid;
  projectIds: Uuid[];
  createdAt: IsoDateTime;
  expiresAt: IsoDateTime;
}

export interface ClientDetail extends ClientListItem {
  notes: string;
  journey: string[];
  interactions: Interaction[];
  signals: ShowroomSignal[];
  /** Link activo (el token no se puede recuperar: solo se muestra al generarlo). */
  showroom: ClientShowroomInfo | null;
}

export interface NextTaskInput { text: string; dueDate: IsoDate }

export interface CreateClientRequest {
  fullName: string;
  /** Solo dígitos, con código de país (ej. 5493624000001). */
  phone: string;
  email?: string | null;
  segment: ClientSegment;
  source: Channel;
  campaignId?: Uuid | null;
  assignedUserId?: Uuid | null;
  projectIds?: Uuid[];
  profile?: ClientProfile;
  /** Qué consultó en el primer contacto: se registra como primera interacción. */
  firstNote: string;
  nextTask?: NextTaskInput | null;
}

export interface UpdateClientRequest {
  fullName?: string;
  phone?: string;
  email?: string | null;
  segment?: ClientSegment;
  source?: Channel;
  campaignId?: Uuid | null;
  assignedUserId?: Uuid | null;
  projectIds?: Uuid[];
  profile?: ClientProfile;
  notes?: string;
}

/**
 * Registrar una interacción (legacy: openLogDialog).
 * - mode `log`: interacción suelta. Si hay una reunión agendada, se mantiene y `nextTask` se ignora;
 *   si no, `nextTask` reemplaza al próximo paso (null = quitarlo, undefined = no tocarlo).
 * - mode `complete`: cumple el próximo paso abierto. Si era una reunión, `visitOutcome` es obligatorio
 *   y la interacción queda asociada al proyecto de la reunión. Luego se crea `nextTask` si viene.
 */
export interface LogInteractionRequest {
  mode: 'log' | 'complete';
  occurredOn: IsoDate;
  channel: Channel;
  note: string;
  status?: PipelineStatus;
  visitOutcome?: VisitOutcome;
  nextTask?: NextTaskInput | null;
}

export interface ScheduleMeetingRequest {
  date: IsoDate;
  time: string;
  place: MeetingPlace;
  projectId?: Uuid | null;
}

export interface ProjectRecommendation { projectId: Uuid; score: number; reasons: string[] }

export interface ShowroomLinkCreated {
  /** URL completa para enviar al cliente. Solo se devuelve en esta respuesta. */
  url: string;
  expiresAt: IsoDateTime;
  projectIds: Uuid[];
}

/** Registra que se envió (por WhatsApp) un aviso de novedad. */
export interface FollowupRequest { newsId: Uuid }

/* =====================================================================
 * CAMPAÑAS
 *   GET   /campaigns                    → Campaign[]   · campaigns:read
 *   POST  /campaigns   body CampaignInput → Campaign   · campaigns:write
 *   PATCH /campaigns/:id body Partial<CampaignInput> → Campaign · campaigns:write
 * ===================================================================== */
export interface Campaign {
  id: Uuid;
  name: string;
  platform: CampaignPlatform;
  status: CampaignStatus;
  projectId: Uuid | null;
  startedOn: IsoDate;
  spendArs: number;
  /** Leads informados por la plataforma de anuncios. */
  platformLeads: number;
  /** Derivados del CRM: clientes atribuidos a la campaña. */
  attributedClients: number;
  meetings: number;
  sales: number;
}
export interface CampaignInput {
  name: string;
  platform: CampaignPlatform;
  status: CampaignStatus;
  projectId?: Uuid | null;
  startedOn: IsoDate;
  spendArs: number;
  platformLeads: number;
}

/* =====================================================================
 * DASHBOARD
 *   GET /dashboard/summary → DashboardSummary · dashboard:read
 * ===================================================================== */
export interface VisitEntry { clientId: Uuid; clientName: string; time: string | null; projectId: Uuid | null }
export interface VisitDay { date: IsoDate; done: VisitEntry[]; noshow: VisitEntry[]; scheduled: VisitEntry[] }
export interface OriginSlice { key: string; value: number }

export interface DashboardSummary {
  today: IsoDate;
  /** Día -3 a +3 respecto de hoy. */
  visitsByDay: VisitDay[];
  portfolio: { active: number; bySegment: Record<ClientSegment, number> };
  leads: { last7Days: number; previous7Days: number };
  meetings: { doneThisMonth: number; aheadThisMonth: number; monthlyGoal: number };
  origins: { leads: OriginSlice[]; interacciones: OriginSlice[]; reuniones: OriginSlice[] };
  campaigns: Campaign[];
  projects: ProjectSummary[];
  web: { vivienda: number; inversion: number; visit: number };
}

/* =====================================================================
 * USUARIOS, ROLES Y AUDITORÍA
 *   GET    /users                         → AdminUser[]       · users:manage
 *   POST   /users   body CreateUserRequest → AdminUser        · users:manage
 *   PATCH  /users/:id body UpdateUserRequest → AdminUser      · users:manage
 *   DELETE /users/:id                     → 204 (desactiva + revoca sesiones) · users:manage
 *   GET    /roles                         → RoleView[]        · users:manage | roles:manage
 *   PUT    /roles/:id/permissions body { permissions } → RoleView · roles:manage
 *   GET    /permissions                   → { key, description }[] · roles:manage
 *   GET    /audit-logs?entityType=&entityId=&actorUserId=&action=&outcome=&from=&to=&page=&pageSize=
 *                                         → Paginated<AuditLogEntry> · audit:read
 * ===================================================================== */
export interface AdminUser {
  id: Uuid;
  email: string;
  fullName: string;
  isActive: boolean;
  roles: string[];
  lastLoginAt: IsoDateTime | null;
  lockedUntil: IsoDateTime | null;
  createdAt: IsoDateTime;
}
export interface CreateUserRequest { email: string; fullName: string; password: string; roleKeys: string[] }
export interface UpdateUserRequest { fullName?: string; isActive?: boolean; roleKeys?: string[]; password?: string }

export interface RoleView { id: Uuid; key: string; name: string; isSystem: boolean; permissions: Permission[] }

export interface AuditLogEntry {
  id: string;
  occurredAt: IsoDateTime;
  actor: UserRef | null;
  actorType: ActorType;
  action: string;
  entityType: string;
  entityId: string | null;
  changes: Record<string, unknown> | null;
  outcome: AuditOutcome;
  ip: string | null;
  requestId: string | null;
}

export interface Paginated<T> { items: T[]; total: number; page: number; pageSize: number }

/** Política de contraseñas (validada en API y en formularios). */
export const PASSWORD_MIN_LENGTH = 12;
