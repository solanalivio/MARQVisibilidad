'use client';

import React, { useEffect, useRef, useState } from 'react';

const HERO_SLIDES = [
  { src: 'https://estudiomarq.com.ar/wp-content/uploads/2024/07/contacto-04-1.webp', caption: 'Torre Natalini', meta: '2024 · 26 pisos' },
  { src: 'https://estudiomarq.com.ar/wp-content/uploads/2024/08/torre-panorama-proyecto.webp', caption: 'Torre Panorama', meta: 'En preventa · 25.000 m²' },
  { src: 'https://estudiomarq.com.ar/wp-content/uploads/2024/07/uno-proyecto.webp', caption: 'Uno Boulevard', meta: '2017 · Av. Sarmiento' },
  { src: 'https://estudiomarq.com.ar/wp-content/uploads/2024/07/gaba-proyecto.webp', caption: 'Edificio GABA', meta: 'Live & work · el estudio' },
  { src: 'https://estudiomarq.com.ar/wp-content/uploads/2024/08/torre-nbch-proyecto.webp', caption: 'Torre NBCH', meta: 'En obra · Pellegrini 761' },
  { src: 'https://estudiomarq.com.ar/wp-content/uploads/2024/07/brisas-del-norte-proyecto.webp', caption: 'Brisas del Norte', meta: 'Loteo con laguna y muelle' },
];

const ROTATOR_WORDS = ['Arquitectura', 'Desarrollo inmobiliario', 'Urbanismo', 'Interiorismo', 'Administración'];

const splitChars = (word: string, startOffset: number) => {
  const chars = [...word];
  return {
    nextOffset: startOffset + chars.length,
    node: (
      <span className="word">
        {chars.map((ch, idx) => (
          <span key={idx} className="char" style={{ ['--c' as any]: startOffset + idx }}>
            {ch}
          </span>
        ))}
      </span>
    ),
  };
};

export default function Hero() {
  const heroRef = useRef<HTMLElement>(null);
  const [slideIndex, setSlideIndex] = useState(0);
  const [wordIndex, setWordIndex] = useState(0);
  const [leavingWordIndex, setLeavingWordIndex] = useState<number | null>(null);
  const [isChanging, setIsChanging] = useState(false);

  const changeSlide = (nextIdx: number) => {
    setIsChanging(true);
    setTimeout(() => {
      setSlideIndex((nextIdx + HERO_SLIDES.length) % HERO_SLIDES.length);
      setIsChanging(false);
    }, 180);
  };

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const slideTimer = setInterval(() => {
      setIsChanging(true);
      setTimeout(() => {
        setSlideIndex((prev) => (prev + 1) % HERO_SLIDES.length);
        setIsChanging(false);
      }, 180);
    }, 6000);

    return () => clearInterval(slideTimer);
  }, [slideIndex]);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const wordTimer = setInterval(() => {
      setWordIndex((prev) => {
        setLeavingWordIndex(prev);
        setTimeout(() => setLeavingWordIndex(null), 520);
        return (prev + 1) % ROTATOR_WORDS.length;
      });
    }, 2200);

    return () => clearInterval(wordTimer);
  }, []);

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const onPointerMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      el.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`);
      el.style.setProperty('--my', `${(y * 100).toFixed(1)}%`);
      el.style.setProperty('--px', `${((x - 0.5) * 18).toFixed(1)}px`);
      el.style.setProperty('--py', `${((y - 0.5) * 14).toFixed(1)}px`);
    };

    el.addEventListener('pointermove', onPointerMove, { passive: true });
    return () => el.removeEventListener('pointermove', onPointerMove);
  }, []);

  const currentSlide = HERO_SLIDES[slideIndex];

  // Construir caracteres animados para "La ciudad / que viene / comienza acá."
  const w1 = splitChars('La', 0);
  const w2 = splitChars('ciudad', w1.nextOffset);
  const w3 = splitChars('que', w2.nextOffset);
  const w4 = splitChars('viene', w3.nextOffset);
  const w5 = splitChars('comienza', w4.nextOffset);
  const w6 = splitChars('acá.', w5.nextOffset);

  return (
    <section
      className="hero"
      id="hero"
      ref={heroRef}
      aria-label="Estudio MARQ"
      style={{ ['--slide' as any]: '6000ms' }}
    >
      <div className="hero-media" aria-hidden="true">
        {HERO_SLIDES.map((slide, idx) => (
          <img
            key={slide.caption}
            className={idx === slideIndex ? 'is-active' : ''}
            src={slide.src}
            alt={slide.caption}
          />
        ))}
      </div>
      <div className="hero-shade" aria-hidden="true"></div>
      <div className="hero-spotlight" aria-hidden="true"></div>
      <div className="hero-grain" aria-hidden="true"></div>
      <span className="hero-watermark" aria-hidden="true">
        MARQ
      </span>

      <div className="hero-inner page-width">
        <p className="hero-kicker is-visible" data-reveal>
          <span className="hero-live" aria-hidden="true"></span>
          Estudio MARQ ·{' '}
          <span className="hero-rotator" aria-live="polite">
            {ROTATOR_WORDS.map((w, idx) => (
              <span
                key={w}
                className={`${idx === wordIndex ? 'is-active' : ''} ${idx === leavingWordIndex ? 'is-leaving' : ''}`.trim()}
              >
                {w}
              </span>
            ))}
          </span>
        </p>

        <h1 className="hero-title is-visible" data-split>
          <span className="line">
            <span>
              {w1.node} {w2.node}
            </span>
          </span>
          <span className="line">
            <span>
              {w3.node} {w4.node}
            </span>
          </span>
          <span className="line">
            <span>
              {w5.node} <em>{w6.node}</em>
            </span>
          </span>
        </h1>

        <div className="hero-bottom">
          <div className="hero-lead-wrap is-visible" data-reveal style={{ ['--d' as any]: '0.9s' }}>
            <p className="hero-lead">
              Hace 18 años diseñamos, desarrollamos y administramos los edificios y barrios que cambiaron el perfil de Resistencia.
            </p>
            <div className="hero-actions">
              <a className="btn-primary btn-light" href="#proyectos">
                Explorar proyectos <span>↓</span>
              </a>
              <a className="btn-text btn-text-light" href="#mapa">
                Ver las obras en el mapa <span>↗</span>
              </a>
            </div>
          </div>

          <div className="hero-index is-visible" data-reveal style={{ ['--d' as any]: '1.05s' }}>
            <div className={`hero-now ${isChanging ? 'is-changing' : ''}`.trim()}>
              <span className="hero-count" id="hero-count">
                {String(slideIndex + 1).padStart(2, '0')} / {String(HERO_SLIDES.length).padStart(2, '0')}
              </span>
              <strong id="hero-caption">{currentSlide.caption}</strong>
              <span id="hero-meta">{currentSlide.meta}</span>
            </div>
            <div className="hero-bars" id="hero-bars" role="group" aria-label="Elegir obra">
              {HERO_SLIDES.map((slide, idx) => (
                <button
                  key={slide.caption}
                  type="button"
                  aria-label={`Ver ${slide.caption}`}
                  className={`${idx === slideIndex ? 'is-active' : ''} ${idx < slideIndex ? 'is-done' : ''}`.trim()}
                  onClick={() => changeSlide(idx)}
                >
                  <i></i>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <a className="scroll-cue" href="#mapa" aria-label="Seguir bajando">
        <span>Scroll</span>
        <i></i>
      </a>
    </section>
  );
}
