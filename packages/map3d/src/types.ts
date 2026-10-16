export interface MapVolume {
  offset: [number, number];
  size: [number, number];
  floors: number;
  solid?: 'slab' | 'glass';
  base?: number;
  height?: number;
}

export interface MapItem {
  id: string;
  name: string;
  status: string;
  category?: string;
  description?: string;
  imageUrl?: string;
  imageAlt?: string;
  address: string;
  coords: [number, number]; // [lng, lat]
  kind: 'building' | 'area';
  phase: 'reality' | 'future';
  isFuture?: boolean;
  floors?: number;
  size?: number;
  rotation?: number;
  radius?: number;
  lotSize?: [number, number];
  volumes?: MapVolume[];
  boulevard?: { offset: [number, number]; size: [number, number] };
}

export interface TimelineState {
  timeValue: number;
  isFuture: boolean;
  isBuilding: boolean;
  text: string;
}

export interface EngineEvents {
  ready?: () => void;
  select?: (id: string | null) => void;
  hover?: (id: string | null) => void;
  timeline?: (state: TimelineState) => void;
  tour?: (touring: boolean) => void;
}

export interface CityMapEngineOptions {
  container: HTMLElement;
  items: MapItem[];
  events?: EngineEvents;
  reducedMotion?: boolean;
  styleUrl?: string;
}
