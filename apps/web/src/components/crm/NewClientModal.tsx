'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';
import { Channel, ClientSegment, CreateClientRequest } from '@marq/shared';

interface NewClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (client: any) => void;
  defaultSegment?: ClientSegment;
  projects?: { id: string; name: string }[];
}

export function NewClientModal({
  isOpen,
  onClose,
  onCreated,
  defaultSegment = 'particular',
  projects = [],
}: NewClientModalProps) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [segment, setSegment] = useState<ClientSegment>(defaultSegment);
  const [source, setSource] = useState<Channel>('whatsapp');
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [budgetUsd, setBudgetUsd] = useState<string>('');
  const [firstNote, setFirstNote] = useState('');
  const [taskText, setTaskText] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload: CreateClientRequest = {
        fullName: fullName.trim(),
        phone: phone.replace(/[^0-9]/g, ''),
        email: email.trim() ? email.trim() : null,
        segment,
        source,
        projectIds: selectedProjects,
        firstNote: firstNote.trim() || 'Primer contacto registrado desde MARQ Contigo',
        profile: {
          budgetUsd: budgetUsd ? Number(budgetUsd) : null,
        },
        nextTask: taskText.trim() && taskDueDate ? {
          text: taskText.trim(),
          dueDate: taskDueDate,
        } : null,
      };

      const created = await api.post('/clients', payload);
      onCreated(created);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al guardar el contacto');
    } finally {
      setLoading(false);
    }
  };

  const toggleProject = (id: string) => {
    setSelectedProjects(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  return (
    <div className="update-dialog-backdrop open" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="update-dialog" style={{ width: '100%', maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="admin-panel-head">
          <div>
            <span className="eyebrow"><span className="eyebrow-line"></span> MARQ CONTIGO</span>
            <h2>Nuevo contacto</h2>
            <p>Registrá a la persona con los datos iniciales de contacto.</p>
          </div>
          <button type="button" className="admin-secondary admin-small" onClick={onClose}>✕</button>
        </div>

        {error && (
          <div style={{ padding: '0.75rem', background: '#fde8e8', color: '#9b1c1c', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
              Nombre y apellido *
            </label>
            <input
              type="text"
              required
              value={fullName}
              placeholder="Ej. Martín Gómez"
              onChange={e => setFullName(e.target.value)}
              style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid #ccc' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                Teléfono (con cód. país) *
              </label>
              <input
                type="tel"
                required
                value={phone}
                placeholder="5493624000001"
                onChange={e => setPhone(e.target.value)}
                style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid #ccc' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                placeholder="martin@correo.com"
                onChange={e => setEmail(e.target.value)}
                style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid #ccc' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                Segmento *
              </label>
              <select
                value={segment}
                onChange={e => setSegment(e.target.value as ClientSegment)}
                style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid #ccc' }}
              >
                <option value="inversor">Inversor (▲)</option>
                <option value="particular">Particular / Familia (●)</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                Origen del contacto
              </label>
              <select
                value={source}
                onChange={e => setSource(e.target.value as Channel)}
                style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid #ccc' }}
              >
                <option value="whatsapp">WhatsApp</option>
                <option value="instagram">Instagram</option>
                <option value="sitio_web">Sitio web</option>
                <option value="llamada">Llamada telefónica</option>
                <option value="presencial">Presencial / Oficina</option>
                <option value="reunion">Reunión previa</option>
                <option value="email">Email</option>
                <option value="facebook">Facebook</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
              Presupuesto estimado (USD)
            </label>
            <input
              type="number"
              value={budgetUsd}
              placeholder="Ej. 65000"
              onChange={e => setBudgetUsd(e.target.value)}
              style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid #ccc' }}
            />
          </div>

          {projects.length > 0 && (
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                Proyectos de interés
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {projects.map(p => {
                  const sel = selectedProjects.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => toggleProject(p.id)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '999px',
                        border: '1px solid',
                        borderColor: sel ? 'var(--brand)' : '#ccc',
                        background: sel ? 'var(--brand)' : '#fff',
                        color: sel ? '#fff' : 'var(--ink)',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                      }}
                    >
                      {p.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
              Nota del primer contacto *
            </label>
            <textarea
              required
              rows={2}
              value={firstNote}
              placeholder="¿Qué consultó? ¿Qué dudas expresó en la conversación inicial?"
              onChange={e => setFirstNote(e.target.value)}
              style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid #ccc', resize: 'vertical' }}
            />
          </div>

          <div style={{ background: '#fdfbf7', padding: '12px', borderRadius: '8px', border: '1px dashed #dcd4c6' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
              Próximo paso / tarea inmediata (opcional)
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '8px' }}>
              <input
                type="text"
                value={taskText}
                placeholder="Ej. Enviar ficha técnica de 2 amb"
                onChange={e => setTaskText(e.target.value)}
                style={{ padding: '0.55rem', borderRadius: '6px', border: '1px solid #ccc', fontSize: '0.8rem' }}
              />
              <input
                type="date"
                value={taskDueDate}
                onChange={e => setTaskDueDate(e.target.value)}
                style={{ padding: '0.55rem', borderRadius: '6px', border: '1px solid #ccc', fontSize: '0.8rem' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '0.5rem' }}>
            <button type="button" className="admin-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" disabled={loading} className="admin-primary">
              {loading ? 'Guardando…' : 'Crear contacto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
