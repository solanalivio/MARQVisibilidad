'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export default function LandingHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [onDark, setOnDark] = useState(true);
  const [activeHash, setActiveHash] = useState<string>('');

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsScrolled(scrollY > 30);
      const hero = document.getElementById('hero');
      if (hero) {
        setOnDark(scrollY < hero.offsetHeight - 90);
      } else {
        setOnDark(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const ids = ['mapa', 'proyectos', 'servicios', 'contacto'];
    const sections = ids.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    if (sections.length === 0) return;

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveHash(`#${entry.target.id}`);
          }
        });
      },
      { rootMargin: '-45% 0px -45% 0px' },
    );

    sections.forEach((s) => obs.observe(s));
    return () => obs.disconnect();
  }, []);

  return (
    <header className={`site-header ${isScrolled ? 'is-scrolled' : ''} ${onDark ? 'on-dark' : ''}`.trim()}>
      <a className="wordmark" href="#inicio" aria-label="Estudio MARQ, inicio">
        <img
          src="https://estudiomarq.com.ar/wp-content/uploads/2024/12/estudiomarq.svg"
          alt="MARQ, creamos valor"
        />
      </a>
      <nav className={`main-nav ${mobileOpen ? 'mobile-open' : ''}`.trim()} aria-label="Navegación principal">
        <a
          href="#mapa"
          className={activeHash === '#mapa' ? 'active' : ''}
          onClick={() => setMobileOpen(false)}
        >
          Mapa
        </a>
        <a
          href="#proyectos"
          className={activeHash === '#proyectos' ? 'active' : ''}
          onClick={() => setMobileOpen(false)}
        >
          Proyectos
        </a>
        <a
          href="#servicios"
          className={activeHash === '#servicios' ? 'active' : ''}
          onClick={() => setMobileOpen(false)}
        >
          Servicios
        </a>
        <a
          href="#contacto"
          className={activeHash === '#contacto' ? 'active' : ''}
          onClick={() => setMobileOpen(false)}
        >
          Contacto
        </a>
      </nav>
      <div className="header-actions">
        <a className="header-contact" href="#proyectos">
          <span aria-hidden="true">▦</span> Ver propiedades
        </a>
        <Link className="mode-toggle" id="mode-toggle" href="/contigo">
          MARQ Contigo ↗
        </Link>
      </div>
      <button
        type="button"
        className="menu-toggle"
        aria-label={mobileOpen ? 'Cerrar navegación' : 'Abrir navegación'}
        aria-expanded={mobileOpen}
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        <span></span>
        <span></span>
      </button>
    </header>
  );
}
