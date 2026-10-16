/**
 * Enums del dominio. Los valores (claves) son idénticos en PostgreSQL (enums de Prisma),
 * en la API y en el frontend; las etiquetas en castellano solo se usan para mostrar.
 * Origen: constantes de legacy/app.js (STATUSES, CHANNELS, TYPOLOGIES, etc.).
 */

const defineEnum = <const T extends readonly string[]>(values: T) => values;
export type EnumValue<T extends readonly string[]> = T[number];

/* ---------- Clientes / pipeline comercial ---------- */

export const PIPELINE_STATUSES = defineEnum([
  'nuevo_contacto',
  'en_conversacion',
  'informacion_enviada',
  'visita_agendada',
  'en_negociacion',
  'cerro_operacion',
  'sin_interes',
]);
export type PipelineStatus = EnumValue<typeof PIPELINE_STATUSES>;
export const PIPELINE_STATUS_LABELS: Record<PipelineStatus, string> = {
  nuevo_contacto: 'Nuevo contacto',
  en_conversacion: 'En conversación',
  informacion_enviada: 'Información enviada',
  visita_agendada: 'Visita agendada',
  en_negociacion: 'En negociación',
  cerro_operacion: 'Cerró operación',
  sin_interes: 'Sin interés por ahora',
};
export const CLOSED_STATUSES: readonly PipelineStatus[] = ['cerro_operacion', 'sin_interes'];
/** Columnas del tablero de particulares (sin "sin interés", que se lista aparte). */
export const BOARD_COLUMNS: readonly PipelineStatus[] = PIPELINE_STATUSES.filter(status => status !== 'sin_interes');
/** Clase CSS de tono por estado (ver legacy/styles.css). */
export const PIPELINE_STATUS_TONES: Record<PipelineStatus, string> = {
  nuevo_contacto: 'tone-new',
  en_conversacion: 'tone-active',
  informacion_enviada: 'tone-active',
  visita_agendada: 'tone-warm',
  en_negociacion: 'tone-warm',
  cerro_operacion: 'tone-done',
  sin_interes: 'tone-muted',
};

export const CLIENT_SEGMENTS = defineEnum(['inversor', 'particular']);
export type ClientSegment = EnumValue<typeof CLIENT_SEGMENTS>;
export const CLIENT_SEGMENT_LABELS: Record<ClientSegment, { label: string; plural: string; mark: string }> = {
  inversor: { label: 'Inversor', plural: 'Inversores', mark: '▲' },
  particular: { label: 'Particular', plural: 'Particulares', mark: '●' },
};

export const CHANNELS = defineEnum([
  'whatsapp',
  'llamada',
  'reunion',
  'visita',
  'email',
  'instagram',
  'facebook',
  'sitio_web',
  'presencial',
]);
export type Channel = EnumValue<typeof CHANNELS>;
export const CHANNEL_LABELS: Record<Channel, string> = {
  whatsapp: 'WhatsApp',
  llamada: 'Llamada',
  reunion: 'Reunión',
  visita: 'Visita',
  email: 'Email',
  instagram: 'Instagram',
  facebook: 'Facebook',
  sitio_web: 'Sitio web',
  presencial: 'Presencial',
};

/**
 * Tipo de entrada del historial. `contacto` es una interacción real por un canal;
 * el resto son entradas generadas por el sistema (en legacy usaban channel 'Estado', 'Agenda', 'Showroom').
 */
export const INTERACTION_KINDS = defineEnum(['contacto', 'estado', 'agenda', 'showroom', 'recontacto']);
export type InteractionKind = EnumValue<typeof INTERACTION_KINDS>;
export const INTERACTION_KIND_LABELS: Record<InteractionKind, string> = {
  contacto: 'Contacto',
  estado: 'Estado',
  agenda: 'Agenda',
  showroom: 'Showroom',
  recontacto: 'Recontacto',
};

export const VISIT_OUTCOMES = defineEnum(['done', 'noshow']);
export type VisitOutcome = EnumValue<typeof VISIT_OUTCOMES>;

/* ---------- Perfil comercial ---------- */

export const TYPOLOGIES = defineEnum(['monoambiente', 'un_dormitorio', 'dos_dormitorios', 'tres_dormitorios', 'lote']);
export type Typology = EnumValue<typeof TYPOLOGIES>;
export const TYPOLOGY_LABELS: Record<Typology, string> = {
  monoambiente: 'Monoambiente',
  un_dormitorio: '1 dormitorio',
  dos_dormitorios: '2 dormitorios',
  tres_dormitorios: '3 dormitorios',
  lote: 'Lote',
};

export const FINANCING_OPTIONS = defineEnum(['contado', 'cuotas_estudio', 'credito_hipotecario', 'vende_propiedad']);
export type Financing = EnumValue<typeof FINANCING_OPTIONS>;
export const FINANCING_LABELS: Record<Financing, string> = {
  contado: 'Contado',
  cuotas_estudio: 'Cuotas del estudio',
  credito_hipotecario: 'Crédito hipotecario',
  vende_propiedad: 'Vende su propiedad',
};

export const INVEST_GOALS = defineEnum(['renta', 'revalorizacion']);
export type InvestGoal = EnumValue<typeof INVEST_GOALS>;
export const INVEST_GOAL_LABELS: Record<InvestGoal, string> = { renta: 'Renta', revalorizacion: 'Revalorización' };

export const MODALITIES = defineEnum(['en_pozo', 'terminado', 'indistinto']);
export type Modality = EnumValue<typeof MODALITIES>;
export const MODALITY_LABELS: Record<Modality, string> = { en_pozo: 'En pozo', terminado: 'Terminado', indistinto: 'Indistinto' };

/* ---------- Próximos pasos / reuniones ---------- */

export const TASK_KINDS = defineEnum(['task', 'meeting']);
export type TaskKind = EnumValue<typeof TASK_KINDS>;

export const MEETING_PLACES = defineEnum(['estudio', 'showroom', 'obra']);
export type MeetingPlace = EnumValue<typeof MEETING_PLACES>;
export const MEETING_PLACE_LABELS: Record<MeetingPlace, { label: string; phrase: string }> = {
  estudio: { label: 'Estudio', phrase: 'el estudio' },
  showroom: { label: 'Showroom', phrase: 'el showroom' },
  obra: { label: 'Obra', phrase: 'la obra' },
};

export const TASK_SOURCES = defineEnum(['manual', 'showroom']);
export type TaskSource = EnumValue<typeof TASK_SOURCES>;

/** Cómo se cerró un próximo paso: cumplido, reemplazado por otro o quitado. */
export const TASK_CLOSE_REASONS = defineEnum(['completed', 'replaced', 'cancelled']);
export type TaskCloseReason = EnumValue<typeof TASK_CLOSE_REASONS>;

/* ---------- Proyectos ---------- */

export const PROJECT_CATEGORIES = defineEnum([
  'edificios',
  'casas',
  'lotes',
  'interiorismo',
  'locales_comerciales',
  'edificios_especiales',
]);
export type ProjectCategory = EnumValue<typeof PROJECT_CATEGORIES>;
export const PROJECT_CATEGORY_LABELS: Record<ProjectCategory, string> = {
  edificios: 'Edificios',
  casas: 'Casas',
  lotes: 'Lotes',
  interiorismo: 'Interiorismo',
  locales_comerciales: 'Locales Comerciales',
  edificios_especiales: 'Edificios Especiales',
};

export const PROJECT_STAGES = defineEnum(['preventa', 'obra', 'posventa', 'lotes', 'portfolio']);
export type ProjectStage = EnumValue<typeof PROJECT_STAGES>;
export const PROJECT_STAGE_LABELS: Record<ProjectStage, { label: string; short: string }> = {
  preventa: { label: 'Preventa', short: 'hasta 20% por debajo del precio en obra' },
  obra: { label: 'En obra', short: 'la estructura ya se ve y el precio sube cerca de 10%' },
  posventa: { label: 'Terminado', short: 'sin riesgo de obra: se paga y se muda' },
  lotes: { label: 'Lotes en venta', short: 'tierra urbanizada con financiación propia' },
  portfolio: { label: 'Obra realizada', short: 'proyecto terminado' },
};

export const TARGET_PROFILES = defineEnum(['vivienda', 'inversion']);
export type TargetProfile = EnumValue<typeof TARGET_PROFILES>;
export const TARGET_PROFILE_LABELS: Record<TargetProfile, { label: string; tab: string; segment: ClientSegment }> = {
  vivienda: { label: 'Busco mi próxima vivienda', tab: 'Para vivir', segment: 'particular' },
  inversion: { label: 'Busco oportunidades de inversión', tab: 'Para invertir', segment: 'inversor' },
};

export const NEWS_TYPES = defineEnum([
  'avance_obra',
  'disponibilidad',
  'promocion',
  'evento',
  'modificacion',
  'informacion_relevante',
]);
export type NewsType = EnumValue<typeof NEWS_TYPES>;
export const NEWS_TYPE_LABELS: Record<NewsType, string> = {
  avance_obra: 'Avance de obra',
  disponibilidad: 'Disponibilidad',
  promocion: 'Promoción',
  evento: 'Evento',
  modificacion: 'Modificación',
  informacion_relevante: 'Información relevante',
};

/* ---------- Campañas ---------- */

export const CAMPAIGN_PLATFORMS = defineEnum(['meta_ads', 'google_ads', 'instagram', 'otra']);
export type CampaignPlatform = EnumValue<typeof CAMPAIGN_PLATFORMS>;
export const CAMPAIGN_PLATFORM_LABELS: Record<CampaignPlatform, string> = {
  meta_ads: 'Meta Ads',
  google_ads: 'Google Ads',
  instagram: 'Instagram',
  otra: 'Otra',
};

export const CAMPAIGN_STATUSES = defineEnum(['activa', 'pausada', 'finalizada']);
export type CampaignStatus = EnumValue<typeof CAMPAIGN_STATUSES>;
export const CAMPAIGN_STATUS_LABELS: Record<CampaignStatus, string> = { activa: 'Activa', pausada: 'Pausada', finalizada: 'Finalizada' };

/* ---------- Showroom y analítica ---------- */

export const SHOWROOM_EVENT_TYPES = defineEnum(['open', 'profile', 'team', 'visit']);
export type ShowroomEventType = EnumValue<typeof SHOWROOM_EVENT_TYPES>;
/** Señales "fuertes": merecen aviso al equipo. */
export const STRONG_SHOWROOM_EVENTS: readonly ShowroomEventType[] = ['visit'];

export const WEB_EVENT_TYPES = defineEnum(['profile_vivienda', 'profile_inversion', 'visit_click']);
export type WebEventType = EnumValue<typeof WEB_EVENT_TYPES>;

/* ---------- Seguridad / auditoría ---------- */

export const ACTOR_TYPES = defineEnum(['user', 'showroom', 'system', 'anonymous']);
export type ActorType = EnumValue<typeof ACTOR_TYPES>;

export const AUDIT_OUTCOMES = defineEnum(['success', 'failure']);
export type AuditOutcome = EnumValue<typeof AUDIT_OUTCOMES>;

/** Objetivo mensual de reuniones realizadas (legacy: MONTHLY_MEETING_GOAL). */
export const MONTHLY_MEETING_GOAL = 6;
