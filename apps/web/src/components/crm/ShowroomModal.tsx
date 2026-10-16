'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';
import { ShowroomLinkCreated } from '@marq/shared';
import { IconCopy, IconCheck, IconExternal } from './Icons';

interface ShowroomModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  clientName: string;
  clientPhone: string;
  projects: { id: string; name: string }[];
  initialSelectedIds?: string[];
}

export function ShowroomModal({
  isOpen,
  onClose,
  clientId,
  clientName,
  clientPhone,
  projects,
  initialSelectedIds = [],
}: ShowroomModalProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(
    initialSelectedIds.length > 0 ? initialSelectedIds : projects.slice(0, 3).map(p => p.id)
  );
  const [createdLink, setCreatedLink] = useState<ShowroomLinkCreated | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleProject = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await api.post<ShowroomLinkCreated>(`/clients/${clientId}/showroom`, {
        projectIds: selectedIds,
      });
      setCreatedLink(res);
    } catch (err: any) {
      setError(err.message || 'Error al generar link de showroom');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!createdLink) return;
    navigator.clipboard.writeText(createdLink.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const waText = createdLink
    ? `Hola ${clientName.split(' ')[0]}, te comparto tu showroom personalizado con los desarrollos de Estudio MARQ seleccionados para vos: ${createdLink.url}`
    : '';

  const waUrl = `https://wa.me/${clientPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(waText)}`;

  return (
    <div className="update-dialog-backdrop open" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="update-dialog" style={{ width: '100%', maxWidth: '540px' }}>
        <div className="admin-panel-head">
          <div>
            <span className="eyebrow"><span className="eyebrow-line"></span> {clientName}</span>
            <h2>Showroom personal 3D</h2>
            <p>Generá un acceso privado con proyectos destacados para el cliente.</p>
          </div>
          <button type="button" className="admin-secondary admin-small" onClick={onClose}>✕</button>
        </div>

        {error && (
          <div style={{ padding: '0.75rem', background: '#fde8e8', color: '#9b1c1c', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        {!createdLink ? (
          <div>
            <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.8rem' }}>
              Elegí qué proyectos resaltar en el showroom personalizado:
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '1.5rem', maxHeight: '180px', overflowY: 'auto' }}>
              {projects.map(p => {
                const isSelected = selectedIds.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => toggleProject(p.id)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '999px',
                      border: '1px solid',
                      borderColor: isSelected ? 'var(--brand)' : '#ddd',
                      background: isSelected ? 'var(--brand)' : '#fff',
                      color: isSelected ? '#fff' : 'var(--ink)',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                    }}
                  >
                    {p.name}
                  </button>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" className="admin-secondary" onClick={onClose}>Cancelar</button>
              <button
                type="button"
                disabled={loading || selectedIds.length === 0}
                className="admin-primary"
                onClick={handleGenerate}
              >
                {loading ? 'Generando…' : 'Generar showroom'}
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ background: '#f5efe4', padding: '16px', borderRadius: '10px', marginBottom: '1.2rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#666', marginBottom: '6px' }}>
                Enlace generado (válido por 30 días)
              </label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="text"
                  readOnly
                  value={createdLink.url}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #ccc',
                    background: '#fff',
                    fontSize: '0.82rem',
                    fontFamily: 'monospace',
                  }}
                />
                <button
                  type="button"
                  className="admin-secondary admin-small"
                  onClick={copyToClipboard}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                  {copied ? 'Copiado' : 'Copiar'}
                </button>
              </div>
            </div>

            <p style={{ fontSize: '0.8rem', color: '#666', marginBottom: '1.5rem' }}>
              Toda interacción que {clientName} realice en su showroom (proyectos explorados, solicitud de visita)
              se registrará en tiempo real en su ficha de MARQ Contigo.
            </p>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <a
                href={createdLink.url}
                target="_blank"
                rel="noreferrer"
                className="admin-secondary admin-small"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <IconExternal size={14} /> Probar vista previa
              </a>

              <div style={{ display: 'flex', gap: '8px' }}>
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="admin-primary admin-small"
                  style={{ background: '#25D366', borderColor: '#25D366' }}
                >
                  Enviar por WhatsApp ↗
                </a>
                <button type="button" className="admin-secondary admin-small" onClick={onClose}>Listo</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
