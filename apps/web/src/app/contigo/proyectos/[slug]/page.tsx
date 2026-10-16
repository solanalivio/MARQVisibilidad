'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  ProjectDetail,
  ClientListItem,
  NewsType,
  Typology,
  UnitTypeInput,
  PROJECT_CATEGORY_LABELS,
  PROJECT_STAGE_LABELS,
  TYPOLOGY_LABELS,
  NEWS_TYPE_LABELS,
  PIPELINE_STATUS_LABELS,
} from '@marq/shared';
import { IconBuilding, IconPlus, IconPhone, IconCalendar, IconCheck } from '@/components/crm/Icons';

const normalizeImg = (url?: string | null) => {
  if (!url) return '';
  return url.startsWith('img/') ? `/${url}` : url;
};

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const slug = params.slug as string;

  const [activeTab, setActiveTab] = useState<'stock' | 'news' | 'clients'>('stock');

  // Formulario de nueva novedad
  const [showNewsModal, setShowNewsModal] = useState(false);
  const [newsType, setNewsType] = useState<NewsType>('avance_obra');
  const [newsTitle, setNewsTitle] = useState('');
  const [newsBody, setNewsBody] = useState('');

  // Formulario para tipologías / stock
  const [showStockModal, setShowStockModal] = useState(false);
  const [newTypology, setNewTypology] = useState<Typology>('dos_dormitorios');
  const [newAreaM2, setNewAreaM2] = useState('65');
  const [newPriceUsd, setNewPriceUsd] = useState('75000');
  const [newAvailable, setNewAvailable] = useState('4');
  const [newReserved, setNewReserved] = useState('1');

  // Cargar detalle del proyecto
  const {
    data: project,
    isLoading,
    error,
    refetch,
  } = useQuery<ProjectDetail>({
    queryKey: ['project-detail', slug],
    queryFn: () => api.get<ProjectDetail>(`/projects/${slug}`),
    enabled: Boolean(slug),
  });

  // Cargar clientes interesados en este proyecto
  const { data: interestedClients = [] } = useQuery<ClientListItem[]>({
    queryKey: ['clients-project', project?.id],
    queryFn: () => api.get<ClientListItem[]>(`/clients?projectId=${project?.id}`),
    enabled: Boolean(project?.id),
  });

  // Mutación para publicar novedad
  const addNewsMutation = useMutation({
    mutationFn: () =>
      api.post(`/projects/${project!.id}/news`, {
        type: newsType,
        title: newsTitle.trim(),
        body: newsBody.trim(),
      }),
    onSuccess: () => {
      refetch();
      setShowNewsModal(false);
      setNewsTitle('');
      setNewsBody('');
    },
  });

  // Mutación para actualizar inventario
  const updateStockMutation = useMutation({
    mutationFn: (newUnitTypes: UnitTypeInput[]) =>
      api.put(`/projects/${project!.id}/unit-types`, newUnitTypes),
    onSuccess: () => {
      refetch();
      setShowStockModal(false);
    },
  });

  // Mutación para registrar envío de WhatsApp a cliente
  const logFollowupMutation = useMutation({
    mutationFn: ({ clientId, newsId }: { clientId: string; newsId: string }) =>
      api.post(`/clients/${clientId}/followups`, { newsId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients-project'] });
    },
  });

  if (isLoading) {
    return <div style={{ padding: '2rem', color: '#666' }}>Cargando proyecto…</div>;
  }

  if (error || !project) {
    return (
      <div style={{ padding: '2rem', color: '#c00' }}>
        Proyecto no encontrado o sin permisos de acceso.
      </div>
    );
  }

  const handleAddUnitType = (e: React.FormEvent) => {
    e.preventDefault();
    const existing = project.unitTypes.map((u) => ({
      typology: u.typology,
      areaM2: u.areaM2,
      priceFromUsd: u.priceFromUsd,
      available: u.available,
      reserved: u.reserved,
    }));

    existing.push({
      typology: newTypology,
      areaM2: Number(newAreaM2),
      priceFromUsd: Number(newPriceUsd),
      available: Number(newAvailable),
      reserved: Number(newReserved),
    });

    updateStockMutation.mutate(existing);
  };

  const handleUpdateStockCounts = (index: number, available: number, reserved: number) => {
    const updated = project.unitTypes.map((u, i) => ({
      typology: u.typology,
      areaM2: u.areaM2,
      priceFromUsd: u.priceFromUsd,
      available: i === index ? available : u.available,
      reserved: i === index ? reserved : u.reserved,
    }));
    updateStockMutation.mutate(updated);
  };

  const latestNews = project.news.length > 0 ? project.news[0] : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <button
        type="button"
        className="admin-back"
        onClick={() => router.back()}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', alignSelf: 'flex-start' }}
      >
        ← Volver a la lista de proyectos
      </button>

      {/* Hero del Proyecto */}
      <div
        className="admin-panel"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.4fr) minmax(280px, 1fr)',
          gap: '24px',
          alignItems: 'center',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                fontSize: '0.78rem',
                padding: '3px 8px',
                borderRadius: '4px',
                background: '#eee',
                fontWeight: 600,
              }}
            >
              {PROJECT_CATEGORY_LABELS[project.category] || project.category} · {project.location}
            </span>
            <span className="status-chip" style={{ fontSize: '0.78rem' }}>
              {project.statusLabel}
            </span>
          </div>

          <h1 style={{ margin: '8px 0', fontSize: '1.8rem', fontWeight: 600 }}>{project.name}</h1>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
            {project.description}
          </p>

          <div style={{ display: 'flex', gap: '16px', marginTop: '16px', fontSize: '0.82rem', color: '#555' }}>
            <div>
              <span style={{ display: 'block', color: '#888', fontSize: '0.72rem' }}>Etapa</span>
              <b>{PROJECT_STAGE_LABELS[project.stage]?.label || project.stage}</b>
            </div>
            <div>
              <span style={{ display: 'block', color: '#888', fontSize: '0.72rem' }}>Interesados activos</span>
              <b style={{ color: 'var(--brand)' }}>
                {(project.metrics.interestedActive.inversor || 0) + (project.metrics.interestedActive.particular || 0)}
              </b>
            </div>
            <div>
              <span style={{ display: 'block', color: '#888', fontSize: '0.72rem' }}>Cierres realizados</span>
              <b>{project.metrics.closedDeals}</b>
            </div>
          </div>
        </div>

        <div style={{ height: '180px', borderRadius: '12px', overflow: 'hidden', background: '#222' }}>
          <img
            src={normalizeImg(project.imageUrl)}
            alt={project.imageAlt}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #ddd', paddingBottom: '2px' }}>
        <button
          type="button"
          onClick={() => setActiveTab('stock')}
          style={{
            background: 'none',
            border: 0,
            borderBottom: activeTab === 'stock' ? '2px solid var(--ink)' : '2px solid transparent',
            padding: '8px 16px',
            fontWeight: 600,
            fontSize: '0.88rem',
            cursor: 'pointer',
            color: activeTab === 'stock' ? 'var(--ink)' : '#888',
          }}
        >
          Inventario y Tipologías ({project.unitTypes.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('news')}
          style={{
            background: 'none',
            border: 0,
            borderBottom: activeTab === 'news' ? '2px solid var(--ink)' : '2px solid transparent',
            padding: '8px 16px',
            fontWeight: 600,
            fontSize: '0.88rem',
            cursor: 'pointer',
            color: activeTab === 'news' ? 'var(--ink)' : '#888',
          }}
        >
          Novedades de Obra ({project.news.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('clients')}
          style={{
            background: 'none',
            border: 0,
            borderBottom: activeTab === 'clients' ? '2px solid var(--ink)' : '2px solid transparent',
            padding: '8px 16px',
            fontWeight: 600,
            fontSize: '0.88rem',
            cursor: 'pointer',
            color: activeTab === 'clients' ? 'var(--ink)' : '#888',
          }}
        >
          Difusión a Interesados ({interestedClients.length})
        </button>
      </div>

      {/* Tab 1: Stock y Tipologías */}
      {activeTab === 'stock' && (
        <section className="admin-panel">
          <div className="admin-panel-head">
            <div>
              <span className="eyebrow"><span className="eyebrow-line"></span> INVENTARIO</span>
              <h2>Tipologías y Unidades Disponibles</h2>
              <p>Actualizá el stock de unidades para reflejar en el showroom y CRM.</p>
            </div>
            <button
              type="button"
              className="admin-primary admin-small"
              onClick={() => setShowStockModal(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <IconPlus size={14} /> Nueva Tipología
            </button>
          </div>

          <div style={{ overflowX: 'auto', marginTop: '14px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #eee', color: '#777' }}>
                  <th style={{ padding: '8px 10px' }}>Tipología</th>
                  <th style={{ padding: '8px 10px' }}>Sup. Propia</th>
                  <th style={{ padding: '8px 10px' }}>Precio Desde</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center' }}>Disponibles</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center' }}>Reservadas</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center' }}>Total Stock</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>Ajustar Stock</th>
                </tr>
              </thead>
              <tbody>
                {project.unitTypes.map((u, i) => (
                  <tr key={u.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                    <td style={{ padding: '10px', fontWeight: 600 }}>{TYPOLOGY_LABELS[u.typology] || u.typology}</td>
                    <td style={{ padding: '10px' }}>{u.areaM2} m²</td>
                    <td style={{ padding: '10px', fontWeight: 600, color: 'var(--brand)' }}>
                      USD {u.priceFromUsd.toLocaleString()}
                    </td>
                    <td style={{ padding: '10px', textAlign: 'center', fontWeight: 600 }}>
                      <span style={{ color: u.available > 0 ? '#2e7d32' : '#c62828' }}>
                        {u.available} libres
                      </span>
                    </td>
                    <td style={{ padding: '10px', textAlign: 'center' }}>{u.reserved}</td>
                    <td style={{ padding: '10px', textAlign: 'center', color: '#666' }}>
                      {u.available + u.reserved}
                    </td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '4px' }}>
                        <button
                          type="button"
                          className="admin-secondary admin-small"
                          onClick={() => handleUpdateStockCounts(i, Math.max(0, u.available - 1), u.reserved + 1)}
                          title="Marcar una unidad como reservada"
                        >
                          +1 Reserva
                        </button>
                        <button
                          type="button"
                          className="admin-secondary admin-small"
                          onClick={() => handleUpdateStockCounts(i, u.available + 1, Math.max(0, u.reserved - 1))}
                          title="Liberar una reserva"
                        >
                          Liberar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {project.unitTypes.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
                      No se han cargado tipologías para este desarrollo aún.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Tab 2: Novedades */}
      {activeTab === 'news' && (
        <section className="admin-panel">
          <div className="admin-panel-head">
            <div>
              <span className="eyebrow"><span className="eyebrow-line"></span> COMUNICACIÓN</span>
              <h2>Novedades y Avances de Obra</h2>
              <p>Publicá avances, fotos o notas para mostrar en la web y difundir a interesados.</p>
            </div>
            <button
              type="button"
              className="admin-primary admin-small"
              onClick={() => setShowNewsModal(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <IconPlus size={14} /> Publicar Novedad
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '14px' }}>
            {project.news.map((item) => (
              <div
                key={item.id}
                style={{
                  padding: '14px',
                  borderRadius: '10px',
                  background: '#faf9f6',
                  border: '1px solid #ebdcc5',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#777', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 600, color: 'var(--brand)' }}>
                    {NEWS_TYPE_LABELS[item.type] || item.type}
                  </span>
                  <span>{item.publishedOn}</span>
                </div>
                <h3 style={{ margin: '0 0 6px', fontSize: '1rem', fontWeight: 600 }}>{item.title}</h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#444', lineHeight: 1.5 }}>{item.body}</p>
              </div>
            ))}
            {project.news.length === 0 && (
              <p style={{ color: '#888', fontSize: '0.85rem' }}>No hay novedades publicadas aún.</p>
            )}
          </div>
        </section>
      )}

      {/* Tab 3: Difusión WhatsApp */}
      {activeTab === 'clients' && (
        <section className="admin-panel">
          <div className="admin-panel-head">
            <div>
              <span className="eyebrow"><span className="eyebrow-line"></span> ASISTENTE DE DIFUSIÓN</span>
              <h2>Contactos Interesados en {project.name}</h2>
              <p>Envío personalizado de novedades y seguimiento comercial por WhatsApp.</p>
            </div>
          </div>

          {latestNews && (
            <div style={{ background: '#f5efe4', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#666' }}>
                Novedad más reciente para difundir:
              </span>
              <p style={{ margin: '4px 0 0', fontWeight: 600, fontSize: '0.88rem' }}>
                {latestNews.title} ({NEWS_TYPE_LABELS[latestNews.type] || latestNews.type})
              </p>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {interestedClients.map((client) => {
              const text = latestNews
                ? `Hola ${client.fullName.split(' ')[0]}, te comparto una novedad de ${project.name}: "${latestNews.title}". ${latestNews.body}`
                : `Hola ${client.fullName.split(' ')[0]}, te escribo de Estudio MARQ con novedades sobre ${project.name}.`;

              const waUrl = `https://wa.me/${client.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`;

              return (
                <div
                  key={client.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #eee',
                    background: '#fff',
                  }}
                >
                  <div>
                    <Link
                      href={`/contigo/contactos/${client.id}`}
                      style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--ink)', textDecoration: 'none' }}
                    >
                      {client.fullName}
                    </Link>
                    <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '2px' }}>
                      {client.segment === 'inversor' ? 'Inversor' : 'Particular'} · Etapa:{' '}
                      {PIPELINE_STATUS_LABELS[client.status] || client.status} · Tel: {client.phone}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="admin-primary admin-small"
                      style={{ background: '#25D366', borderColor: '#25D366' }}
                      onClick={() => {
                        if (latestNews) {
                          logFollowupMutation.mutate({ clientId: client.id, newsId: latestNews.id });
                        }
                      }}
                    >
                      Enviar WhatsApp ↗
                    </a>
                  </div>
                </div>
              );
            })}

            {interestedClients.length === 0 && (
              <p style={{ color: '#888', fontSize: '0.85rem' }}>
                No hay contactos asociados a este proyecto todavía.
              </p>
            )}
          </div>
        </section>
      )}

      {/* Modal Nueva Tipología */}
      {showStockModal && (
        <div className="update-dialog-backdrop open" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="update-dialog" style={{ width: '100%', maxWidth: '480px' }}>
            <div className="admin-panel-head">
              <h2>Nueva Tipología</h2>
              <button type="button" className="admin-secondary admin-small" onClick={() => setShowStockModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAddUnitType} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>Tipología</label>
                <select
                  value={newTypology}
                  onChange={(e) => setNewTypology(e.target.value as Typology)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid #ccc' }}
                >
                  <option value="monoambiente">Monoambiente</option>
                  <option value="un_dormitorio">1 Dormitorio</option>
                  <option value="dos_dormitorios">2 Dormitorios</option>
                  <option value="tres_dormitorios">3 Dormitorios</option>
                  <option value="lote">Lote / Terreno</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>Sup. (m²)</label>
                  <input
                    type="number"
                    required
                    value={newAreaM2}
                    onChange={(e) => setNewAreaM2(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid #ccc' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>Precio Desde (USD)</label>
                  <input
                    type="number"
                    required
                    value={newPriceUsd}
                    onChange={(e) => setNewPriceUsd(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid #ccc' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>Disponibles</label>
                  <input
                    type="number"
                    required
                    value={newAvailable}
                    onChange={(e) => setNewAvailable(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid #ccc' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>Reservadas</label>
                  <input
                    type="number"
                    required
                    value={newReserved}
                    onChange={(e) => setNewReserved(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid #ccc' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '0.5rem' }}>
                <button type="button" className="admin-secondary" onClick={() => setShowStockModal(false)}>Cancelar</button>
                <button type="submit" disabled={updateStockMutation.isPending} className="admin-primary">
                  {updateStockMutation.isPending ? 'Guardando…' : 'Agregar Tipología'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Publicar Novedad */}
      {showNewsModal && (
        <div className="update-dialog-backdrop open" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="update-dialog" style={{ width: '100%', maxWidth: '500px' }}>
            <div className="admin-panel-head">
              <h2>Publicar Novedad de Obra</h2>
              <button type="button" className="admin-secondary admin-small" onClick={() => setShowNewsModal(false)}>✕</button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                addNewsMutation.mutate();
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
            >
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>Tipo de novedad</label>
                <select
                  value={newsType}
                  onChange={(e) => setNewsType(e.target.value as NewsType)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid #ccc' }}
                >
                  <option value="avance_obra">Avance de obra</option>
                  <option value="disponibilidad">Disponibilidad</option>
                  <option value="promocion">Promoción</option>
                  <option value="evento">Evento</option>
                  <option value="modificacion">Modificación</option>
                  <option value="informacion_relevante">Información relevante</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>Título *</label>
                <input
                  type="text"
                  required
                  value={newsTitle}
                  placeholder="Ej. Losa del 4to piso completada"
                  onChange={(e) => setNewsTitle(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid #ccc' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>Detalle / Cuerpo *</label>
                <textarea
                  required
                  rows={4}
                  value={newsBody}
                  placeholder="Describí los detalles del avance o anuncio..."
                  onChange={(e) => setNewsBody(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid #ccc', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '0.5rem' }}>
                <button type="button" className="admin-secondary" onClick={() => setShowNewsModal(false)}>Cancelar</button>
                <button type="submit" disabled={addNewsMutation.isPending} className="admin-primary">
                  {addNewsMutation.isPending ? 'Publicando…' : 'Publicar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
