'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers';
import { IconExternal, IconLogOut, IconShield, IconUser } from '@/components/crm/Icons';

export default function ContigoLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();

  useEffect(() => {
    if (!isLoading && !user && pathname !== '/contigo/login') {
      router.replace('/contigo/login');
    }
  }, [isLoading, user, pathname, router]);

  // Si estamos en la página de login, no renderizamos el marco del CRM
  if (pathname === '/contigo/login') {
    return <>{children}</>;
  }

  if (isLoading || !user) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f5efe4',
          fontFamily: 'sans-serif',
          color: '#555',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div className="company-brand" style={{ display: 'inline-flex', fontSize: '1.5rem', marginBottom: '1rem' }}>
            <b>marQ</b>
            <span>CONTIGO</span>
          </div>
          <p style={{ fontSize: '0.9rem', color: '#888' }}>Cargando espacio de trabajo…</p>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    router.replace('/contigo/login');
  };

  const navItems = [
    { href: '/contigo/resumen', label: 'Resumen', mark: null },
    { href: '/contigo/inversores', label: 'Inversores', mark: '▲', section: 'Cartera' },
    { href: '/contigo/particulares', label: 'Particulares', mark: '●' },
    { href: '/contigo/proyectos', label: 'Proyectos y stock', mark: null, section: 'Desarrollos' },
  ];

  const hasUsersManage = user.permissions.includes('users:manage' as any);
  const hasAuditRead = user.permissions.includes('audit:read' as any);

  const getPageTitle = () => {
    if (pathname.includes('/resumen')) return 'Resumen Comercial';
    if (pathname.includes('/inversores')) return 'Cartera de Inversores';
    if (pathname.includes('/particulares')) return 'Cartera de Particulares';
    if (pathname.includes('/contactos/')) return 'Ficha de Contacto';
    if (pathname.includes('/proyectos/')) return 'Detalle de Proyecto';
    if (pathname.includes('/proyectos')) return 'Desarrollos y Stock';
    if (pathname.includes('/admin/usuarios')) return 'Gestión de Usuarios';
    if (pathname.includes('/admin/auditoria')) return 'Auditoría del Sistema';
    return 'Panel';
  };

  const initials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="company-view">
      <div className="company-shell">
        <aside className="company-sidebar" aria-label="Navegación de MARQ Contigo">
          <div className="company-brand">
            <b>marQ</b>
            <span>CONTIGO</span>
          </div>

          <nav className="company-nav">
            <Link
              href="/contigo/resumen"
              className={`company-nav-item ${pathname === '/contigo/resumen' ? 'selected' : ''}`}
            >
              Resumen
            </Link>
          </nav>

          <p className="company-label">Cartera</p>
          <nav className="company-nav">
            <Link
              href="/contigo/inversores"
              className={`company-nav-item ${pathname.startsWith('/contigo/inversores') ? 'selected' : ''}`}
            >
              <span className="nav-mark" style={{ color: '#2b7a97' }}>▲</span>
              Inversores
            </Link>
            <Link
              href="/contigo/particulares"
              className={`company-nav-item ${pathname.startsWith('/contigo/particulares') ? 'selected' : ''}`}
            >
              <span className="nav-mark" style={{ color: '#c47d2b' }}>●</span>
              Particulares
            </Link>
          </nav>

          <p className="company-label">Catálogo</p>
          <nav className="company-nav">
            <Link
              href="/contigo/proyectos"
              className={`company-nav-item ${pathname.startsWith('/contigo/proyectos') ? 'selected' : ''}`}
            >
              <span className="project-dot"></span>
              Proyectos y Stock
            </Link>
          </nav>

          {(hasUsersManage || hasAuditRead) && (
            <>
              <p className="company-label">Seguridad</p>
              <nav className="company-nav">
                {hasUsersManage && (
                  <Link
                    href="/contigo/admin/usuarios"
                    className={`company-nav-item ${pathname.startsWith('/contigo/admin/usuarios') ? 'selected' : ''}`}
                  >
                    <IconUser size={13} style={{ marginRight: '6px' }} />
                    Usuarios y Roles
                  </Link>
                )}
                {hasAuditRead && (
                  <Link
                    href="/contigo/admin/auditoria"
                    className={`company-nav-item ${pathname.startsWith('/contigo/admin/auditoria') ? 'selected' : ''}`}
                  >
                    <IconShield size={13} style={{ marginRight: '6px' }} />
                    Auditoría
                  </Link>
                )}
              </nav>
            </>
          )}

          <div style={{ marginTop: 'auto', paddingTop: '20px' }}>
            <div className="company-user">
              <span className="company-avatar">{initials(user.fullName)}</span>
              <div>
                {user.fullName}
                <small>{user.roles.join(', ') || 'Colaborador'}</small>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
              <Link
                href="/"
                target="_blank"
                className="admin-secondary admin-small"
                style={{
                  background: 'transparent',
                  color: '#ccc',
                  borderColor: 'rgba(255,255,255,0.15)',
                  textDecoration: 'none',
                  justifyContent: 'flex-start',
                }}
              >
                <IconExternal size={13} /> Ver sitio público
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="admin-secondary admin-small"
                style={{
                  background: 'transparent',
                  color: '#e07a5f',
                  borderColor: 'rgba(224,122,95,0.25)',
                  cursor: 'pointer',
                  justifyContent: 'flex-start',
                }}
              >
                <IconLogOut size={13} /> Cerrar sesión
              </button>
            </div>
          </div>
        </aside>

        <div className="company-main">
          <div className="company-topbar">
            <span>
              MARQ Contigo / <b>{getPageTitle()}</b>
            </span>
            <div className="topbar-actions">
              <span
                style={{
                  fontSize: '0.72rem',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  background: '#e8f5e9',
                  color: '#2e7d32',
                  fontWeight: 600,
                }}
              >
                Online
              </span>
              <Link href="/" target="_blank" className="admin-secondary admin-small">
                Ver sitio público ↗
              </Link>
            </div>
          </div>

          <div className="company-content">{children}</div>
        </div>
      </div>
    </div>
  );
}
