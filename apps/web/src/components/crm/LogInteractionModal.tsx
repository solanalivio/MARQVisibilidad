'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';
import { Channel, PipelineStatus, VisitOutcome, LogInteractionRequest } from '@marq/shared';

interface LogInteractionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  clientId: string;
  clientName: string;
  openTask?: { id: string; text: string; kind: string } | null;
}

export function LogInteractionModal({
  isOpen,
  onClose,
  onSuccess,
  clientId,
  clientName,
  openTask,
}: LogInteractionModalProps) {
  const [mode, setMode] = useState<'log' | 'complete'>(openTask ? 'complete' : 'log');
  const [channel, setChannel] = useState<Channel>('whatsapp');
  const [occurredOn, setOccurredOn] = useState<string>(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState('');
  const [status, setStatus] = useState<PipelineStatus | ''>('');
  const [visitOutcome, setVisitOutcome] = useState<VisitOutcome | ''>('');
  const [nextTaskText, setNextTaskText] = useState('');
  const [nextTaskDate, setNextTaskDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload: LogInteractionRequest = {
        mode,
        occurredOn,
        channel,
        note: note.trim(),
        status: status ? (status as PipelineStatus) : undefined,
        visitOutcome: visitOutcome ? (visitOutcome as VisitOutcome) : undefined,
        nextTask: nextTaskText.trim() && nextTaskDate ? {
          text: nextTaskText.trim(),
          dueDate: nextTaskDate,
        } : undefined,
      };

      await api.post(`/clients/${clientId}/interactions`, payload);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al registrar interacción');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="update-dialog-backdrop open" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="update-dialog" style={{ width: '100%', maxWidth: '540px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="admin-panel-head">
          <div>
            <span className="eyebrow"><span className="eyebrow-line"></span> {clientName}</span>
            <h2>{mode === 'complete' && openTask ? 'Completar tarea / interacción' : 'Registrar interacción'}</h2>
            <p>Quedará asentada en la bitácora del cliente con trazabilidad.</p>
          </div>
          <button type="button" className="admin-secondary admin-small" onClick={onClose}>✕</button>
        </div>

        {error && (
          <div style={{ padding: '0.75rem', background: '#fde8e8', color: '#9b1c1c', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        {openTask && (
          <div style={{ background: '#fdfbf7', padding: '10px 14px', borderRadius: '8px', border: '1px solid #ebdcc5', marginBottom: '1rem', fontSize: '0.85rem' }}>
            <span style={{ fontWeight: 600, color: 'var(--brand)' }}>Tarea pendiente: </span>
            <span>{openTask.text}</span>
            <div style={{ marginTop: '6px', display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className={`admin-secondary admin-small ${mode === 'complete' ? 'admin-primary' : ''}`}
                onClick={() => setMode('complete')}
              >
                Completar esta tarea
              </button>
              <button
                type="button"
                className={`admin-secondary admin-small ${mode === 'log' ? 'admin-primary' : ''}`}
                onClick={() => setMode('log')}
              >
                Otra interacción suelta
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                Canal
              </label>
              <select
                value={channel}
                onChange={e => setChannel(e.target.value as Channel)}
                style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid #ccc' }}
              >
                <option value="whatsapp">WhatsApp</option>
                <option value="llamada">Llamada telefónica</option>
                <option value="reunion">Reunión presencial / Virtual</option>
                <option value="email">Correo electrónico</option>
                <option value="visita">Visita en showroom/obra</option>
                <option value="instagram">Instagram</option>
                <option value="presencial">Presencial / Oficina</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                Fecha
              </label>
              <input
                type="date"
                required
                value={occurredOn}
                onChange={e => setOccurredOn(e.target.value)}
                style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid #ccc' }}
              />
            </div>
          </div>

          {openTask?.kind === 'meeting' && mode === 'complete' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                Resultado de la reunión *
              </label>
              <select
                required
                value={visitOutcome}
                onChange={e => setVisitOutcome(e.target.value as VisitOutcome)}
                style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid #ccc' }}
              >
                <option value="">Seleccionar resultado…</option>
                <option value="done">Reunión realizada exitosamente (done)</option>
                <option value="noshow">El cliente no asistió / canceló (noshow)</option>
              </select>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
              Notas de la conversación *
            </label>
            <textarea
              required
              rows={3}
              value={note}
              placeholder="¿Qué se acordó? ¿Qué avances o dudas surgieron?"
              onChange={e => setNote(e.target.value)}
              style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid #ccc', resize: 'vertical' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
              Actualizar etapa del pipeline (opcional)
            </label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as PipelineStatus)}
              style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid #ccc' }}
            >
              <option value="">Mantener etapa actual</option>
              <option value="nuevo_contacto">Nuevo contacto</option>
              <option value="en_conversacion">En conversación</option>
              <option value="informacion_enviada">Información enviada</option>
              <option value="visita_agendada">Visita agendada</option>
              <option value="en_negociacion">En negociación</option>
              <option value="cerro_operacion">Cerró operación</option>
              <option value="sin_interes">Sin interés por ahora</option>
            </select>
          </div>

          <div style={{ background: '#fdfbf7', padding: '12px', borderRadius: '8px', border: '1px dashed #dcd4c6' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
              Próximo paso programado (opcional)
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '8px' }}>
              <input
                type="text"
                value={nextTaskText}
                placeholder="Ej. Llamar para confirmar reserva"
                onChange={e => setNextTaskText(e.target.value)}
                style={{ padding: '0.55rem', borderRadius: '6px', border: '1px solid #ccc', fontSize: '0.8rem' }}
              />
              <input
                type="date"
                value={nextTaskDate}
                onChange={e => setNextTaskDate(e.target.value)}
                style={{ padding: '0.55rem', borderRadius: '6px', border: '1px solid #ccc', fontSize: '0.8rem' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '0.5rem' }}>
            <button type="button" className="admin-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" disabled={loading} className="admin-primary">
              {loading ? 'Guardando…' : 'Registrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
