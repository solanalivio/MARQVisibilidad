import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from '@/components/providers';

export const metadata: Metadata = {
  title: 'Estudio MARQ — Creamos valor',
  description:
    'Estudio MARQ: arquitectura y desarrollo inmobiliario en Resistencia, Chaco. Conocé los proyectos y a las personas que los hacen posibles.',
  icons: {
    icon: 'https://estudiomarq.com.ar/wp-content/uploads/2024/12/estudiomarq.svg',
  },
};

export const viewport: Viewport = {
  themeColor: '#f4f0ea',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Manrope:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
