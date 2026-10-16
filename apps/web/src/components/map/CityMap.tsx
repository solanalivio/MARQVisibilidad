'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { CityMapEngine, MapItem, TimelineState } from '@marq/map3d';
import { PublicProject, PROJECT_CATEGORY_LABELS } from '@marq/shared';

interface CityMapProps {
  projects: PublicProject[];
  onOpenTeam: (project: PublicProject) => void;
}

const normalizeImg = (url?: string | null) => {
  if (!url) return '';
  return url.startsWith('img/') ? `/${url}` : url;
};

export default function CityMap({ projects, onOpenTeam }: CityMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLElement>(null);
  const engineRef = useRef<CityMapEngine | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [timeline, setTimeline] = useState<TimelineState>({
    timeValue: 100,
    isFuture: true,
    isBuilding: false,
    text: 'Torre Panorama, MARQ Collection y Distrito Horizonte: el próximo capítulo de la ciudad.',
  });
  const [touring, setTouring] = useState(false);

  // Convertir proyectos en MapItems ordenados por sequence (0..8 edificios, 9..13 loteos)
  const mapItems = useMemo<MapItem[]>(() => {
    return [...projects]
      .filter((p) => p.map !== null)
      .sort((a, b) => (a.map?.sequence ?? 99) - (b.map?.sequence ?? 99))
      .map((p) => {
        const m = p.map!;
        return {
          id: p.slug,
          name: p.name,
          status: p.statusLabel,
          category: p.category,
          description: p.description,
          imageUrl: normalizeImg(p.imageUrl),
          imageAlt: p.imageAlt,
          address: m.address,
          coords: [m.lng, m.lat],
          kind: m.kind,
          phase: m.phase,
          isFuture: m.isFuture,
          floors: m.floors || undefined,
          size: m.size || undefined,
          rotation: m.rotation || undefined,
          radius: m.radius || undefined,
          lotSize: m.lotSize || undefined,
          volumes: m.volumes || undefined,
          boulevard: m.boulevard || undefined,
        };
      });
  }, [projects]);

  useEffect(() => {
    if (!containerRef.current || mapItems.length === 0) return;

    if (engineRef.current) {
      engineRef.current.updateItems(mapItems);
      return;
    }

    const engine = new CityMapEngine({
      container: containerRef.current,
      items: mapItems,
      styleUrl: process.env.NEXT_PUBLIC_MAP_STYLE || 'https://tiles.openfreemap.org/styles/positron',
      events: {
        select: (id) => setSelectedId(id),
        timeline: (state) => setTimeline(state),
        tour: (isTouring) => setTouring(isTouring),
      },
    });
    engineRef.current = engine;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          engine.startIntro();
          observer.disconnect();
        }
      },
      { threshold: 0.25 },
    );

    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
    };
  }, [mapItems]);

  useEffect(() => {
    return () => {
      engineRef.current?.destroy();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!selectedId || !listRef.current) return;
    const activeBtn = listRef.current.querySelector<HTMLButtonElement>(`[data-map-id="${selectedId}"]`);
    activeBtn?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
  }, [selectedId]);

  const selectedProject = useMemo(() => {
    return projects.find((p) => p.slug === selectedId) || null;
  }, [projects, selectedId]);

  const selectedMapItem = useMemo(() => {
    return mapItems.find((m) => m.id === selectedId) || null;
  }, [mapItems, selectedId]);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    engineRef.current?.stopTour();
    engineRef.current?.select(id);
  };

  const handleCloseCard = () => {
    setSelectedId(null);
    engineRef.current?.clearSelection();
  };

  const handleTimelineScrub = (val: number) => {
    engineRef.current?.stopTour();
    engineRef.current?.stopTimeline();
    engineRef.current?.settleCamera();
    engineRef.current?.scrub(val);
  };

  const handleJump = (target: 'reality' | 'future') => {
    engineRef.current?.stopTour();
    engineRef.current?.settleCamera();
    const targetVal = target === 'future' ? 100 : 64;
    engineRef.current?.animateTimeline(targetVal, 7000);
  };

  return (
    <section className="city" id="mapa" aria-label="Mapa de las obras de MARQ en Resistencia">
      <div className="city-head page-width">
        <div className="eyebrow is-visible" data-reveal>
          <span className="eyebrow-line"></span> RESISTENCIA, OBRA POR OBRA
        </div>
        <h2 className="section-title is-visible" data-reveal data-split>
          La ciudad que <em>fuimos construyendo.</em>
        </h2>
        <p className="section-lead is-visible" data-reveal style={{ ['--d' as any]: '0.1s' }}>
          Seguro pasaste por alguno de estos edificios. Recorré el mapa, tocá cada obra en dorado y conocé su historia.
        </p>
      </div>

      <div className="city-stage page-width">
        <div className="city-map" id="city-map" ref={containerRef}></div>

        {/* Lista lateral de obras */}
        <aside className="map-list" id="map-list" ref={listRef} aria-label="Obras en el mapa">
          {mapItems.map((item) => (
            <button
              key={item.id}
              type="button"
              data-map-id={item.id}
              className={selectedId === item.id ? 'is-active' : ''}
              onClick={() => handleSelect(item.id)}
              onMouseEnter={() => engineRef.current?.setHovered(item.id)}
              onMouseLeave={() => engineRef.current?.setHovered(null)}
            >
              <img src={item.imageUrl || ''} alt="" loading="lazy" />
              <span>
                <b>{item.name}</b>
                <small>{item.status}</small>
              </span>
            </button>
          ))}
        </aside>

        {/* Ficha flotante de la obra seleccionada */}
        {selectedProject && selectedMapItem && (
          <article className="map-card is-in" id="map-card" aria-live="polite">
            <button className="map-card-close" type="button" onClick={handleCloseCard} aria-label="Cerrar">
              ×
            </button>
            {selectedMapItem.isFuture && <span className="map-card-soon">Próximamente</span>}
            <img src={normalizeImg(selectedProject.imageUrl)} alt={selectedProject.imageAlt} />
            <div className="map-card-body">
              <span className="map-card-status">
                {PROJECT_CATEGORY_LABELS[selectedProject.category] || selectedProject.category} ·{' '}
                {selectedProject.statusLabel}
              </span>
              <h3>{selectedProject.name}</h3>
              <p className="map-card-address">{selectedMapItem.address}</p>
              <p>{selectedProject.description}</p>
              <div className="map-card-actions">
                <button className="btn-primary" type="button" onClick={() => onOpenTeam(selectedProject)}>
                  Quiénes están detrás <span>↗</span>
                </button>
              </div>
            </div>
          </article>
        )}

        {/* Línea de tiempo */}
        <div className="map-timeline">
          <p className="map-caption" id="map-caption" aria-live="polite">
            <b>{timeline.isFuture ? 'Lo que viene' : 'Lo que es realidad'}</b> {timeline.text}
          </p>
          <input
            type="range"
            id="map-timeline"
            min="0"
            max="100"
            step="0.1"
            value={timeline.timeValue}
            style={{ ['--fill' as any]: `${timeline.timeValue}%` }}
            onChange={(e) => handleTimelineScrub(parseFloat(e.target.value))}
            aria-label="Línea de tiempo de las obras"
          />
          <div className="map-ticks" style={{ gridTemplateColumns: '64fr 36fr' }}>
            <button
              type="button"
              data-jump="reality"
              className={timeline.timeValue <= 64 ? 'is-active' : ''}
              onClick={() => handleJump('reality')}
            >
              Lo que es realidad
            </button>
            <button
              type="button"
              data-jump="future"
              className={timeline.timeValue > 64 ? 'is-active' : ''}
              onClick={() => handleJump('future')}
            >
              Lo que viene
            </button>
          </div>
        </div>

        {/* Herramientas de navegación */}
        <div className="map-tools">
          <button
            type="button"
            id="map-tour"
            className="map-tour"
            onClick={() => {
              if (touring) {
                engineRef.current?.stopTour(true);
              } else {
                engineRef.current?.startTour();
              }
            }}
          >
            {touring ? '■ Detener recorrido' : '▶ Recorrer las obras'}
          </button>
          <button
            type="button"
            id="map-overview"
            onClick={() => {
              engineRef.current?.stopTour();
              engineRef.current?.stopDrift();
              engineRef.current?.clearSelection();
              engineRef.current?.goToOverview();
            }}
          >
            Ver toda la región
          </button>
          <button
            type="button"
            id="map-zoom-in"
            aria-label="Acercar"
            onClick={() => engineRef.current?.zoomIn()}
          >
            +
          </button>
          <button
            type="button"
            id="map-zoom-out"
            aria-label="Alejar"
            onClick={() => engineRef.current?.zoomOut()}
          >
            −
          </button>
          <button
            type="button"
            id="map-rotate-left"
            aria-label="Girar el mapa a la izquierda"
            title="Girar (también: Ctrl + arrastrar)"
            onClick={() => engineRef.current?.rotate(45)}
          >
            ↺
          </button>
          <button
            type="button"
            id="map-rotate-right"
            aria-label="Girar el mapa a la derecha"
            title="Girar (también: Ctrl + arrastrar)"
            onClick={() => engineRef.current?.rotate(-45)}
          >
            ↻
          </button>
        </div>

        <p className="map-note">
          Para girar el mapa usá ↺ ↻ o Ctrl + arrastrar. Alturas aproximadas. Lo que viene se ve en un dorado más claro;
          los loteos, en su zona aproximada.
        </p>
      </div>
    </section>
  );
}
