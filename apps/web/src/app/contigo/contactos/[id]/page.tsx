'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  ClientDetail,
  ProjectSummary,
  ProjectRecommendation,
  PipelineStatus,
  InteractionKind,
  PIPELINE_STATUS_LABELS,
  CHANNEL_LABELS,
} from '@marq/shared';
import {
  IconPhone,
  IconMail,
  IconCalendar,
  IconClock,
  IconSparkles,
  IconExternal,
  IconCheck,
} from '@/components/crm/Icons';
import { LogInteractionModal } from '@/components/crm/LogInteractionModal';
import { ScheduleMeetingModal } from '@/components/crm/ScheduleMeetingModal';
import { ShowroomModal } from '@/components/crm/ShowroomModal';

export default function ContactDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = params.id as string;

  const [showLogModal, setShowLogModal] = useState(false);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [showShowroomModal, setShowShowroomModal] = useState(false);

  // Cargar detalle del cliente
  const {
    data: client,
    isLoading,
    error,
    refetch,
  } = useQuery<ClientDetail>({
    queryKey: ['client-detail', id],
    queryFn: () => api.get<ClientDetail>(`/clients/${id}`),
    enabled: Boolean(id),
  });

  // Cargar proyectos para referencias y nombres
  const { data: projects = [] } = useQuery<ProjectSummary[]>({
    queryKey: ['projects-summary'],
    queryFn: () => api.get<ProjectSummary[]>('/projects'),
  });

  // Cargar recomendaciones inteligentes
  const { data: recommendations = [] } = useQuery<ProjectRecommendation[]>({
    queryKey: ['client-recommendations', id],
    queryFn: () => api.get<ProjectRecommendation[]>(`/clients/${id}/recommendations`),
    enabled: Boolean(id),
  });

  // Mutación para cambio rápido de etapa
  const updateStatusMutation = useMutation({
    mutationFn: (newStatus: PipelineStatus) => api.patch(`/clients/${id}/status`, { status: newStatus }),
    onSuccess: () => {
      refetch();
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });

  if (isLoading) {
    return <div style={{ padding: '2rem', color: '#666' }}>Cargando ficha de contacto…</div>;
  }

  if (error || !client) {
    return (
      <div style={{ padding: '2rem', color: '#c00' }}>
        Contacto no encontrado o sin permisos de acceso.
      </div>
    );
  }

  const projectMap = new Map(projects.map((p) => [p.id, p]));
  const isInversor = client.segment === 'inversor';
  const waUrl = `https://wa.me/${client.phone.replace(/[^0-9]/g, '')}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Botón Volver */}
      <button
        type="button"
        className="admin-back"
        onClick={() => router.back()}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', alignSelf: 'flex-start' }}
      >
        ← Volver a la cartera
      </button>

      {/* Encabezado Ficha */}
      <div
        className="admin-panel"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                fontSize: '0.85rem',
                fontWeight: 600,
                color: isInversor ? '#2b7a97' : '#c47d2b',
              }}
            >
              {isInversor ? '▲ Inversor' : '● Particular'}
            </span>
            <span className="status-chip" style={{ fontSize: '0.78rem' }}>
              {PIPELINE_STATUS_LABELS[client.status] || client.status}
            </span>
          </div>

          <h1 style={{ margin: '6px 0 2px', fontSize: '1.7rem', fontWeight: 600 }}>{client.fullName}</h1>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.82rem' }}>
            Registrado el {new Date(client.createdAt).toLocaleDateString('es-AR')} · Origen:{' '}
            {CHANNEL_LABELS[client.source] || client.source}
            {client.campaign ? ` (Campaña: ${client.campaign.name})` : ''}
          </p>
        </div>

        {/* Acciones principales */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="admin-secondary admin-small"
            onClick={() => setShowLogModal(true)}
          >
            Registrar Interacción
          </button>
          <button
            type="button"
            className="admin-secondary admin-small"
            onClick={() => setShowMeetingModal(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
          >
            <IconCalendar size={13} /> Agendar Reunión
          </button>
          <button
            type="button"
            className="admin-primary admin-small"
            onClick={() => setShowShowroomModal(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
          >
            <IconSparkles size={13} /> Showroom 3D
          </button>
        </div>
      </div>

      {/* Tarea / Próximo paso abierto (si existe) */}
      {client.openTask && (
        <div
          style={{
            background: '#fff9e6',
            border: '1px solid #ebd08c',
            borderRadius: '12px',
            padding: '14px 18px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 600, color: '#92400e' }}>
              <IconClock size={14} /> Próximo paso pendiente para el {client.openTask.dueDate}
              {client.openTask.dueTime ? ` a las ${client.openTask.dueTime}` : ''}
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: '#1c1917', fontWeight: 500 }}>
              {client.openTask.text}
            </p>
          </div>

          <button
            type="button"
            className="admin-primary admin-small"
            onClick={() => setShowLogModal(true)}
          >
            Cumplir / Registrar resultado
          </button>
        </div>
      )}

      {/* Layout de dos columnas */}
      <div className="company-columns">
        {/* Columna Izquierda: Historial, Señales y Notas */}
        <div className="admin-stack">
          {/* Tarjeta de contexto del equipo */}
          <section className="team-card">
            <div className="team-card-bar">
              <span className="live-dot"></span> MARQ Contigo · Lo que sabe el equipo
            </div>
            <dl className="team-card-rows">
              <div>
                <dt>Busca</dt>
                <dd>
                  <b>{isInversor ? 'Oportunidades de Inversión' : 'Vivienda Propia'}</b>
                </dd>
              </div>
              <div>
                <dt>Proyectos</dt>
                <dd>
                  {client.projectIds.map((pid) => (
                    <span key={pid} className="project-chip" style={{ marginRight: '6px' }}>
                      {projectMap.get(pid)?.name || 'Proyecto'}
                    </span>
                  ))}
                  {client.projectIds.length === 0 && <span style={{ color: '#888' }}>Sin proyectos seleccionados</span>}
                </dd>
              </div>
              <div>
                <dt>Trayecto</dt>
                <dd>{client.journey.join(' → ') || CHANNEL_LABELS[client.source] || client.source}</dd>
              </div>
            </dl>
          </section>

          {/* Historial de Interacciones */}
          <section className="admin-panel">
            <div className="admin-panel-head">
              <div>
                <span className="eyebrow"><span className="eyebrow-line"></span> TRAZABILIDAD</span>
                <h2>Historial de Contacto</h2>
                <p>Todas las conversaciones, llamadas y acuerdos.</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
              {client.interactions.length > 0 ? (
                client.interactions.map((it) => (
                  <div
                    key={it.id}
                    style={{
                      padding: '12px 14px',
                      background: '#fcfaf6',
                      borderRadius: '8px',
                      border: '1px solid #eee',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', color: '#777', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 600, color: 'var(--ink)' }}>
                        {(it.channel && CHANNEL_LABELS[it.channel]) || it.channel || 'Contacto'} ·{' '}
                        {new Date(it.occurredAt).toLocaleDateString('es-AR')}
                      </span>
                      <span>Por: {it.createdBy?.fullName || 'Equipo'}</span>
                    </div>

                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#333' }}>{it.note}</p>

                    {it.visitOutcome && (
                      <span
                        style={{
                          display: 'inline-block',
                          marginTop: '6px',
                          fontSize: '0.72rem',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: it.visitOutcome === 'done' ? '#e8f5e9' : '#ffebee',
                          color: it.visitOutcome === 'done' ? '#2e7d32' : '#c62828',
                        }}
                      >
                        Reunión: {it.visitOutcome === 'done' ? 'Realizada' : 'No asistió'}
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <p style={{ color: '#888', fontSize: '0.85rem' }}>No hay interacciones registradas aún.</p>
              )}
            </div>
          </section>

          {/* Señales del Showroom 3D */}
          <section className="admin-panel">
            <div className="admin-panel-head">
              <div>
                <span className="eyebrow"><span className="eyebrow-line"></span> TELEMETRÍA 3D</span>
                <h2>Señales del Showroom</h2>
                <p>Actividad capturada cuando el cliente navega su enlace personalizado.</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
              {client.signals.length > 0 ? (
                client.signals.map((sig) => (
                  <div
                    key={sig.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 12px',
                      background: '#fff',
                      borderRadius: '6px',
                      border: '1px solid #eee',
                      fontSize: '0.8rem',
                    }}
                  >
                    <span style={{ color: 'var(--brand)' }}>●</span>
                    <span style={{ flex: 1 }}>{sig.label}</span>
                    <span style={{ color: '#888', fontSize: '0.72rem' }}>
                      {new Date(sig.occurredAt).toLocaleDateString('es-AR')}
                    </span>
                  </div>
                ))
              ) : (
                <p style={{ color: '#888', fontSize: '0.85rem' }}>
                  El cliente aún no ha explorado su showroom personal.
                </p>
              )}
            </div>
          </section>
        </div>

        {/* Columna Derecha: Datos de Contacto, Perfil y Recomendaciones */}
        <div className="admin-stack">
          {/* Ficha de datos personales */}
          <section className="admin-panel">
            <div className="admin-panel-head">
              <h2>Datos del Cliente</h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.84rem' }}>
              <div>
                <span style={{ display: 'block', color: '#888', fontSize: '0.72rem' }}>WhatsApp / Teléfono</span>
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: '#25D366', fontWeight: 600, textDecoration: 'none' }}
                >
                  {client.phone} ↗
                </a>
              </div>

              {client.email && (
                <div>
                  <span style={{ display: 'block', color: '#888', fontSize: '0.72rem' }}>Correo electrónico</span>
                  <a href={`mailto:${client.email}`} style={{ color: 'var(--ink)' }}>
                    {client.email}
                  </a>
                </div>
              )}

              <div>
                <span style={{ display: 'block', color: '#888', fontSize: '0.72rem' }}>Asesor asignado</span>
                <span style={{ fontWeight: 500 }}>{client.assignedUser?.fullName || 'General'}</span>
              </div>

              {client.profile.budgetUsd && (
                <div>
                  <span style={{ display: 'block', color: '#888', fontSize: '0.72rem' }}>Presupuesto</span>
                  <span style={{ fontWeight: 600, color: 'var(--brand)' }}>
                    USD {client.profile.budgetUsd.toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            {/* Cambiar etapa rápido */}
            <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #eee' }}>
              <label style={{ display: 'block', fontSize: '0.72rem', color: '#888', marginBottom: '4px' }}>
                Cambiar etapa del pipeline:
              </label>
              <select
                value={client.status}
                onChange={(e) => updateStatusMutation.mutate(e.target.value as PipelineStatus)}
                style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '0.78rem' }}
              >
                <option value="nuevo_contacto">Nuevo contacto</option>
                <option value="en_conversacion">En conversación</option>
                <option value="informacion_enviada">Información enviada</option>
                <option value="visita_agendada">Visita agendada</option>
                <option value="en_negociacion">En negociación</option>
                <option value="cerro_operacion">Cierre / Boleto</option>
                <option value="sin_interes">Desestimado</option>
              </select>
            </div>
          </section>

          {/* Recomendaciones Inteligentes del Algoritmo */}
          <section className="admin-panel">
            <div className="admin-panel-head">
              <div>
                <span className="eyebrow"><span className="eyebrow-line"></span> SUGERENCIAS</span>
                <h2>Recomendaciones MARQ</h2>
              </div>
              <IconSparkles size={16} color="var(--brand)" />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
              {recommendations.length > 0 ? (
                recommendations.map((rec) => {
                  const p = projectMap.get(rec.projectId);
                  if (!p) return null;

                  return (
                    <div
                      key={rec.projectId}
                      style={{
                        padding: '10px',
                        borderRadius: '8px',
                        background: '#fafafa',
                        border: '1px solid #eee',
                        fontSize: '0.8rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, marginBottom: '2px' }}>
                        <Link href={`/contigo/proyectos/${p.slug}`} style={{ color: 'var(--ink)', textDecoration: 'none' }}>
                          {p.name}
                        </Link>
                        <span style={{ color: 'var(--brand)', fontSize: '0.75rem' }}>
                          {Math.round(rec.score * 100)}% afinidad
                        </span>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#666' }}>
                        {rec.reasons.join(' · ')}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p style={{ color: '#888', fontSize: '0.8rem' }}>Sin recomendaciones automáticas aún.</p>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Modales */}
      <LogInteractionModal
        isOpen={showLogModal}
        onClose={() => setShowLogModal(false)}
        onSuccess={() => refetch()}
        clientId={client.id}
        clientName={client.fullName}
        openTask={client.openTask}
      />

      <ScheduleMeetingModal
        isOpen={showMeetingModal}
        onClose={() => setShowMeetingModal(false)}
        onSuccess={() => refetch()}
        clientId={client.id}
        clientName={client.fullName}
        projects={projects.map((p) => ({ id: p.id, name: p.name }))}
      />

      <ShowroomModal
        isOpen={showShowroomModal}
        onClose={() => setShowShowroomModal(false)}
        clientId={client.id}
        clientName={client.fullName}
        clientPhone={client.phone}
        projects={projects.map((p) => ({ id: p.id, name: p.name }))}
        initialSelectedIds={client.projectIds}
      />
    </div>
  );
}
