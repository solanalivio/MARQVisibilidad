'use client';

import React, { useEffect } from 'react';
import { PublicProject, PROJECT_CATEGORY_LABELS, NEWS_TYPE_LABELS } from '@marq/shared';

interface TeamModalProps {
  project: PublicProject | null;
  totalProjects: number;
  onClose: () => void;
}

export default function TeamModal({ project, totalProjects, onClose }: TeamModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (project) {
      document.body.classList.add('modal-open');
      window.addEventListener('keydown', onKey);
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => {
      document.body.classList.remove('modal-open');
      window.removeEventListener('keydown', onKey);
    };
  }, [project, onClose]);

  if (!project) return null;

  const initials = (name: string) =>
    name
      .replace(/^Arq\.\s*/, '')
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();

  const formatDate = (iso: string) => (iso ? iso.split('-').reverse().join('/') : '');
  const catLabel = PROJECT_CATEGORY_LABELS[project.category] || project.category;

  return (
    <div className="modal open" id="team-modal" aria-hidden="false">
      <div className="modal-backdrop" onClick={onClose}></div>
      <section className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <button type="button" className="modal-close" aria-label="Cerrar ventana" onClick={onClose}>
          ×
        </button>
        <div className="modal-scroll">
          <div className="modal-topline">
            <span className="eyebrow">
              <span className="eyebrow-line"></span> EL EQUIPO DETRÁS
            </span>
            <span className="modal-index">
              PROYECTO {String(project.sortOrder).padStart(2, '0')} / {String(totalProjects).padStart(2, '0')}
            </span>
          </div>

          <div className="modal-heading">
            <div>
              <span className="project-category modal-category">{catLabel}</span>
              <h2 id="modal-title">{project.name}</h2>
            </div>
            <p className="modal-lede">
              Un proyecto no se construye solamente a partir de una idea. Conocé a quienes participaron en hacerlo realidad.
            </p>
          </div>

          <div className="team-intro">
            <h3>
              Detrás de cada
              <br />
              <em>proyecto</em>
            </h3>
            <p>Personas, equipos y organizaciones que aportaron su experiencia, sus ideas y su trabajo.</p>
          </div>

          <div className="team-grid" id="team-grid">
            {project.team.map((person) => (
              <article key={person.name} className="person-card">
                {person.imageUrl ? (
                  <img
                    className="person-photo"
                    src={person.imageUrl}
                    alt={`Retrato de ${person.name}`}
                    loading="lazy"
                  />
                ) : (
                  <div className="person-photo monogram" aria-hidden="true">
                    {initials(person.name)}
                  </div>
                )}
                <div className="person-content">
                  <span className="person-role">{person.role}</span>
                  <h4 className="person-name">{person.name}</h4>
                  <p className="person-description">{person.description}</p>
                </div>
              </article>
            ))}
          </div>

          <section className="public-updates">
            <span className="eyebrow">
              <span className="eyebrow-line"></span> NOVEDADES DEL PROYECTO
            </span>
            <h3>Lo último de {project.name}</h3>
            {project.news && project.news.length > 0 ? (
              project.news.map((item) => (
                <article key={item.id} className="update-card">
                  <span>
                    {formatDate(item.publishedOn)} · {NEWS_TYPE_LABELS[item.type] || item.type}
                  </span>
                  <h4>{item.title}</h4>
                  <p>{item.body}</p>
                </article>
              ))
            ) : (
              <p className="updates-empty">Pronto compartiremos novedades de este proyecto.</p>
            )}
          </section>

          <div className="modal-bottom">
            <span>UN PROYECTO MARQ</span>
            <button className="return-button" type="button" onClick={onClose}>
              Volver al proyecto <span>↗</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
