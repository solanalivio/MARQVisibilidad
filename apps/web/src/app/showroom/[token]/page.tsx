'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { PublicProject, ShowroomView, INITIAL_PUBLIC_PROJECTS } from '@marq/shared';

import LandingHeader from '@/components/landing/LandingHeader';
import ProjectsSection from '@/components/landing/ProjectsSection';
import LandingFooter from '@/components/landing/LandingFooter';
import TeamModal from '@/components/landing/TeamModal';

const CityMap = dynamic(() => import('@/components/map/CityMap'), {
  ssr: false,
  loading: () => <div style={{ minHeight: '520px', background: '#efe9df' }}></div>,
});

export default function ShowroomPersonalPage() {
  const { token } = useParams<{ token: string }>();
  const queryClient = useQueryClient();
  const [modalProject, setModalProject] = useState<PublicProject | null>(null);

  const { data: showroom, isLoading, isError } = useQuery<ShowroomView>({
    queryKey: ['showroom', token],
    queryFn: () => api.get<ShowroomView>(`/showroom/${token}`),
    enabled: Boolean(token),
  });

  const { data: projects = INITIAL_PUBLIC_PROJECTS } = useQuery<PublicProject[]>({
    queryKey: ['public-projects'],
    queryFn: () => api.get<PublicProject[]>('/public/projects'),
    initialData: INITIAL_PUBLIC_PROJECTS,
  });

  const eventMutation = useMutation({
    mutationFn: (body: any) => api.post<ShowroomView>(`/showroom/${token}/events`, body),
    onSuccess: (updated) => {
      queryClient.setQueryData(['showroom', token], updated);
    },
  });

  useEffect(() => {
    if (!token || !showroom) return;
    document.body.classList.add('showroom-mode');
    document.title = `Showroom de ${showroom.firstName} — Estudio MARQ`;

    const storageKey = `marq-showroom-${token}`;
    if (!sessionStorage.getItem(storageKey)) {
      sessionStorage.setItem(storageKey, '1');
      eventMutation.mutate({ type: 'open' });
    }

    return () => {
      document.body.classList.remove('showroom-mode');
    };
  }, [token, showroom]);

  const handleRequestVisit = () => {
    eventMutation.mutate({ type: 'visit' });
  };

  const handleOpenTeam = (p: PublicProject) => {
    setModalProject(p);
    eventMutation.mutate({ type: 'team', projectSlug: p.slug });
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Cargando tu showroom personal…</p>
      </div>
    );
  }

  if (isError || !showroom) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
        <h2>Showroom no disponible</h2>
        <p>El enlace ingresado no existe o ha expirado.</p>
        <a href="/" className="btn-primary">
          Ir al sitio principal
        </a>
      </div>
    );
  }

  return (
    <>
      <LandingHeader />

      <main id="inicio">
        <div className="page-width" style={{ paddingTop: '100px' }}>
          <div className="showroom-banner" id="showroom-banner">
            <div>
              <span className="eyebrow">
                <span className="eyebrow-line"></span> TU SHOWROOM MARQ
              </span>
              <h2>Hola, {showroom.firstName}. Preparamos este espacio para vos.</h2>
              <p>
                Acá está todo sobre nuestros proyectos: las personas que lo hacen posible, en qué etapa está y dónde
                queda en la ciudad. Cuando quieras, lo vemos en persona.
              </p>
            </div>
            <div className="showroom-side">
              {showroom.visitRequested ? (
                <p className="visit-done">Listo. Te escribimos para coordinar la visita.</p>
              ) : (
                <button className="team-link" type="button" onClick={handleRequestVisit}>
                  Agendar una visita al estudio <span>↗</span>
                </button>
              )}
              <small>Registramos qué proyectos mirás en este espacio para asesorarte mejor. Solo lo ve el equipo de MARQ.</small>
            </div>
          </div>
        </div>

        <CityMap projects={projects} onOpenTeam={handleOpenTeam} />
        <ProjectsSection
          projects={projects}
          onOpenTeam={handleOpenTeam}
          initialProfile={showroom.profile}
          askedProjectSlugs={showroom.askedProjectSlugs}
          pickedProjectSlugs={showroom.pickedProjectSlugs}
        />
      </main>

      <LandingFooter />

      <TeamModal
        project={modalProject}
        totalProjects={projects.length}
        onClose={() => setModalProject(null)}
      />
    </>
  );
}
