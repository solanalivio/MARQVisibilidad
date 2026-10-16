'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  PublicProject,
  TargetProfile,
  ProjectCategory,
  PROJECT_CATEGORY_LABELS,
  TARGET_PROFILE_LABELS,
  PROJECT_STAGE_LABELS,
} from '@marq/shared';
import { api } from '@/lib/api';

interface ProjectsSectionProps {
  projects: PublicProject[];
  onOpenTeam: (project: PublicProject) => void;
  initialProfile?: TargetProfile | null;
  askedProjectSlugs?: string[];
  pickedProjectSlugs?: string[];
}

const CATEGORIES = [
  { key: 'Todos', label: 'Ver Todos' },
  { key: 'edificios', label: 'Edificios' },
  { key: 'casas', label: 'Casas' },
  { key: 'lotes', label: 'Lotes' },
  { key: 'interiorismo', label: 'Interiorismo' },
  { key: 'locales_comerciales', label: 'Locales Comerciales' },
  { key: 'edificios_especiales', label: 'Edificios Especiales' },
];

const normalizeImg = (url?: string | null) => {
  if (!url) return '';
  return url.startsWith('img/') ? `/${url}` : url;
};

export default function ProjectsSection({
  projects,
  onOpenTeam,
  initialProfile = null,
  askedProjectSlugs = [],
  pickedProjectSlugs = [],
}: ProjectsSectionProps) {
  const [currentProfile, setCurrentProfile] = useState<TargetProfile | null>(initialProfile);
  const [activeCategory, setActiveCategory] = useState<string>('Todos');

  useEffect(() => {
    setCurrentProfile(initialProfile);
  }, [initialProfile]);

  const handleProfileSelect = (prof: TargetProfile) => {
    const next = currentProfile === prof ? null : prof;
    setCurrentProfile(next);
    if (next) {
      api.post('/public/events', { type: next === 'inversion' ? 'profile_inversion' : 'profile_vivienda' }).catch(() => {});
    }
  };

  const visibleProjects = useMemo(() => {
    const filtered =
      activeCategory === 'Todos'
        ? [...projects]
        : projects.filter((p) => p.category === activeCategory);

    const asked = (p: PublicProject) => askedProjectSlugs.includes(p.slug);
    const picked = (p: PublicProject) => pickedProjectSlugs.includes(p.slug);
    const recommended = (p: PublicProject) => Boolean(currentProfile && p.targetProfiles.includes(currentProfile));

    const rank = (p: PublicProject) =>
      (asked(p) || picked(p) ? 0 : 4) +
      (recommended(p) ? 0 : 2) +
      (p.forSale ? 0 : 1);

    return filtered.sort((a, b) => rank(a) - rank(b) || a.sortOrder - b.sortOrder);
  }, [projects, activeCategory, currentProfile, askedProjectSlugs, pickedProjectSlugs]);

  const totalStr = String(visibleProjects.length).padStart(2, '0');
  const activeCatLabel =
    activeCategory === 'Todos'
      ? 'Todos'
      : PROJECT_CATEGORY_LABELS[activeCategory as ProjectCategory] || activeCategory;

  return (
    <>
      <section className="intro page-width" id="proyectos">
        <div className="projects-head">
          <div className="eyebrow is-visible" data-reveal>
            <span className="eyebrow-line"></span> PROYECTOS
          </div>
          <h2 className="section-title is-visible" data-reveal data-split>
            Encontrá tu lugar <em>en la ciudad.</em>
          </h2>
        </div>

        <div className="profile-picker" role="group" aria-label="¿Qué estás buscando?">
          <p className="profile-question">
            <span className="eyebrow-line"></span> ¿QUÉ ESTÁS BUSCANDO?
          </p>
          <button
            className={`profile-card is-visible ${currentProfile === 'vivienda' ? 'selected' : ''}`.trim()}
            type="button"
            data-profile="vivienda"
            data-reveal
            aria-pressed={currentProfile === 'vivienda'}
            onClick={() => handleProfileSelect('vivienda')}
          >
            <span className="profile-kicker">Para vivir</span>
            <strong>Busco mi próxima vivienda</strong>
            <span>Los proyectos pensados para vivir y cómo se accede a cada uno.</span>
            <span className="profile-arrow" aria-hidden="true">
              ↗
            </span>
          </button>
          <button
            className={`profile-card is-visible ${currentProfile === 'inversion' ? 'selected' : ''}`.trim()}
            type="button"
            data-profile="inversion"
            data-reveal
            aria-pressed={currentProfile === 'inversion'}
            style={{ ['--d' as any]: '0.08s' }}
            onClick={() => handleProfileSelect('inversion')}
          >
            <span className="profile-kicker">Para invertir</span>
            <strong>Busco oportunidades de inversión</strong>
            <span>Los proyectos para invertir y en qué etapa está cada uno.</span>
            <span className="profile-arrow" aria-hidden="true">
              ↗
            </span>
          </button>
        </div>

        <div className="project-toolbar">
          <div className="filters" role="group" aria-label="Filtrar proyectos">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                type="button"
                data-filter={cat.key}
                className={`filter ${activeCategory === cat.key ? 'active' : ''}`.trim()}
                onClick={() => setActiveCategory(cat.key)}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="projects-section page-width" aria-label="Listado de proyectos">
        <div className="projects-grid" id="projects-grid">
          {visibleProjects.length > 0 ? (
            visibleProjects.map((project, index) => {
              const isAsked = askedProjectSlugs.includes(project.slug);
              const isPicked = pickedProjectSlugs.includes(project.slug);
              const isRecommended = Boolean(currentProfile && project.targetProfiles.includes(currentProfile));

              const flag = isAsked
                ? 'Consultaste por este proyecto'
                : isPicked
                ? 'Elegido para vos'
                : isRecommended && currentProfile
                ? TARGET_PROFILE_LABELS[currentProfile].tab
                : '';

              const hint =
                currentProfile === 'inversion'
                  ? `${PROJECT_STAGE_LABELS[project.stage]?.label} · ${PROJECT_STAGE_LABELS[project.stage]?.short}`
                  : currentProfile === 'vivienda'
                  ? project.livingHint
                  : '';

              const statusTone = /pozo|preventa/i.test(project.statusLabel)
                ? 'is-presale'
                : /obra|construcción|desarrollo/i.test(project.statusLabel)
                ? 'is-building'
                : /venta|unidades/i.test(project.statusLabel)
                ? 'is-selling'
                : '';

              const catLabel = PROJECT_CATEGORY_LABELS[project.category] || project.category;

              return (
                <article
                  key={project.id}
                  className="project-card"
                  id={project.slug}
                  style={{ ['--i' as any]: index % 3 }}
                >
                  <div className="project-image-wrap">
                    <img
                      className="project-image"
                      src={normalizeImg(project.imageUrl)}
                      alt={project.imageAlt}
                      loading="lazy"
                    />
                    {flag && <span className="card-flag">{flag}</span>}
                    <span className={`card-status ${statusTone}`}>{project.statusLabel}</span>
                    <span className="image-count">
                      {String(index + 1).padStart(2, '0')} / {totalStr}
                    </span>
                  </div>
                  <div className="project-info">
                    <div className="project-meta">
                      <span className="project-category">
                        {catLabel}
                        {project.year ? ` · ${project.year}` : ''}
                      </span>
                      <span className="project-year">{project.location}</span>
                    </div>
                    <h2 className="project-title">{project.name}</h2>
                    <p className="project-description">{project.description}</p>
                    {project.facts && project.facts.length > 0 && (
                      <ul className="project-facts">
                        {project.facts.map((fact) => (
                          <li key={fact}>{fact}</li>
                        ))}
                      </ul>
                    )}
                    {hint && project.forSale && <p className="profile-hint">{hint}</p>}
                    <div className="project-actions">
                      <button className="team-link" type="button" onClick={() => onOpenTeam(project)}>
                        Conocé quiénes están detrás <span>↗</span>
                      </button>
                      {!project.forSale && (
                        <span className="project-done">
                          {/terminad/i.test(project.statusLabel) ? 'Obra realizada' : 'Próximamente'}
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              );
            })
          ) : (
            <div className="projects-empty">
              <p>
                Todavía no hay proyectos publicados en <strong>{activeCatLabel}</strong>.
              </p>
              <button className="text-link" type="button" onClick={() => setActiveCategory('Todos')}>
                Ver todos los proyectos <span>↗</span>
              </button>
            </div>
          )}
        </div>

        <div className="end-note">
          <span id="end-note-count">01 — {totalStr}</span>
          <span>DISEÑADOS PARA VIVIRLOS</span>
          <span>MARQ © 2026</span>
        </div>
      </section>
    </>
  );
}
