'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { DashboardSummary } from '@marq/shared';
import { IconPlus, IconCalendar, IconUser, IconBuilding } from '@/components/crm/Icons';
import { NewClientModal } from '@/components/crm/NewClientModal';

export default function ResumenPage() {
  const [showNewClientModal, setShowNewClientModal] = useState(false);

  const { data, isLoading, error, refetch } = useQuery<DashboardSummary>({
    queryKey: ['dashboard-summary'],
    queryFn: () => api.get<DashboardSummary>('/dashboard/summary'),
  });

  if (isLoading) {
    return <div style={{ padding: '2rem', color: '#666' }}>Cargando métricas y agenda…</div>;
  }

  if (error || !data) {
    return (
      <div style={{ padding: '2rem', color: '#c00' }}>
        Error al cargar el resumen. Verifique la conexión con el servidor.
      </div>
    );
  }

  const formatCurrency = (amount: number, currency = 'ARS') =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Encabezado y acciones rápidas */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <span className="eyebrow"><span className="eyebrow-line"></span> ESTUDIO MARQ</span>
          <h1 style={{ margin: '4px 0', fontSize: '1.6rem', fontWeight: 600 }}>Tablero General</h1>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.85rem' }}>
            Métricas comerciales en tiempo real y agenda de citas.
          </p>
        </div>

        <button
          type="button"
          className="admin-primary"
          onClick={() => setShowNewClientModal(true)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <IconPlus size={16} /> Nuevo Contacto
        </button>
      </div>

      {/* Tarjetas KPI */}
      <section className="company-stats">
        <article>
          <span>Cartera Activa</span>
          <b>{data.portfolio.active}</b>
          <div style={{ marginTop: '8px', fontSize: '0.75rem', color: 'var(--muted)' }}>
            <span style={{ color: '#2b7a97', fontWeight: 600 }}>▲ {data.portfolio.bySegment.inversor || 0}</span> inversores ·{' '}
            <span style={{ color: '#c47d2b', fontWeight: 600 }}>● {data.portfolio.bySegment.particular || 0}</span> particulares
          </div>
        </article>

        <article>
          <span>Leads Nuevos (7 días)</span>
          <b>{data.leads.last7Days}</b>
          <div style={{ marginTop: '8px', fontSize: '0.75rem', color: 'var(--muted)' }}>
            vs {data.leads.previous7Days} semana anterior
          </div>
        </article>

        <article>
          <span>Reuniones del Mes</span>
          <b>
            {data.meetings.doneThisMonth}
            <small style={{ fontSize: '1rem', fontWeight: 400, color: '#888' }}>
              {' '}/ {data.meetings.monthlyGoal}
            </small>
          </b>
          <div style={{ marginTop: '8px', fontSize: '0.75rem', color: 'var(--muted)' }}>
            +{data.meetings.aheadThisMonth} agendadas para los próximos días
          </div>
        </article>

        <article>
          <span>Actividad Showroom</span>
          <b>{data.web.visit}</b>
          <div style={{ marginTop: '8px', fontSize: '0.75rem', color: 'var(--muted)' }}>
            {data.web.inversion} interés inversión · {data.web.vivienda} vivienda
          </div>
        </article>
      </section>

      {/* Columnas: Agenda de reuniones y Origen de contactos */}
      <div className="company-columns">
        {/* Agenda 7 días */}
        <section className="admin-panel">
          <div className="admin-panel-head">
            <div>
              <span className="eyebrow"><span className="eyebrow-line"></span> AGENDA DE VISITAS</span>
              <h2>Citas del Equipo (Día -3 a +3)</h2>
              <p>Seguimiento de reuniones presenciales y virtuales.</p>
            </div>
            <IconCalendar size={20} color="var(--brand)" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '14px' }}>
            {data.visitsByDay.map((day) => {
              const isToday = day.date === data.today;
              const hasEvents = day.done.length > 0 || day.scheduled.length > 0 || day.noshow.length > 0;

              return (
                <div
                  key={day.date}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: '1px solid',
                    borderColor: isToday ? 'var(--brand)' : '#eee',
                    background: isToday ? '#fbf8f2' : '#fafafa',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: hasEvents ? '8px' : '0' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.85rem', color: isToday ? 'var(--brand)' : 'var(--ink)' }}>
                      {day.date} {isToday ? '(HOY)' : ''}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#888' }}>
                      {day.scheduled.length} agendadas · {day.done.length} hechas
                    </span>
                  </div>

                  {hasEvents ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {day.scheduled.map((v, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem' }}>
                          <span style={{ padding: '2px 6px', borderRadius: '4px', background: '#e3f2fd', color: '#1565c0', fontSize: '0.7rem' }}>
                            {v.time || 'Horario a confirmar'}
                          </span>
                          <Link href={`/contigo/contactos/${v.clientId}`} style={{ color: 'var(--ink)', fontWeight: 500, textDecoration: 'none' }}>
                            {v.clientName}
                          </Link>
                        </div>
                      ))}

                      {day.done.map((v, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#2e7d32' }}>
                          <span style={{ padding: '2px 6px', borderRadius: '4px', background: '#e8f5e9', fontSize: '0.7rem' }}>
                            ✓ Realizada {v.time ? `· ${v.time}` : ''}
                          </span>
                          <Link href={`/contigo/contactos/${v.clientId}`} style={{ color: 'var(--ink)', textDecoration: 'none' }}>
                            {v.clientName}
                          </Link>
                        </div>
                      ))}

                      {day.noshow.map((v, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#c62828' }}>
                          <span style={{ padding: '2px 6px', borderRadius: '4px', background: '#ffebee', fontSize: '0.7rem' }}>
                            ✕ No asistió
                          </span>
                          <Link href={`/contigo/contactos/${v.clientId}`} style={{ color: 'var(--ink)', textDecoration: 'none' }}>
                            {v.clientName}
                          </Link>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ margin: 0, fontSize: '0.78rem', color: '#aaa' }}>Sin reuniones agendadas.</p>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Canales y distribución de leads */}
        <section className="admin-panel">
          <div className="admin-panel-head">
            <div>
              <span className="eyebrow"><span className="eyebrow-line"></span> ADQUISICIÓN</span>
              <h2>Canales de Ingreso</h2>
              <p>Origen de los contactos registrados.</p>
            </div>
          </div>

          <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {data.origins.leads.map((orig) => {
              const maxLeads = Math.max(...data.origins.leads.map(l => l.value), 1);
              const pct = Math.round((orig.value / maxLeads) * 100);

              return (
                <div key={orig.key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 500 }}>{orig.key}</span>
                    <span style={{ color: '#666' }}>{orig.value} contactos</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: '#eee', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: 'var(--brand)', borderRadius: '999px' }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Enlaces directos a carteras */}
          <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #eee', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Link href="/contigo/inversores" className="admin-secondary admin-small" style={{ justifyContent: 'space-between' }}>
              <span>Ver Cartera de Inversores (▲)</span>
              <span>→</span>
            </Link>
            <Link href="/contigo/particulares" className="admin-secondary admin-small" style={{ justifyContent: 'space-between' }}>
              <span>Ver Cartera de Particulares (●)</span>
              <span>→</span>
            </Link>
          </div>
        </section>
      </div>

      {/* Campañas de Marketing & Rendimiento */}
      <section className="admin-panel">
        <div className="admin-panel-head">
          <div>
            <span className="eyebrow"><span className="eyebrow-line"></span> MARKETING</span>
            <h2>Campañas Publicitarias y Retorno</h2>
            <p>Atribución de clientes, reuniones y costos publicitarios.</p>
          </div>
        </div>

        <div style={{ overflowX: 'auto', marginTop: '12px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #eee', color: '#777' }}>
                <th style={{ padding: '8px 10px' }}>Campaña</th>
                <th style={{ padding: '8px 10px' }}>Plataforma</th>
                <th style={{ padding: '8px 10px' }}>Estado</th>
                <th style={{ padding: '8px 10px', textAlign: 'right' }}>Inversión (ARS)</th>
                <th style={{ padding: '8px 10px', textAlign: 'center' }}>Leads Red</th>
                <th style={{ padding: '8px 10px', textAlign: 'center' }}>En CRM</th>
                <th style={{ padding: '8px 10px', textAlign: 'center' }}>Reuniones</th>
                <th style={{ padding: '8px 10px', textAlign: 'center' }}>Cierres</th>
                <th style={{ padding: '8px 10px', textAlign: 'right' }}>CPL Est.</th>
              </tr>
            </thead>
            <tbody>
              {data.campaigns.map((camp) => {
                const cpl = camp.platformLeads > 0 ? camp.spendArs / camp.platformLeads : 0;

                return (
                  <tr key={camp.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                    <td style={{ padding: '10px', fontWeight: 600 }}>{camp.name}</td>
                    <td style={{ padding: '10px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: '4px', background: '#eee', fontSize: '0.75rem' }}>
                        {camp.platform}
                      </span>
                    </td>
                    <td style={{ padding: '10px' }}>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          background: camp.status === 'activa' ? '#e8f5e9' : '#f5f5f5',
                          color: camp.status === 'activa' ? '#2e7d32' : '#888',
                        }}
                      >
                        {camp.status}
                      </span>
                    </td>
                    <td style={{ padding: '10px', textAlign: 'right', fontWeight: 500 }}>
                      {formatCurrency(camp.spendArs)}
                    </td>
                    <td style={{ padding: '10px', textAlign: 'center' }}>{camp.platformLeads}</td>
                    <td style={{ padding: '10px', textAlign: 'center', fontWeight: 600, color: 'var(--brand)' }}>
                      {camp.attributedClients}
                    </td>
                    <td style={{ padding: '10px', textAlign: 'center' }}>{camp.meetings}</td>
                    <td style={{ padding: '10px', textAlign: 'center', fontWeight: 600 }}>{camp.sales}</td>
                    <td style={{ padding: '10px', textAlign: 'right', color: '#666' }}>
                      {formatCurrency(cpl)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal para crear nuevo cliente */}
      <NewClientModal
        isOpen={showNewClientModal}
        onClose={() => setShowNewClientModal(false)}
        onCreated={() => refetch()}
        projects={data.projects.map(p => ({ id: p.id, name: p.name }))}
      />
    </div>
  );
}
