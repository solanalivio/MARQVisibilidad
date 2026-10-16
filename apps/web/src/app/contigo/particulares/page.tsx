'use client';

import React from 'react';
import { PortfolioView } from '@/components/crm/PortfolioView';

export default function ParticularesPage() {
  return (
    <PortfolioView
      segment="particular"
      title="Cartera de Particulares"
      subtitle="Familias y compradores de vivienda propia buscando su próximo hogar."
      markSymbol="●"
      markColor="#c47d2b"
    />
  );
}
