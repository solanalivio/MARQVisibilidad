'use client';

import React from 'react';
import { api } from '@/lib/api';

export default function LandingFooter() {
  const handleTalkClick = () => {
    api.post('/public/events', { type: 'visit_click' }).catch(() => {});
  };

  return (
    <>
      <footer id="contacto">
        <div className="footer-cta page-width">
          <span className="eyebrow">
            <span className="eyebrow-line"></span> CONTACTO
          </span>
          <h2 className="is-visible" data-reveal data-split>
            ¿Tenés un proyecto <em>en mente?</em>
          </h2>
          <a
            className="footer-big"
            href="https://wa.me/5493624119351?text=Hola%2C%20quiero%20hacer%20una%20consulta%20al%20estudio."
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleTalkClick}
          >
            Hablemos <span>↗</span>
          </a>
        </div>
        <div className="footer-grid page-width">
          <div>
            <img
              className="footer-logo"
              src="https://estudiomarq.com.ar/wp-content/uploads/2024/12/estudiomarq.svg"
              alt="MARQ"
            />
            <p>Arquitectura y desarrollo inmobiliario.</p>
          </div>
          <div>
            <h4>Estudio</h4>
            <p>
              Remedios de Escalada 259
              <br />
              Resistencia, Chaco · Argentina
            </p>
          </div>
          <div>
            <h4>Contacto</h4>
            <p>
              <a href="tel:+5493624119351">+54 9 362 411 9351</a>
              <br />
              <a href="mailto:info@estudiomarq.com.ar">info@estudiomarq.com.ar</a>
            </p>
          </div>
          <div>
            <h4>Redes</h4>
            <p>
              <a href="https://www.instagram.com/estudio.marq/" target="_blank" rel="noopener noreferrer">
                Instagram
              </a>
              <br />
              <a href="https://www.facebook.com/marq.estudio/" target="_blank" rel="noopener noreferrer">
                Facebook
              </a>
              <br />
              <a href="https://www.youtube.com/channel/UChqgLdfHLP1wzIMaYeQ3Y9A" target="_blank" rel="noopener noreferrer">
                YouTube
              </a>
            </p>
          </div>
        </div>
        <div className="footer-meta page-width">
          <span>© Estudio MARQ 2026</span>
          <span>Prototipo UTN · información pública de estudiomarq.com.ar</span>
        </div>
      </footer>

      {/* Botón flotante de WhatsApp */}
      <a
        className="whatsapp"
        href="https://wa.me/5493624119351?text=Hola%2C%20quiero%20consultar%20por%20un%20proyecto%20de%20MARQ."
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Contactar por WhatsApp"
        onClick={handleTalkClick}
      >
        <svg
          viewBox="0 0 24 24"
          width="26"
          height="26"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M20 11.5a8 8 0 0 1-11.8 7L4 20l1.5-4.1A8 8 0 1 1 20 11.5Z" />
          <path d="M9 9.5c0 3 2.5 5.5 5.5 5.5" />
        </svg>
      </a>
    </>
  );
}
