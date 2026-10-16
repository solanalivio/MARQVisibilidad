'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';
import { MeetingPlace, ScheduleMeetingRequest } from '@marq/shared';

interface ScheduleMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  clientId: string;
  clientName: string;
  projects?: { id: string; name: string }[];
}

export function ScheduleMeetingModal({
  isOpen,
  onClose,
  onSuccess,
  clientId,
  clientName,
  projects = [],
}: ScheduleMeetingModalProps) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDate = tomorrow.toISOString().slice(0, 10);

  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState('10:00');
  const [place, setPlace] = useState<MeetingPlace>('showroom');
  const [projectId, setProjectId] = useState<string>(projects[0]?.id || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload: ScheduleMeetingRequest = {
        date,
        time,
        place,
        projectId: projectId || undefined,
      };

      await api.put(`/clients/${clientId}/meeting`, payload);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al agendar reunión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="update-dialog-backdrop open" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="update-dialog" style={{ width: '100%', maxWidth: '500px' }}>
        <div className="admin-panel-head">
          <div>
            <span className="eyebrow"><span className="eyebrow-line"></span> {clientName}</span>
            <h2>Agendar reunión</h2>
            <p>Se creará la cita en la agenda de MARQ Contigo.</p>
          </div>
          <button type="button" className="admin-secondary admin-small" onClick={onClose}>✕</button>
        </div>

        {error && (
          <div style={{ padding: '0.75rem', background: '#fde8e8', color: '#9b1c1c', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                Fecha *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid #ccc' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                Hora *
              </label>
              <input
                type="time"
                required
                value={time}
                onChange={e => setTime(e.target.value)}
                style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid #ccc' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
              Lugar / Modalidad *
            </label>
            <select
              value={place}
              onChange={e => setPlace(e.target.value as MeetingPlace)}
              style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid #ccc' }}
            >
              <option value="showroom">Showroom central MARQ</option>
              <option value="obra">Visita in situ a la obra</option>
              <option value="estudio">Oficinas del Estudio</option>
            </select>
          </div>

          {projects.length > 0 && (
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                Proyecto a presentar (opcional)
              </label>
              <select
                value={projectId}
                onChange={e => setProjectId(e.target.value)}
                style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid #ccc' }}
              >
                <option value="">Cualquiera / Cartera general</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '0.5rem' }}>
            <button type="button" className="admin-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" disabled={loading} className="admin-primary">
              {loading ? 'Agendando…' : 'Confirmar reunión'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
