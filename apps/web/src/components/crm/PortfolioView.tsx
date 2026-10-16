'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ClientListItem, ClientSegment, PipelineStatus, ProjectSummary, PIPELINE_STATUS_LABELS } from '@marq/shared';
import { IconPlus, IconSearch, IconPhone, IconClock } from './Icons';
import { NewClientModal } from './NewClientModal';

interface PortfolioViewProps {
  segment: ClientSegment;
  title: string;
  subtitle: string;
  markSymbol: string;
  markColor: string;
}

const PIPELINE_COLUMNS: { key: PipelineStatus; label: string }[] = [
  { key: 'nuevo_contacto', label: 'Nuevo contacto' },
  { key: 'en_conversacion', label: 'En conversación' },
  { key: 'informacion_enviada', label: 'Información enviada' },
  { key: 'visita_agendada', label: 'Visita agendada' },
  { key: 'en_negociacion', label: 'En negociación' },
  { key: 'cerro_operacion', label: 'Cierre / Boleto' },
  { key: 'sin_interes', label: 'Desestimados' },
];

export function PortfolioView({ segment, title, subtitle, markSymbol, markColor }: PortfolioViewProps) {
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [search, setSearch] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [showNewModal, setShowNewModal] = useState(false);

  // Cargar clientes del segmento
  const { data: clients = [], isLoading, refetch } = useQuery<ClientListItem[]>({
    queryKey: ['clients', segment],
    queryFn: () => api.get<ClientListItem[]>(`/clients?segment=${segment}`),
  });

  // Cargar lista de proyectos para filtros
  const { data: projects = [] } = useQuery<ProjectSummary[]>({
    queryKey: ['projects-summary'],
    queryFn: () => api.get<ProjectSummary[]>('/projects'),
  });

  // Mutación para cambiar etapa del cliente
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: PipelineStatus }) =>
      api.patch(`/clients/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients', segment] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
  });

  const filteredClients = clients.filter((c) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = c.fullName.toLowerCase().includes(q);
      const matchPhone = c.phone.includes(q);
      const matchEmail = c.email?.toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchEmail) return false;
    }
    if (selectedProjectId && !c.projectIds.includes(selectedProjectId)) {
      return false;
    }
    return true;
  });

  const getTaskBadge = (task: ClientListItem['openTask']) => {
    if (!task) return null;
    const today = new Date().toISOString().slice(0, 10);
    const isOverdue = task.dueDate < today;
    const isToday = task.dueDate === today;

    return (
      <div
        style={{
          marginTop: '6px',
          padding: '4px 8px',
          borderRadius: '6px',
          fontSize: '0.72rem',
          background: isOverdue ? '#fee2e2' : isToday ? '#fef3c7' : '#f3f4f6',
          color: isOverdue ? '#991b1b' : isToday ? '#92400e' : '#374151',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        <IconClock size={12} />
        <span style={{ fontWeight: 600 }}>{task.dueDate}</span>: {task.text}
      </div>
    );
  };

  const projectMap = new Map(projects.map((p) => [p.id, p.name]));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: markColor, fontSize: '1.2rem', fontWeight: 'bold' }}>{markSymbol}</span>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>{title}</h1>
          </div>
          <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: '0.85rem' }}>{subtitle}</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'inline-flex', background: '#eee', borderRadius: '8px', padding: '2px' }}>
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              style={{
                border: 0,
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                background: viewMode === 'kanban' ? '#fff' : 'transparent',
                boxShadow: viewMode === 'kanban' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              Tablero Kanban
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              style={{
                border: 0,
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                background: viewMode === 'table' ? '#fff' : 'transparent',
                boxShadow: viewMode === 'table' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              Lista / Tabla
            </button>
          </div>

          <button
            type="button"
            className="admin-primary"
            onClick={() => setShowNewModal(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <IconPlus size={16} /> Nuevo {segment === 'inversor' ? 'Inversor' : 'Contacto'}
          </button>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', background: '#fff', padding: '10px 14px', borderRadius: '12px', border: '1px solid var(--line)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: '220px' }}>
          <IconSearch size={14} color="#888" />
          <input
            type="text"
            value={search}
            placeholder="Buscar por nombre, teléfono o email…"
            onChange={(e) => setSearch(e.target.value)}
            style={{ border: 0, outline: 'none', width: '100%', fontSize: '0.85rem' }}
          />
        </div>

        <select
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
          style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '0.8rem' }}
        >
          <option value="">Todos los proyectos</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        <span style={{ fontSize: '0.8rem', color: '#888', marginLeft: 'auto' }}>
          {filteredClients.length} {filteredClients.length === 1 ? 'contacto' : 'contactos'}
        </span>
      </div>

      {/* Contenido principal: Kanban o Tabla */}
      {isLoading ? (
        <div style={{ padding: '2rem', color: '#666' }}>Cargando cartera…</div>
      ) : viewMode === 'kanban' ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, minmax(220px, 1fr))',
            gap: '12px',
            overflowX: 'auto',
            paddingBottom: '16px',
            alignItems: 'start',
          }}
        >
          {PIPELINE_COLUMNS.map((col) => {
            const colClients = filteredClients.filter((c) => c.status === col.key);

            return (
              <div
                key={col.key}
                style={{
                  background: '#f8f6f0',
                  borderRadius: '12px',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  minHeight: '400px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--ink)' }}>{col.label}</span>
                  <span
                    style={{
                      background: '#fff',
                      padding: '2px 7px',
                      borderRadius: '999px',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      color: '#666',
                      border: '1px solid #e0ded8',
                    }}
                  >
                    {colClients.length}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {colClients.map((client) => {
                    const waUrl = `https://wa.me/${client.phone.replace(/[^0-9]/g, '')}`;

                    return (
                      <div
                        key={client.id}
                        style={{
                          background: '#fff',
                          borderRadius: '10px',
                          padding: '12px',
                          border: '1px solid #e8e6df',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Link
                            href={`/contigo/contactos/${client.id}`}
                            style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--ink)', textDecoration: 'none' }}
                          >
                            {client.fullName}
                          </Link>
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noreferrer"
                            title="Chatear en WhatsApp"
                            style={{ color: '#25D366' }}
                          >
                            <IconPhone size={14} />
                          </a>
                        </div>

                        {client.projectIds.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {client.projectIds.map((pid) => (
                              <span
                                key={pid}
                                style={{
                                  fontSize: '0.7rem',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  background: '#f0ede6',
                                  color: '#555',
                                }}
                              >
                                {projectMap.get(pid) || 'Proyecto'}
                              </span>
                            ))}
                          </div>
                        )}

                        {client.profile.budgetUsd && (
                          <div style={{ fontSize: '0.75rem', color: '#666' }}>
                            Presupuesto: <b>USD {client.profile.budgetUsd.toLocaleString()}</b>
                          </div>
                        )}

                        {getTaskBadge(client.openTask)}

                        {/* Selector rápido para mover etapa */}
                        <div style={{ marginTop: '4px', paddingTop: '6px', borderTop: '1px solid #f0ede6' }}>
                          <select
                            value={client.status}
                            onChange={(e) =>
                              updateStatusMutation.mutate({
                                id: client.id,
                                status: e.target.value as PipelineStatus,
                              })
                            }
                            style={{
                              width: '100%',
                              padding: '4px',
                              borderRadius: '4px',
                              border: '1px solid #ddd',
                              fontSize: '0.72rem',
                              background: '#fafafa',
                            }}
                          >
                            {PIPELINE_COLUMNS.map((p) => (
                              <option key={p.key} value={p.key}>{p.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Vista Tabla */
        <div className="admin-panel" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#fafafa', borderBottom: '1px solid #eee', color: '#666' }}>
                  <th style={{ padding: '10px 14px' }}>Nombre</th>
                  <th style={{ padding: '10px 14px' }}>Teléfono</th>
                  <th style={{ padding: '10px 14px' }}>Etapa</th>
                  <th style={{ padding: '10px 14px' }}>Próximo Paso</th>
                  <th style={{ padding: '10px 14px' }}>Proyectos</th>
                  <th style={{ padding: '10px 14px' }}>Asesor</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map((c) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 600 }}>
                      <Link href={`/contigo/contactos/${c.id}`} style={{ color: 'var(--ink)', textDecoration: 'none' }}>
                        {c.fullName}
                      </Link>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <a href={`https://wa.me/${c.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>
                        {c.phone}
                      </a>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span className="status-chip" style={{ fontSize: '0.72rem' }}>
                        {PIPELINE_STATUS_LABELS[c.status] || c.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      {c.openTask ? (
                        <span style={{ fontSize: '0.75rem', color: '#555' }}>
                          <b>{c.openTask.dueDate}</b>: {c.openTask.text}
                        </span>
                      ) : (
                        <span style={{ color: '#aaa', fontSize: '0.75rem' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      {c.projectIds.map((pid) => projectMap.get(pid)).filter(Boolean).join(', ') || '—'}
                    </td>
                    <td style={{ padding: '12px 14px', color: '#666' }}>
                      {c.assignedUser?.fullName || 'General'}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                      <Link href={`/contigo/contactos/${c.id}`} className="admin-link">
                        Ver ficha →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal nuevo cliente */}
      <NewClientModal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        onCreated={() => refetch()}
        defaultSegment={segment}
        projects={projects.map((p) => ({ id: p.id, name: p.name }))}
      />
    </div>
  );
}
