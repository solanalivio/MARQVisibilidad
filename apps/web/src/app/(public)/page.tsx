'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { PublicProject, INITIAL_PUBLIC_PROJECTS } from '@marq/shared';

import LandingHeader from '@/components/landing/LandingHeader';
import Hero from '@/components/landing/Hero';
import Marquee from '@/components/landing/Marquee';
import ProjectsSection from '@/components/landing/ProjectsSection';
import ServicesSection from '@/components/landing/ServicesSection';
import LandingFooter from '@/components/landing/LandingFooter';
import TeamModal from '@/components/landing/TeamModal';

// MapLibre GL 3D se carga únicamente en el cliente (WebGL)
const CityMap = dynamic(() => import('@/components/map/CityMap'), {
  ssr: false,
  loading: () => <div style={{ minHeight: '520px', background: '#efe9df' }}></div>,
});

export default function PublicLandingPage() {
  const [modalProject, setModalProject] = useState<PublicProject | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [loaderDone, setLoaderDone] = useState(false);

  const { data: projects = INITIAL_PUBLIC_PROJECTS } = useQuery<PublicProject[]>({
    queryKey: ['public-projects'],
    queryFn: () => api.get<PublicProject[]>('/public/projects'),
    initialData: INITIAL_PUBLIC_PROJECTS,
  });

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timer = setTimeout(() => setLoaderDone(true), prefersReduced ? 0 : 1150);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      if (total > 0) {
        setScrollProgress(window.scrollY / total);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const targets = document.querySelectorAll('[data-reveal],[data-split]');
    if (!('IntersectionObserver' in window)) {
      targets.forEach((el) => el.classList.add('is-visible'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 },
    );
    targets.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [projects]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || !data.marqDemo) return;
      switch (data.action) {
        case 'scrollTo':
          document.querySelector(data.selector)?.scrollIntoView({ behavior: 'smooth', block: data.block || 'start' });
          break;
        case 'setProfile':
          if (data.profile) {
            document.querySelector<HTMLElement>(`.profile-card[data-profile="${data.profile}"]`)?.click();
          }
          break;
        case 'setFilter':
          document.querySelector<HTMLElement>(`.filter[data-filter="${data.category || 'Todos'}"]`)?.click();
          break;
        case 'openTeam': {
          const found = projects.find((p) => p.slug === data.projectId);
          if (found) setModalProject(found);
          break;
        }
        case 'closeTeam':
          setModalProject(null);
          break;
        case 'mapTour':
          document.getElementById('mapa')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          setTimeout(() => {
            const btn = document.getElementById('map-tour');
            if (btn && !btn.textContent?.includes('Detener')) btn.click();
          }, 550);
          break;
        case 'mapStopTour': {
          const btn = document.getElementById('map-tour');
          if (btn && btn.textContent?.includes('Detener')) btn.click();
          break;
        }
        case 'mapSelect':
          document.getElementById('mapa')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          setTimeout(() => {
            document.querySelector<HTMLElement>(`#map-list [data-map-id="${data.id}"]`)?.click();
          }, 450);
          break;
        case 'mapOverview':
          document.getElementById('map-overview')?.click();
          break;
        case 'mapTimeline':
          document
            .querySelector<HTMLElement>(`[data-jump="${data.phase === 'reality' ? 'reality' : 'future'}"]`)
            ?.click();
          break;
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [projects]);

  return (
    <>
      <div className={`intro-loader ${loaderDone ? 'is-done' : ''}`.trim()} id="intro-loader" aria-hidden="true">
        <div className="loader-inner">
          <img
            src="https://estudiomarq.com.ar/wp-content/uploads/2024/12/estudiomarq.svg"
            alt=""
            className="loader-logo"
          />
          <span className="loader-rule">
            <i></i>
          </span>
          <span className="loader-sub">Resistencia · Desde 2008</span>
        </div>
      </div>

      <div className="scroll-progress" aria-hidden="true">
        <span style={{ transform: `scaleX(${scrollProgress})` }}></span>
      </div>

      <LandingHeader />

      <main id="inicio">
        <Hero />
        <Marquee />
        <CityMap projects={projects} onOpenTeam={(p) => setModalProject(p)} />
        <ProjectsSection projects={projects} onOpenTeam={(p) => setModalProject(p)} />
        <ServicesSection />
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
