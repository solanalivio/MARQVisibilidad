'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login({ email, password });
      router.push('/contigo/resumen');
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f4f0ea',
        padding: '1.5rem',
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="admin-panel"
        style={{
          width: '100%',
          maxWidth: '420px',
          boxShadow: '0 12px 36px rgba(0,0,0,0.06)',
          borderRadius: '12px',
          background: '#fff',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div className="company-brand" style={{ display: 'inline-flex', fontSize: '1.4rem' }}>
            <b>marQ</b>
            <span>CONTIGO</span>
          </div>
          <p style={{ marginTop: '0.5rem', color: '#666', fontSize: '0.9rem' }}>
            Acceso al espacio de seguimiento comercial
          </p>
        </div>

        {error && (
          <div
            style={{
              padding: '0.75rem',
              background: '#fde8e8',
              color: '#9b1c1c',
              borderRadius: '6px',
              marginBottom: '1rem',
              fontSize: '0.85rem',
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <label>
            Correo electrónico
            <input
              type="email"
              required
              value={email}
              placeholder="nombre@estudiomarq.com.ar"
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', marginTop: '0.35rem', borderRadius: '6px', border: '1px solid #ccc' }}
            />
          </label>

          <label>
            Contraseña
            <input
              type="password"
              required
              value={password}
              placeholder="••••••••••••"
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', marginTop: '0.35rem', borderRadius: '6px', border: '1px solid #ccc' }}
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="admin-primary"
            style={{ width: '100%', marginTop: '0.5rem', padding: '0.85rem' }}
          >
            {loading ? 'Iniciando sesión…' : 'Ingresar a MARQ Contigo'}
          </button>
        </div>

        <p style={{ marginTop: '1.5rem', fontSize: '0.8rem', color: '#888', textAlign: 'center' }}>
          Credenciales semilla: admin@estudiomarq.com.ar / Marq2026!Secure
        </p>
      </form>
    </div>
  );
}
