'use client';

import React from 'react';
import { api } from '@/lib/api';

export default function ServicesSection() {
  const handleConsultClick = () => {
    api.post('/public/events', { type: 'visit_click' }).catch(() => {});
  };

  return (
    <section className="services page-width" id="servicios">
      <div className="eyebrow is-visible" data-reveal>
        <span className="eyebrow-line"></span> SERVICIOS
      </div>
      <h2 className="section-title is-visible" data-reveal data-split>
        Todo el recorrido, <em>de la idea a la llave.</em>
      </h2>
      <div className="services-grid">
        <article className="service is-visible" data-reveal>
          <span>01</span>
          <h3>Desarrollo inmobiliario</h3>
          <p>
            Analizamos el terreno, la normativa y la demanda, y armamos fideicomisos al costo a la medida de cada edificio.
          </p>
        </article>
        <article className="service is-visible" data-reveal style={{ ['--d' as any]: '0.06s' }}>
          <span>02</span>
          <h3>Arquitectura</h3>
          <p>
            Edificios, casas, locales, consultorios, gimnasios y estaciones de servicio, con documentación ejecutiva para
            licitar la obra.
          </p>
        </article>
        <article className="service is-visible" data-reveal style={{ ['--d' as any]: '0.12s' }}>
          <span>03</span>
          <h3>Interiorismo</h3>
          <p>Iluminación, mobiliario y materialidad para que cada espacio se viva como fue pensado.</p>
        </article>
        <article className="service is-visible" data-reveal style={{ ['--d' as any]: '0.18s' }}>
          <span>04</span>
          <h3>Urbanismo y loteos</h3>
          <p>Barrios que conservan el bosque nativo y el agua: Pueblo Mío, Gran Arboledas, Brisas del Norte.</p>
        </article>
        <article className="service is-visible" data-reveal style={{ ['--d' as any]: '0.24s' }}>
          <span>05</span>
          <h3>Gestión y administración</h3>
          <p>
            Permisos municipales, administración fiduciaria y gestión de consorcios una vez que el edificio toma vida.
          </p>
        </article>
        <article className="service service-highlight is-visible" data-reveal style={{ ['--d' as any]: '0.3s' }}>
          <span>Nuevo</span>
          <h3>Estudio de prefactibilidad</h3>
          <p>¿Tenés un terreno? Analizamos qué se puede construir, qué demanda hay y si los números cierran.</p>
          <a
            className="btn-text"
            href="https://wa.me/5493624119351?text=Hola%2C%20tengo%20un%20terreno%20y%20quiero%20consultar%20por%20un%20estudio%20de%20prefactibilidad."
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleConsultClick}
          >
            Consultar <span>↗</span>
          </a>
        </article>
      </div>
    </section>
  );
}
