'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { AuditLogEntry, Paginated, AuditOutcome } from '@marq/shared';
import { IconShield, IconSearch } from '@/components/crm/Icons';

export default function AdminAuditoriaPage() {
  const [page, setPage] = useState(1);
  const [outcome, setOutcome] = useState<string>('');
  const [entityType, setEntityType] = useState<string>('');
  const [actionSearch, setActionSearch] = useState<string>('');
  const [inspectEntry, setInspectEntry] = useState<AuditLogEntry | null>(null);

  const queryParams = new URLSearchParams({
    page: String(page),
    pageSize: '25',
  });
  if (outcome) queryParams.set('outcome', outcome);
  if (entityType) queryParams.set('entityType', entityType);
  if (actionSearch.trim()) queryParams.set('action', actionSearch.trim());

  const { data, isLoading } = useQuery<Paginated<AuditLogEntry>>({
    queryKey: ['audit-logs', page, outcome, entityType, actionSearch],
    queryFn: () => api.get<Paginated<AuditLogEntry>>(`/audit-logs?${queryParams.toString()}`),
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <span className="eyebrow"><span className="eyebrow-line"></span> TRAZABILIDAD Y CUMPLIMIENTO</span>
          <h1 style={{ margin: '4px 0', fontSize: '1.6rem', fontWeight: 600 }}>Registro de Auditoría</h1>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.85rem' }}>
            Bitácora append-only de seguridad con ofuscación de datos sensibles y trazabilidad de eventos.
          </p>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', background: '#fff', padding: '10px 14px', borderRadius: '12px', border: '1px solid var(--line)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: '200px' }}>
          <IconSearch size={14} color="#888" />
          <input
            type="text"
            value={actionSearch}
            placeholder="Filtrar por acción (ej. auth:login, client:create)…"
            onChange={(e) => {
              setActionSearch(e.target.value);
              setPage(1);
            }}
            style={{ border: 0, outline: 'none', width: '100%', fontSize: '0.85rem' }}
          />
        </div>

        <select
          value={outcome}
          onChange={(e) => {
            setOutcome(e.target.value);
            setPage(1);
          }}
          style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '0.8rem' }}
        >
          <option value="">Todos los resultados</option>
          <option value="success">Éxito (success)</option>
          <option value="failure">Fallo (failure)</option>
        </select>

        <select
          value={entityType}
          onChange={(e) => {
            setEntityType(e.target.value);
            setPage(1);
          }}
          style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '0.8rem' }}
        >
          <option value="">Todas las entidades</option>
          <option value="User">Usuario</option>
          <option value="Client">Cliente</option>
          <option value="Interaction">Interacción</option>
          <option value="Task">Tarea / Reunión</option>
          <option value="Project">Proyecto</option>
          <option value="Role">Rol</option>
          <option value="ShowroomLink">Showroom</option>
        </select>

        <span style={{ fontSize: '0.8rem', color: '#888', marginLeft: 'auto' }}>
          {data?.total ?? 0} registros
        </span>
      </div>

      {/* Tabla de Auditoría */}
      <div className="admin-panel" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#fafafa', borderBottom: '1px solid #eee', color: '#666' }}>
                <th style={{ padding: '10px 14px' }}>Fecha y Hora</th>
                <th style={{ padding: '10px 14px' }}>Actor</th>
                <th style={{ padding: '10px 14px' }}>Acción</th>
                <th style={{ padding: '10px 14px' }}>Entidad</th>
                <th style={{ padding: '10px 14px' }}>Resultado</th>
                <th style={{ padding: '10px 14px' }}>IP Origen</th>
                <th style={{ padding: '10px 14px', textAlign: 'right' }}>Detalle</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} style={{ padding: '24px', textAlign: 'center', color: '#888' }}>
                    Cargando eventos de auditoría…
                  </td>
                </tr>
              ) : data && data.items.length > 0 ? (
                data.items.map((entry) => (
                  <tr key={entry.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', color: '#555' }}>
                      {new Date(entry.occurredAt).toLocaleString('es-AR')}
                    </td>
                    <td style={{ padding: '10px 14px', fontWeight: 500 }}>
                      {entry.actor?.fullName || `${entry.actorType}`}
                    </td>
                    <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontWeight: 600 }}>
                      {entry.action}
                    </td>
                    <td style={{ padding: '10px 14px', color: '#666' }}>
                      {entry.entityType} {entry.entityId ? `(#${entry.entityId.slice(0, 8)})` : ''}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          background: entry.outcome === 'success' ? '#e8f5e9' : '#fee2e2',
                          color: entry.outcome === 'success' ? '#2e7d32' : '#991b1b',
                        }}
                      >
                        {entry.outcome}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', color: '#888', fontSize: '0.78rem' }}>
                      {entry.ip || '—'}
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                      {entry.changes ? (
                        <button
                          type="button"
                          className="admin-link"
                          onClick={() => setInspectEntry(entry)}
                        >
                          Ver cambios
                        </button>
                      ) : (
                        <span style={{ color: '#ccc' }}>—</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} style={{ padding: '24px', textAlign: 'center', color: '#888' }}>
                    No se encontraron registros de auditoría con los filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {data && data.total > data.pageSize && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#fafafa', borderTop: '1px solid #eee' }}>
            <span style={{ fontSize: '0.8rem', color: '#666' }}>
              Página {data.page} de {Math.ceil(data.total / data.pageSize)}
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                disabled={page <= 1}
                className="admin-secondary admin-small"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                ← Anterior
              </button>
              <button
                type="button"
                disabled={page >= Math.ceil(data.total / data.pageSize)}
                className="admin-secondary admin-small"
                onClick={() => setPage((p) => p + 1)}
              >
                Siguiente →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Inspector de Cambios / Metadata */}
      {inspectEntry && (
        <div className="update-dialog-backdrop open" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="update-dialog" style={{ width: '100%', maxWidth: '640px' }}>
            <div className="admin-panel-head">
              <div>
                <span className="eyebrow"><span className="eyebrow-line"></span> {inspectEntry.action}</span>
                <h2>Detalle de Cambios del Evento</h2>
                <p>Datos ofuscados automáticamente antes de persistir.</p>
              </div>
              <button type="button" className="admin-secondary admin-small" onClick={() => setInspectEntry(null)}>✕</button>
            </div>

            <div style={{ background: '#1e1e1e', color: '#d4d4d4', padding: '14px', borderRadius: '8px', overflowX: 'auto', maxHeight: '350px', fontSize: '0.8rem', fontFamily: 'monospace' }}>
              <pre style={{ margin: 0 }}>
                {JSON.stringify(inspectEntry.changes, null, 2)}
              </pre>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button type="button" className="admin-primary admin-small" onClick={() => setInspectEntry(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
