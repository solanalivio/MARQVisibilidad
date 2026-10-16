'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { AdminUser, RoleView, CreateUserRequest, PASSWORD_MIN_LENGTH } from '@marq/shared';
import { IconUser, IconPlus, IconShield, IconCheck } from '@/components/crm/Icons';

export default function AdminUsuariosPage() {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);

  // Form states for creating user
  const [newEmail, setNewEmail] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>(['comercial']);
  const [formError, setFormError] = useState<string | null>(null);

  // Edit user state
  const [editFullName, setEditFullName] = useState('');
  const [editActive, setEditActive] = useState(true);
  const [editRoles, setEditRoles] = useState<string[]>([]);
  const [editPassword, setEditPassword] = useState('');

  // Fetch users
  const { data: users = [], isLoading, refetch } = useQuery<AdminUser[]>({
    queryKey: ['admin-users'],
    queryFn: () => api.get<AdminUser[]>('/users'),
  });

  // Fetch roles
  const { data: roles = [] } = useQuery<RoleView[]>({
    queryKey: ['admin-roles'],
    queryFn: () => api.get<RoleView[]>('/roles'),
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: (dto: CreateUserRequest) => api.post<AdminUser>('/users', dto),
    onSuccess: () => {
      refetch();
      setShowCreateModal(false);
      setNewEmail('');
      setNewFullName('');
      setNewPassword('');
      setSelectedRoles(['comercial']);
      setFormError(null);
    },
    onError: (err: any) => {
      setFormError(err.message || 'Error al crear el usuario');
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: any }) => api.patch(`/users/${id}`, dto),
    onSuccess: () => {
      refetch();
      setEditingUser(null);
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < PASSWORD_MIN_LENGTH) {
      setFormError(`La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres`);
      return;
    }
    createUserMutation.mutate({
      email: newEmail.trim(),
      fullName: newFullName.trim(),
      password: newPassword,
      roleKeys: selectedRoles,
    });
  };

  const openEditModal = (u: AdminUser) => {
    setEditingUser(u);
    setEditFullName(u.fullName);
    setEditActive(u.isActive);
    setEditRoles(u.roles);
    setEditPassword('');
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    const payload: any = {
      fullName: editFullName.trim(),
      isActive: editActive,
      roleKeys: editRoles,
    };
    if (editPassword.trim()) {
      if (editPassword.length < PASSWORD_MIN_LENGTH) {
        alert(`La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres`);
        return;
      }
      payload.password = editPassword.trim();
    }

    updateUserMutation.mutate({ id: editingUser.id, dto: payload });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <span className="eyebrow"><span className="eyebrow-line"></span> SEGURIDAD Y ACCESOS</span>
          <h1 style={{ margin: '4px 0', fontSize: '1.6rem', fontWeight: 600 }}>Gestión de Usuarios y Roles</h1>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.85rem' }}>
            Control de cuentas, políticas de contraseñas y permisos RBAC del CRM.
          </p>
        </div>

        <button
          type="button"
          className="admin-primary"
          onClick={() => setShowCreateModal(true)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <IconPlus size={16} /> Nuevo Usuario
        </button>
      </div>

      <div className="admin-panel" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#fafafa', borderBottom: '1px solid #eee', color: '#666' }}>
                <th style={{ padding: '12px 16px' }}>Nombre</th>
                <th style={{ padding: '12px 16px' }}>Email</th>
                <th style={{ padding: '12px 16px' }}>Roles</th>
                <th style={{ padding: '12px 16px' }}>Estado</th>
                <th style={{ padding: '12px 16px' }}>Último Acceso</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isLocked = u.lockedUntil && new Date(u.lockedUntil) > new Date();

                return (
                  <tr key={u.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>{u.fullName}</td>
                    <td style={{ padding: '12px 16px' }}>{u.email}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {u.roles.map((r) => (
                          <span
                            key={r}
                            style={{
                              padding: '2px 8px',
                              borderRadius: '4px',
                              background: '#eee',
                              fontSize: '0.72rem',
                              fontWeight: 600,
                            }}
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {isLocked ? (
                        <span style={{ padding: '2px 8px', borderRadius: '4px', background: '#fee2e2', color: '#991b1b', fontSize: '0.75rem', fontWeight: 600 }}>
                          Bloqueado temporal
                        </span>
                      ) : u.isActive ? (
                        <span style={{ padding: '2px 8px', borderRadius: '4px', background: '#e8f5e9', color: '#2e7d32', fontSize: '0.75rem', fontWeight: 600 }}>
                          Activo
                        </span>
                      ) : (
                        <span style={{ padding: '2px 8px', borderRadius: '4px', background: '#f5f5f5', color: '#888', fontSize: '0.75rem' }}>
                          Inactivo
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#666', fontSize: '0.8rem' }}>
                      {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('es-AR') : 'Nunca'}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <button
                        type="button"
                        className="admin-link"
                        onClick={() => openEditModal(u)}
                      >
                        Editar permisos →
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Crear Usuario */}
      {showCreateModal && (
        <div className="update-dialog-backdrop open" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="update-dialog" style={{ width: '100%', maxWidth: '500px' }}>
            <div className="admin-panel-head">
              <h2>Crear Usuario</h2>
              <button type="button" className="admin-secondary admin-small" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>

            {formError && (
              <div style={{ padding: '0.75rem', background: '#fee2e2', color: '#991b1b', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.85rem' }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>Nombre completo *</label>
                <input
                  type="text"
                  required
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid #ccc' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>Correo electrónico *</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid #ccc' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                  Contraseña inicial * (mínimo 12 caracteres)
                </label>
                <input
                  type="password"
                  required
                  minLength={PASSWORD_MIN_LENGTH}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid #ccc' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem' }}>Roles asignados</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {roles.map((r) => {
                    const sel = selectedRoles.includes(r.key);
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() =>
                          setSelectedRoles((prev) =>
                            prev.includes(r.key) ? prev.filter((k) => k !== r.key) : [...prev, r.key]
                          )
                        }
                        style={{
                          padding: '6px 12px',
                          borderRadius: '999px',
                          border: '1px solid',
                          borderColor: sel ? 'var(--brand)' : '#ccc',
                          background: sel ? 'var(--brand)' : '#fff',
                          color: sel ? '#fff' : 'var(--ink)',
                          fontSize: '0.78rem',
                          cursor: 'pointer',
                        }}
                      >
                        {r.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '0.5rem' }}>
                <button type="button" className="admin-secondary" onClick={() => setShowCreateModal(false)}>Cancelar</button>
                <button type="submit" disabled={createUserMutation.isPending} className="admin-primary">
                  {createUserMutation.isPending ? 'Creando…' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Usuario */}
      {editingUser && (
        <div className="update-dialog-backdrop open" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="update-dialog" style={{ width: '100%', maxWidth: '500px' }}>
            <div className="admin-panel-head">
              <h2>Editar {editingUser.email}</h2>
              <button type="button" className="admin-secondary admin-small" onClick={() => setEditingUser(null)}>✕</button>
            </div>

            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>Nombre completo</label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid #ccc' }}
                />
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={editActive}
                    onChange={(e) => setEditActive(e.target.checked)}
                  />
                  Cuenta activa (permite inicio de sesión)
                </label>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem' }}>Roles asignados</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {roles.map((r) => {
                    const sel = editRoles.includes(r.key);
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() =>
                          setEditRoles((prev) =>
                            prev.includes(r.key) ? prev.filter((k) => k !== r.key) : [...prev, r.key]
                          )
                        }
                        style={{
                          padding: '6px 12px',
                          borderRadius: '999px',
                          border: '1px solid',
                          borderColor: sel ? 'var(--brand)' : '#ccc',
                          background: sel ? 'var(--brand)' : '#fff',
                          color: sel ? '#fff' : 'var(--ink)',
                          fontSize: '0.78rem',
                          cursor: 'pointer',
                        }}
                      >
                        {r.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                  Nueva contraseña (dejar vacío para no cambiarla)
                </label>
                <input
                  type="password"
                  placeholder="Mínimo 12 caracteres"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid #ccc' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '0.5rem' }}>
                <button type="button" className="admin-secondary" onClick={() => setEditingUser(null)}>Cancelar</button>
                <button type="submit" disabled={updateUserMutation.isPending} className="admin-primary">
                  {updateUserMutation.isPending ? 'Guardando…' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
