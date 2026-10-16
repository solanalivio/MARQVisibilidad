'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ProjectSummary, PROJECT_CATEGORY_LABELS } from '@marq/shared';
import { IconSearch, IconBuilding } from '@/components/crm/Icons';

const normalizeImg = (url?: string | null) => {
  if (!url) return '';
  return url.startsWith('img/') ? `/${url}` : url;
};

export default function ProyectosListPage() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');

  const { data: projects = [], isLoading } = useQuery<ProjectSummary[]>({
    queryKey: ['projects-summary'],
    queryFn: () => api.get<ProjectSummary[]>('/projects'),
  });

  const filtered = projects.filter((p) => {
    if (selectedCategory !== 'Todos' && p.category !== selectedCategory) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.location.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <span className="eyebrow"><span className="eyebrow-line"></span> PORTAFOLIO</span>
          <h1 style={{ margin: '4px 0', fontSize: '1.6rem', fontWeight: 600 }}>Desarrollos y Stock</h1>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.85rem' }}>
            Control de inventario de unidades, tipologías y novedades de obra.
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', background: '#fff', padding: '10px 14px', borderRadius: '12px', border: '1px solid var(--line)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: '220px' }}>
          <IconSearch size={14} color="#888" />
          <input
            type="text"
            value={search}
            placeholder="Buscar desarrollo por nombre o ubicación…"
            onChange={(e) => setSearch(e.target.value)}
            style={{ border: 0, outline: 'none', width: '100%', fontSize: '0.85rem' }}
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '0.8rem' }}
        >
          <option value="Todos">Todas las categorías</option>
          <option value="edificios">Edificios</option>
          <option value="casas">Casas</option>
          <option value="lotes">Lotes</option>
          <option value="interiorismo">Interiorismo</option>
          <option value="locales_comerciales">Locales Comerciales</option>
          <option value="edificios_especiales">Edificios Especiales</option>
        </select>

        <span style={{ fontSize: '0.8rem', color: '#888', marginLeft: 'auto' }}>
          {filtered.length} proyectos
        </span>
      </div>

      {/* Grid de proyectos */}
      {isLoading ? (
        <div style={{ padding: '2rem', color: '#666' }}>Cargando desarrollos…</div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '16px',
          }}
        >
          {filtered.map((p) => {
            const availableUnits = p.unitTypes.reduce((acc, u) => acc + u.available, 0);
            const totalUnits = p.unitTypes.reduce((acc, u) => acc + (u.available + u.reserved), 0);

            return (
              <div
                key={p.id}
                style={{
                  background: '#fff',
                  borderRadius: '14px',
                  border: '1px solid #e8e6df',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                }}
              >
                <div style={{ position: 'relative', height: '140px', background: '#222' }}>
                  <img
                    src={normalizeImg(p.imageUrl)}
                    alt={p.imageAlt}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <span
                    style={{
                      position: 'absolute',
                      top: '10px',
                      left: '10px',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      background: 'rgba(0,0,0,0.7)',
                      color: '#fff',
                    }}
                  >
                    {p.statusLabel}
                  </span>
                </div>

                <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: '#888', textTransform: 'uppercase' }}>
                      {PROJECT_CATEGORY_LABELS[p.category] || p.category} · {p.location}
                    </span>
                    <h3 style={{ margin: '2px 0', fontSize: '1.05rem', fontWeight: 600 }}>{p.name}</h3>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#666', borderTop: '1px solid #eee', paddingTop: '8px' }}>
                    <span>Unidades libres:</span>
                    <b>{totalUnits > 0 ? `${availableUnits} / ${totalUnits}` : 'Consultar'}</b>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#666' }}>
                    <span>Interesados activos:</span>
                    <b style={{ color: 'var(--brand)' }}>
                      {(p.metrics.interestedActive.inversor || 0) + (p.metrics.interestedActive.particular || 0)}
                    </b>
                  </div>

                  <div style={{ marginTop: 'auto', paddingTop: '10px' }}>
                    <Link
                      href={`/contigo/proyectos/${p.slug}`}
                      className="admin-secondary admin-small"
                      style={{ width: '100%', textAlign: 'center' }}
                    >
                      Gestionar stock y novedades →
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
