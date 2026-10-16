import React from 'react';

const ITEMS = [
  'Torre Natalini',
  'MARQ Collection',
  'Uno Boulevard',
  'Torre Vista',
  'Torre Panorama',
  'Pueblo Mío',
  'Gran Arboledas',
  'Brisas del Norte',
  'Torre NBCH',
  'Edificio GABA',
  'Distrito Horizonte',
];

export default function Marquee() {
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee-track">
        {ITEMS.map((item, idx) => (
          <React.Fragment key={`m1-${idx}`}>
            <span>{item}</span>
            <i>✦</i>
          </React.Fragment>
        ))}
        {ITEMS.map((item, idx) => (
          <React.Fragment key={`m2-${idx}`}>
            <span>{item}</span>
            <i>✦</i>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
