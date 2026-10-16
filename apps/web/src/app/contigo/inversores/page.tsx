'use client';

import React from 'react';
import { PortfolioView } from '@/components/crm/PortfolioView';

export default function InversoresPage() {
  return (
    <PortfolioView
      segment="inversor"
      title="Cartera de Inversores"
      subtitle="Seguimiento de perfiles con foco en renta, pozo y ticket financiero."
      markSymbol="▲"
      markColor="#2b7a97"
    />
  );
}
