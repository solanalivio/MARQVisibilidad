import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  transpilePackages: ['@marq/shared', '@marq/map3d'],
  outputFileTracingRoot: path.join(__dirname, '../../'),
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'estudiomarq.com.ar',
      },
      {
        protocol: 'https',
        hostname: 'www.libertaddigital.com.ar',
      },
    ],
  },
};

export default nextConfig;
