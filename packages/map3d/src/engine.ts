import maplibregl from 'maplibre-gl';
import type { CityMapEngineOptions, EngineEvents, MapItem, MapVolume } from './types';

export class CityMapEngine {
  private map: maplibregl.Map | null = null;
  private container: HTMLElement;
  private items: MapItem[];
  private events: EngineEvents;
  private reducedMotion: boolean;
  private styleUrl: string;

  private isLoaded = false;
  private pendingIntro = false;
  private pendingSelectId: { id: string; fly: boolean } | null = null;
  private selectedId: string | null = null;
  private hoveredId: string | null = null;
  private touring = false;
  private tourTimer: ReturnType<typeof setTimeout> | null = null;
  private timeValue = 0;
  private animFrame: number | null = null;
  private driftFrame: number | null = null;
  private completed = new Set<string>();
  private ripples: Array<{ coords: [number, number]; start: number }> = [];
  private pins: Record<string, maplibregl.Marker> = {};
  private lastShape = '';
  private shownAreas = new Set<string>();
  private progress: Record<string, number> = {};

  private readonly REALITY_END = 64;
  private readonly REALITY = { start: 0, len: 60 };
  private readonly FUTURE = { start: 66, len: 34 };
  private readonly FOOTPRINT_SCALE = 3;
  private readonly HEIGHT_SCALE = 2.4;
  private readonly FLOOR_HEIGHT = 3.2 * 2.4;
  private readonly SLAB = 0.45 * 2.4;
  private readonly OVERVIEW = {
    center: [-58.98181, -27.44268] as [number, number],
    zoom: 14.3,
    pitch: 55,
    bearing: 0,
  };
  private readonly DRIFT = { bearing: 20, bearingPeriod: 14, pitch: 7, pitchPeriod: 11, zoomPerDegree: 0.02 };

  constructor(options: CityMapEngineOptions) {
    this.container = options.container;
    this.items = options.items;
    this.events = options.events || {};
    this.reducedMotion =
      options.reducedMotion ??
      (typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false);
    this.styleUrl = options.styleUrl || 'https://tiles.openfreemap.org/styles/positron';

    this.items
      .filter((i) => i.kind === 'building')
      .forEach((p) => {
        this.progress[p.id] = 0;
      });

    this.init();
  }

  private init() {
    this.map = new maplibregl.Map({
      container: this.container,
      style: this.styleUrl,
      ...this.OVERVIEW,
      maxPitch: 75,
      attributionControl: { compact: true },
    });

    this.map.scrollZoom.disable();

    if (this.container.clientWidth > 900) {
      this.map.setPadding({ left: 270, bottom: 110, top: 60, right: 0 });
    }

    this.map.on('load', () => {
      if (!this.map) return;
      this.isLoaded = true;
      this.applyMaquetteStyle();
      this.setupLayers();
      this.createPins();

      // Forzar actualización inicial de las capas GeoJSON
      this.lastShape = '';
      this.scrub(this.timeValue);

      this.events.ready?.();

      if (this.pendingSelectId) {
        const { id, fly } = this.pendingSelectId;
        this.pendingSelectId = null;
        this.select(id, fly);
      } else if (this.pendingIntro) {
        this.pendingIntro = false;
        this.runIntro();
      }

      this.map.on('click', (e) => {
        if (!this.map) return;
        const features = this.map.queryRenderedFeatures(e.point, {
          layers: ['marq-built', 'marq-future', 'marq-areas-fill'],
        });
        if (!features.length) {
          this.clearSelection();
        }
      });

      const onInteraction = () => {
        this.stopTour();
        this.stopDrift();
      };
      this.map.on('mousedown', onInteraction);
      this.map.on('touchstart', onInteraction);
    });
  }

  public startIntro() {
    if (!this.isLoaded) {
      this.pendingIntro = true;
      return;
    }
    this.runIntro();
  }

  private runIntro() {
    if (this.reducedMotion) {
      this.scrub(100);
      return;
    }
    this.animateTimeline(100, 17000, () => this.settleCamera());
    this.startDrift();
  }

  public updateItems(newItems: MapItem[]) {
    this.items = newItems;
    this.items
      .filter((i) => i.kind === 'building')
      .forEach((p) => {
        if (this.progress[p.id] === undefined) {
          this.progress[p.id] = this.timeValue >= 100 ? 1 : 0;
        }
      });

    if (this.isLoaded) {
      this.lastShape = '';
      this.scrub(this.timeValue);
    }
  }

  public setHovered(id: string | null) {
    if (this.hoveredId === id) return;
    this.hoveredId = id;
    if (this.isLoaded) {
      this.paintHighlights();
    }
    this.events.hover?.(id);
  }

  private rect(
    [lng, lat]: [number, number],
    [width, height]: [number, number],
    [dx, dy]: [number, number] = [0, 0],
    rotation = 0,
  ): [number, number][][] {
    const mLat = 111320;
    const mLng = 111320 * Math.cos((lat * Math.PI) / 180);
    const angle = (rotation * Math.PI) / 180;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const corners: [number, number][] = [
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1],
      [-1, -1],
    ].map(([sx, sy]) => {
      const u = dx + (sx * width) / 2;
      const v = dy + (sy * height) / 2;
      return [lng + (u * cos - v * sin) / mLng, lat + (u * sin + v * cos) / mLat];
    });
    return [corners];
  }

  private circle([lng, lat]: [number, number], radius: number): [number, number][][] {
    const points: [number, number][] = [];
    for (let i = 0; i <= 48; i++) {
      const angle = (i / 48) * Math.PI * 2;
      points.push([
        lng + (radius * Math.cos(angle)) / (111320 * Math.cos((lat * Math.PI) / 180)),
        lat + (radius * Math.sin(angle)) / 111320,
      ]);
    }
    return [points];
  }

  private volumesOf(place: MapItem): MapVolume[] {
    return (
      place.volumes || [
        {
          offset: [0, 0],
          floors: place.floors || 1,
          size: [(place.size || 20) * this.FOOTPRINT_SCALE, (place.size || 20) * this.FOOTPRINT_SCALE],
        },
      ]
    );
  }

  private maxFloors(place: MapItem): number {
    return Math.max(...this.volumesOf(place).map((v) => v.floors));
  }

  private floorsBuilt(volume: MapVolume, place: MapItem): number {
    return Math.round(volume.floors * (this.progress[place.id] || 0));
  }

  private buildingsData(future: boolean): GeoJSON.FeatureCollection {
    const features: GeoJSON.Feature[] = [];
    const buildingPlaces = this.items.filter((i) => i.kind === 'building' && Boolean(i.isFuture) === future);

    buildingPlaces.forEach((place) => {
      this.volumesOf(place).forEach((volume) => {
        const glass: [number, number] = [volume.size[0] * 0.9, volume.size[1] * 0.9];
        const full = this.floorsBuilt(volume, place);
        const building = (this.progress[place.id] || 0) < 1;

        if (volume.solid) {
          if (full) {
            features.push({
              type: 'Feature',
              properties: {
                pid: place.id,
                part: volume.solid,
                base: (volume.base || 0) * this.HEIGHT_SCALE,
                top: ((volume.base || 0) + (volume.height || 1)) * this.HEIGHT_SCALE,
              },
              geometry: {
                type: 'Polygon',
                coordinates: this.rect(place.coords, volume.size, volume.offset, place.rotation || 0),
              },
            });
          }
          return;
        }

        for (let floor = 0; floor < full; floor++) {
          const base = floor * this.FLOOR_HEIGHT;
          const lit = building && floor === full - 1;
          features.push({
            type: 'Feature',
            properties: { pid: place.id, part: 'slab', base, top: base + this.SLAB },
            geometry: {
              type: 'Polygon',
              coordinates: this.rect(place.coords, volume.size, volume.offset, place.rotation || 0),
            },
          });
          features.push({
            type: 'Feature',
            properties: { pid: place.id, part: lit ? 'active' : 'glass', base: base + this.SLAB, top: base + this.FLOOR_HEIGHT },
            geometry: {
              type: 'Polygon',
              coordinates: this.rect(place.coords, glass, volume.offset, place.rotation || 0),
            },
          });
        }
      });
    });

    return { type: 'FeatureCollection', features };
  }

  private areasData(): GeoJSON.FeatureCollection {
    const features: GeoJSON.Feature[] = [];
    const areaItems = this.items.filter((i) => i.kind === 'area' && this.shownAreas.has(i.id));

    areaItems.forEach((area) => {
      features.push({
        type: 'Feature',
        properties: { pid: area.id, kind: 'lot' },
        geometry: {
          type: 'Polygon',
          coordinates: this.circle(area.coords, area.radius || 300),
        },
      });
    });

    this.items
      .filter((p) => p.lotSize && (this.progress[p.id] || 0) > 0)
      .forEach((place) => {
        if (place.lotSize) {
          features.push({
            type: 'Feature',
            properties: { pid: place.id, kind: 'macro' },
            geometry: {
              type: 'Polygon',
              coordinates: this.rect(place.coords, place.lotSize, [0, 0], place.rotation || 0),
            },
          });
        }
        if (place.boulevard) {
          features.push({
            type: 'Feature',
            properties: { pid: place.id, kind: 'boulevard' },
            geometry: {
              type: 'Polygon',
              coordinates: this.rect(place.coords, place.boulevard.size, place.boulevard.offset, place.rotation || 0),
            },
          });
        }
      });

    return { type: 'FeatureCollection', features };
  }

  private refreshData() {
    if (!this.map || !this.isLoaded) return;
    const buildingPlaces = this.items.filter((i) => i.kind === 'building');
    const shape =
      buildingPlaces
        .map(
          (p) =>
            `${this.volumesOf(p)
              .map((v) => this.floorsBuilt(v, p))
              .join('.')}${(this.progress[p.id] || 0) < 1 ? '*' : ''}`,
        )
        .join('|') +
      '#' +
      [...this.shownAreas].sort().join(',');

    if (shape !== this.lastShape) {
      this.lastShape = shape;
      (this.map.getSource('marq-built') as maplibregl.GeoJSONSource)?.setData(this.buildingsData(false));
      (this.map.getSource('marq-future') as maplibregl.GeoJSONSource)?.setData(this.buildingsData(true));
      (this.map.getSource('marq-areas') as maplibregl.GeoJSONSource)?.setData(this.areasData());
    }

    Object.entries(this.pins).forEach(([id, pin]) => {
      const el = pin.getElement();
      const item = this.items.find((i) => i.id === id);
      if (!item) return;

      if (item.kind === 'area') {
        el.classList.toggle('is-hidden', !this.shownAreas.has(id));
        return;
      }

      const total = this.maxFloors(item);
      const prog = this.progress[id] || 0;
      const building = prog > 0 && prog < 1;

      el.classList.toggle('is-hidden', !building && prog < 1);
      el.classList.toggle('is-building', building);

      const label = building ? `${item.name} · piso ${Math.round(prog * total)}/${total}` : item.name;
      const nameEl = el.querySelector('.map-pin-name');
      if (nameEl && nameEl.textContent !== label) nameEl.textContent = label;

      if (prog >= 1 && !this.completed.has(id)) {
        this.completed.add(id);
        el.classList.add('just-built');
        setTimeout(() => el.classList.remove('just-built'), 900);
      } else if (prog < 1) {
        this.completed.delete(id);
      }
    });
  }

  private addRipple(coords: [number, number]) {
    if (!this.isLoaded) return;
    const now = performance.now();
    this.ripples.push({ coords, start: now }, { coords, start: now + 280 });
    if (this.ripples.length <= 2) {
      requestAnimationFrame(this.animateRipples.bind(this));
    }
  }

  private animateRipples(now: number) {
    if (!this.map || !this.isLoaded) return;
    this.ripples = this.ripples.filter((r) => now - r.start < 1500);
    const features: GeoJSON.Feature[] = this.ripples.map((r) => {
      const t = Math.max(0, (now - r.start) / 1500);
      return {
        type: 'Feature',
        properties: {
          r: 6 + 80 * (1 - Math.pow(1 - t, 3)),
          o: t > 0 ? 0.85 * (1 - t) : 0,
        },
        geometry: { type: 'Point', coordinates: r.coords },
      };
    });

    (this.map.getSource('marq-ripple') as maplibregl.GeoJSONSource)?.setData({
      type: 'FeatureCollection',
      features,
    });

    if (this.ripples.length) {
      requestAnimationFrame(this.animateRipples.bind(this));
    }
  }

  private partColor(slab: string, glass: string): any {
    return ['match', ['get', 'part'], 'slab', slab, 'active', '#fff1cf', glass];
  }

  private highlight(normal: any, hover: any, active: any): any {
    return [
      'case',
      ['==', ['get', 'pid'], this.selectedId || ''],
      active,
      ['==', ['get', 'pid'], this.hoveredId || ''],
      hover,
      normal,
    ];
  }

  private paintHighlights() {
    if (!this.map || !this.isLoaded || !this.map.getLayer('marq-built')) return;
    this.map.setPaintProperty(
      'marq-built',
      'fill-extrusion-color',
      this.highlight(
        this.partColor('#f3e6cc', '#b88642'),
        this.partColor('#f8eedb', '#cf9d57'),
        this.partColor('#fff7e8', '#e0ad5f'),
      ),
    );
    this.map.setPaintProperty(
      'marq-future',
      'fill-extrusion-color',
      this.highlight(
        this.partColor('#f3e6cc', '#d9ba88'),
        this.partColor('#f8eedb', '#e2c89c'),
        this.partColor('#fff7e8', '#e9cf9e'),
      ),
    );
    this.map.setPaintProperty('marq-areas-fill', 'fill-opacity', this.highlight(0.42, 0.6, 0.7));
  }

  private applyMaquetteStyle() {
    if (!this.map) return;
    const colors: Record<string, string> = {
      background: '#efe9df',
      park: '#e2e5d6',
      water: '#c9d8d5',
      landuse_residential: '#ebe5da',
      landcover_wood: '#dfe3d3',
      waterway: '#c2d3d0',
      highway_minor: '#f9f6f0',
      highway_path: '#f5f1ea',
      highway_major_casing: '#ddd5c7',
      highway_major_inner: '#fbf9f5',
      highway_major_subtle: '#e6dfd3',
      highway_motorway_casing: '#d6cdbd',
      highway_motorway_inner: '#fbf9f5',
      highway_motorway_subtle: '#e3dccf',
    };
    const keepLabels = [
      'label_city',
      'label_town',
      'label_village',
      'label_other',
      'water_name_point_label',
      'water_name_line_label',
      'highway-name-major',
    ];

    const style = this.map.getStyle();
    if (style && Array.isArray(style.layers)) {
      style.layers.forEach((layer: any) => {
        try {
          if (colors[layer.id]) {
            this.map?.setPaintProperty(layer.id, `${layer.type}-color`, colors[layer.id]);
          }
          if (layer.type === 'symbol') {
            if (!keepLabels.includes(layer.id)) {
              this.map?.setLayoutProperty(layer.id, 'visibility', 'none');
            } else {
              this.map?.setPaintProperty(layer.id, 'text-color', layer.id.startsWith('water') ? '#6f8e8a' : '#8d877f');
              this.map?.setPaintProperty(layer.id, 'text-halo-color', '#efe9df');
            }
          }
          if (layer.id.startsWith('boundary') || layer.id.startsWith('railway') || layer.id === 'building') {
            this.map?.setLayoutProperty(layer.id, 'visibility', 'none');
          }
        } catch {}
      });
    }

    try {
      this.map.setLight({ anchor: 'map', position: [1.4, 215, 45], color: '#fff3e0', intensity: 0.42 });
    } catch {}
  }

  private setupLayers() {
    if (!this.map) return;
    this.map.addSource('marq-ripple', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
    this.map.addLayer({
      id: 'marq-ripple',
      type: 'circle',
      source: 'marq-ripple',
      paint: {
        'circle-radius': ['get', 'r'],
        'circle-color': '#d9ba88',
        'circle-opacity': ['*', ['get', 'o'], 0.18],
        'circle-stroke-color': '#b88642',
        'circle-stroke-width': 2.5,
        'circle-stroke-opacity': ['get', 'o'],
        'circle-pitch-alignment': 'map',
      },
    });

    this.map.addSource('marq-areas', { type: 'geojson', data: this.areasData() });
    this.map.addLayer({
      id: 'marq-areas-fill',
      type: 'fill',
      source: 'marq-areas',
      paint: {
        'fill-color': ['match', ['get', 'kind'], 'macro', '#e6d3ae', 'boulevard', '#9fb58a', '#a9bd8c'],
        'fill-opacity': 0.42,
      },
    });
    this.map.addLayer({
      id: 'marq-areas-line',
      type: 'line',
      source: 'marq-areas',
      paint: { 'line-color': '#b88642', 'line-width': 1.6, 'line-dasharray': [2, 2] },
    });

    [
      ['marq-built', 1],
      ['marq-future', 0.85],
    ].forEach(([id, opacity]) => {
      this.map?.addSource(id as string, { type: 'geojson', data: this.buildingsData(id === 'marq-future') });
      this.map?.addLayer({
        id: id as string,
        type: 'fill-extrusion',
        source: id as string,
        paint: {
          'fill-extrusion-color': '#b88642',
          'fill-extrusion-base': ['get', 'base'],
          'fill-extrusion-height': ['get', 'top'],
          'fill-extrusion-opacity': opacity as number,
        },
      });
    });

    this.paintHighlights();

    ['marq-built', 'marq-future', 'marq-areas-fill'].forEach((layer) => {
      this.map?.on('mousemove', layer, (e: any) => {
        if (!this.map) return;
        this.map.getCanvas().style.cursor = 'pointer';
        const id = e.features?.[0]?.properties?.pid;
        if (id && id !== this.hoveredId) {
          this.hoveredId = id;
          this.paintHighlights();
          this.events.hover?.(id);
        }
      });
      this.map?.on('mouseleave', layer, () => {
        if (!this.map) return;
        this.map.getCanvas().style.cursor = '';
        this.hoveredId = null;
        this.paintHighlights();
        this.events.hover?.(null);
      });
      this.map?.on('click', layer, (e: any) => {
        const id = e.features?.[0]?.properties?.pid;
        if (id) {
          this.stopTour();
          this.select(id);
        }
      });
    });
  }

  private normalizeImageUrl(url?: string): string {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/')) return url;
    return `/${url}`;
  }

  private createPins() {
    if (!this.map) return;
    this.items.forEach((item) => {
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'map-pin is-hidden';
      el.setAttribute('aria-label', `Ver ${item.name}`);
      const imgSrc = this.normalizeImageUrl(item.imageUrl);
      el.innerHTML = `<span class="map-pin-photo"><img src="${imgSrc}" alt=""></span><span class="map-pin-name">${item.name}</span><span class="map-pin-stem"></span>`;

      const stem = item.kind === 'building' ? Math.min(90, 22 + this.maxFloors(item) * 2.4) : 14;
      el.style.setProperty('--stem', `${stem}px`);

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        this.stopTour();
        this.select(item.id);
      });
      el.addEventListener('mouseenter', () => {
        this.hoveredId = item.id;
        this.paintHighlights();
        this.events.hover?.(item.id);
      });
      el.addEventListener('mouseleave', () => {
        this.hoveredId = null;
        this.paintHighlights();
        this.events.hover?.(null);
      });

      this.pins[item.id] = new maplibregl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat(item.coords)
        .addTo(this.map!);
    });
  }

  private easeInOut(t: number): number {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  public scrub(value: number) {
    this.timeValue = Math.min(100, Math.max(0, value));

    this.items.forEach((item) => {
      const seq = item.phase === 'future' ? this.FUTURE : this.REALITY;
      if (item.kind === 'building') {
        const before = this.progress[item.id] || 0;
        const raw = Math.min(1, Math.max(0, (this.timeValue - seq.start) / seq.len));
        this.progress[item.id] = this.easeInOut(raw);
        if (before === 0 && raw > 0) {
          this.addRipple(item.coords);
        }
      } else {
        if (this.timeValue >= seq.start) {
          this.shownAreas.add(item.id);
        } else {
          this.shownAreas.delete(item.id);
        }
      }
    });

    const isFuture = this.timeValue > this.REALITY_END;
    const isBuilding = this.items.some(
      (i) => i.kind === 'building' && (this.progress[i.id] || 0) > 0 && (this.progress[i.id] || 0) < 1,
    );
    const text = isFuture
      ? isBuilding
        ? 'Levantando Torre Panorama, MARQ Collection y Distrito Horizonte…'
        : 'Torre Panorama, MARQ Collection y Distrito Horizonte: el próximo capítulo de la ciudad.'
      : isBuilding
      ? 'Levantando las torres, edificios y barrios que MARQ ya construyó o tiene en obra…'
      : 'Torres, edificios y barrios que MARQ ya construyó o tiene en obra.';

    this.events.timeline?.({
      timeValue: this.timeValue,
      isFuture,
      isBuilding,
      text,
    });

    this.refreshData();
  }

  public select(id: string, fly = true) {
    const item = this.items.find((i) => i.id === id);
    if (!item) return;

    if (!this.isLoaded) {
      this.pendingIntro = false;
      this.pendingSelectId = { id, fly };
      this.selectedId = id;
      this.events.select?.(id);
      return;
    }

    if (
      (item.kind === 'building' && (this.progress[id] || 0) < 1) ||
      (item.kind === 'area' && !this.shownAreas.has(id))
    ) {
      this.stopTimeline();
      this.scrub(100);
    }

    this.selectedId = id;
    this.paintHighlights();

    Object.entries(this.pins).forEach(([pinId, pin]) => {
      pin.getElement().classList.toggle('is-active', pinId === id);
    });

    this.events.select?.(id);

    if (fly && this.map) {
      this.stopDrift();
      const zoom = item.lotSize
        ? 16.4
        : item.kind === 'building'
        ? 16.7
        : (item.radius || 300) > 600
        ? 13.2
        : 14.6;
      this.map.flyTo({
        center: item.coords,
        zoom,
        pitch: item.kind === 'building' ? 64 : 50,
        bearing: this.map.getBearing() + 35,
        duration: this.reducedMotion ? 0 : 2600,
        essential: true,
      });
    }
  }

  public clearSelection() {
    this.selectedId = null;
    this.paintHighlights();
    Object.values(this.pins).forEach((pin) => pin.getElement().classList.remove('is-active'));
    this.events.select?.(null);
  }

  public animateTimeline(target: number, ms: number, onDone?: () => void) {
    this.stopTimeline();
    if (!this.isLoaded) {
      this.pendingIntro = true;
      return;
    }
    if (this.reducedMotion) {
      this.scrub(target);
      onDone?.();
      return;
    }
    const from = this.timeValue;
    const began = performance.now();
    const frame = (now: number) => {
      const t = Math.min(1, (now - began) / ms);
      this.scrub(from + (target - from) * t);
      if (t < 1) {
        this.animFrame = requestAnimationFrame(frame);
      } else {
        this.animFrame = null;
        onDone?.();
      }
    };
    this.animFrame = requestAnimationFrame(frame);
  }

  public stopTimeline() {
    this.pendingIntro = false;
    if (this.animFrame !== null) {
      cancelAnimationFrame(this.animFrame);
      this.animFrame = null;
    }
  }

  public startDrift() {
    if (this.reducedMotion || this.driftFrame !== null || this.touring || !this.map || !this.isLoaded) return;
    const began = performance.now();
    const frame = (now: number) => {
      if (!this.map) return;
      const seconds = (now - began) / 1000;
      const ramp = Math.min(1, seconds / 2);
      const bearing = this.DRIFT.bearing * ramp * Math.sin((seconds * 2 * Math.PI) / this.DRIFT.bearingPeriod);
      this.map.jumpTo({
        bearing: this.OVERVIEW.bearing + bearing,
        pitch:
          this.OVERVIEW.pitch + this.DRIFT.pitch * ramp * Math.sin((seconds * 2 * Math.PI) / this.DRIFT.pitchPeriod),
        zoom: this.OVERVIEW.zoom - Math.abs(bearing) * this.DRIFT.zoomPerDegree,
      });
      this.driftFrame = requestAnimationFrame(frame);
    };
    this.driftFrame = requestAnimationFrame(frame);
  }

  public stopDrift() {
    if (this.driftFrame !== null) {
      cancelAnimationFrame(this.driftFrame);
      this.driftFrame = null;
    }
  }

  public settleCamera() {
    if (this.driftFrame === null || !this.map) return;
    this.stopDrift();
    this.map.easeTo({ ...this.OVERVIEW, duration: 1800, essential: true });
  }

  public startTour() {
    this.stopDrift();
    this.stopTimeline();
    this.scrub(100);
    this.touring = true;
    this.events.tour?.(true);

    const order = this.items.map((i) => i.id);
    let index = 0;
    const next = () => {
      if (!this.touring) return;
      this.select(order[index]);
      index = (index + 1) % order.length;
      this.tourTimer = setTimeout(next, 6500);
    };
    next();
  }

  public stopTour(backToOverview = false) {
    if (!this.touring) return;
    this.touring = false;
    if (this.tourTimer) {
      clearTimeout(this.tourTimer);
      this.tourTimer = null;
    }
    this.events.tour?.(false);
    if (backToOverview) {
      this.clearSelection();
      this.goToOverview();
    }
  }

  public goToOverview(duration = 2200) {
    if (!this.map || !this.isLoaded) return;
    this.map.flyTo({ ...this.OVERVIEW, duration: this.reducedMotion ? 0 : duration, essential: true });
  }

  public zoomIn() {
    this.stopDrift();
    this.map?.zoomIn();
  }

  public zoomOut() {
    this.stopDrift();
    this.map?.zoomOut();
  }

  public rotate(degrees: number) {
    if (!this.map || !this.isLoaded) return;
    this.stopTour();
    this.stopDrift();
    this.map.easeTo({ bearing: this.map.getBearing() + degrees, duration: this.reducedMotion ? 0 : 600 });
  }

  public destroy() {
    this.stopTour();
    this.stopTimeline();
    this.stopDrift();
    Object.values(this.pins).forEach((p) => p.remove());
    this.pins = {};
    this.map?.remove();
    this.map = null;
    this.isLoaded = false;
  }
}
