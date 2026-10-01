// Mapa 3D de Resistencia con las obras de Estudio MARQ, en estilo "maqueta de arquitectura".
// Base: MapLibre + OpenFreeMap (OpenStreetMap), gratis y sin clave. Las coordenadas salen de geocodificar
// las direcciones (Nominatim / OSM); las alturas son aproximadas a partir de la cantidad de pisos.
// Usa los datos de app.js (projectById, esc), que se carga antes.
(function () {
  const section = document.querySelector('#mapa');
  const container = document.querySelector('#city-map');
  if (!section || !container || !window.maplibregl) return;

  // [lng, lat], pisos, lado de la planta en metros. `future`: lo que viene (en preventa o desarrollo, en dorado más claro).
  const PLACES = [
    { id: 'torre-natalini', coords: [-58.98859, -27.44192], floors: 26, size: 24, address: 'Formosa 485 y Av. Rivadavia' },
    { id: 'torre-vista', coords: [-58.99264, -27.45066], floors: 18, size: 20, address: 'Salta 389 y General Dónovan' },
    { id: 'uno-boulevard', coords: [-58.98098, -27.44598], floors: 9, size: 14, address: 'Av. Sarmiento 645' },
    { id: 'torre-nbch', coords: [-58.97821, -27.44671], floors: 16, size: 20, address: 'Pellegrini 761' },
    { id: 'torre-panorama', coords: [-58.97298, -27.43918], floors: 30, size: 30, address: 'Av. Sarmiento 1502', future: true },
    { id: 'ax-sarmiento', coords: [-58.97245, -27.43882], floors: 1, size: 10, address: 'Av. Sarmiento 1510' },
    { id: 'marq-collection', coords: [-58.96737, -27.44197], floors: 7, size: 18, address: 'Av. Italia 1640 y Rissione', future: true },
    { id: 'gaba', coords: [-58.98696, -27.44674], floors: 5, size: 14, address: 'Remedios de Escalada 259 · acá está el estudio' },
    // Macrolote de ~16.000 m² junto al hipermercado Carrefour: ≈ 82 m de frente sobre Av. Ávalos por 195 m de fondo,
    // entre el Pasaje Rioja y el predio del Carrefour (manzana medida sobre OpenStreetMap). Sin render público:
    // dos torres cercanas sobre basamentos y un boulevard central en planta baja, según la descripción del proyecto.
    // Rotado 45° para quedar paralelo a la avenida: el primer eje corre a lo largo de Av. Ávalos y el segundo
    // se aleja de ella (valores negativos = hacia la avenida).
    { id: 'distrito-horizonte', coords: [-58.988684, -27.438998], rotation: 45, future: true, lotSize: [82, 195], address: 'Av. Ávalos, entre el Pasaje Rioja y el Carrefour · volumetría aproximada',
      volumes: [
        { offset: [-22, -58], floors: 20, size: [24, 24] }, { offset: [22, -48], floors: 17, size: [22, 22] },
        { offset: [-24, -52], floors: 2, size: [30, 52] }, { offset: [24, -52], floors: 2, size: [30, 52] }
      ],
      boulevard: { offset: [0, 0], size: [14, 195] } }
  ];
  // Los loteos no figuran en OpenStreetMap: se marcan zonas aproximadas a partir de la dirección publicada.
  const AREAS = [
    { id: 'gran-arboledas', coords: [-58.9455, -27.4155], radius: 420, address: 'Av. Sarmiento 4500 · ubicación aproximada' },
    { id: 'parque-arboledas', coords: [-58.9965, -27.4205], radius: 260, address: 'Av. Ávalos, a 1.000 m de la Ruta 16 · ubicación aproximada' },
    { id: 'brisas-del-norte', coords: [-58.9530, -27.3420], radius: 480, address: 'Av. Juan Manuel de Rosas 3700 · ubicación aproximada' },
    { id: 'pueblo-mio', coords: [-59.0580, -27.3830], radius: 900, address: 'Ruta 11, km 1016, Puerto Tirol · ubicación aproximada' }
  ];
  // Construcción sobre una escala de 0 a 100 en dos tramos: primero se levanta todo "lo que es realidad"
  // (terminado y en obra) a la vez, y después, también a la vez, todo "lo que viene" (preventa y desarrollo).
  // Cada obra arranca en `start` y tarda `len` en completarse; los loteos aparecen al arrancar su tramo.
  const REALITY_END = 64;
  const REALITY = { start: 0, len: 60 };
  const FUTURE = { start: 66, len: 34 };
  const SEQUENCE = [
    ...['torre-vista', 'uno-boulevard', 'gaba', 'torre-natalini', 'ax-sarmiento', 'torre-nbch', 'brisas-del-norte', 'gran-arboledas', 'parque-arboledas', 'pueblo-mio'].map(id => ({ id, ...REALITY })),
    ...['torre-panorama', 'marq-collection', 'distrito-horizonte'].map(id => ({ id, ...FUTURE }))
  ];
  const INTRO_MS = 17000; // lo que tarda la intro en recorrer toda la línea de tiempo
  // Escala de maqueta: las obras se exageran para que se lean desde la vista general de la ciudad.
  const FOOTPRINT_SCALE = 3;                  // plantas de los edificios de un solo volumen
  const HEIGHT_SCALE = 2.4;                   // alturas de todos los edificios
  const FLOOR_HEIGHT = 3.2 * HEIGHT_SCALE;
  const SLAB = 0.45 * HEIGHT_SCALE;
  // Vista general del centro de Resistencia, con el norte arriba: zoom y centro elegidos para que entren todas
  // las obras urbanas (de Torre Vista a MARQ Collection) sin quedar tapadas por la lista, la línea de tiempo
  // ni los botones, incluso en los extremos del movimiento de cámara (DRIFT).
  const OVERVIEW = { center: [-58.98181, -27.44268], zoom: 14.3, pitch: 55, bearing: 0 };
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const places = PLACES.filter(place => projectById(place.id));
  const areas = AREAS.filter(area => projectById(area.id));
  const find = id => places.find(place => place.id === id) || areas.find(area => area.id === id);
  // Avance de cada obra en la animación de la línea de tiempo: 0 = no construida, 1 = completa.
  const progress = Object.fromEntries(places.map(place => [place.id, 0]));
  const volumesOf = place => place.volumes || [{ offset: [0, 0], floors: place.floors, size: [place.size * FOOTPRINT_SCALE, place.size * FOOTPRINT_SCALE] }];
  const maxFloors = place => Math.max(...volumesOf(place).map(volume => volume.floors));
  const shownAreas = new Set();

  let map = null, selectedId = null, hoveredId = null, touring = false, tourTimer = null;
  let timeValue = 0;          // posición actual en la línea de tiempo (0 a 100)
  let anim = null;            // animación de la línea de tiempo en curso (intro o salto a un tramo)
  let drift = null;           // movimiento suave de cámara en la vista general
  const completed = new Set(); // obras terminadas (para el "salto" del pin una sola vez)
  let ripples = [];           // ondas en el suelo cuando arranca una obra
  const pins = {};

  // Rectángulo de [ancho, alto] metros, desplazado [dx, dy] metros desde un punto y rotado `rotation` grados
  // (antihorario) alrededor de ese punto, para alinear un terreno con su calle.
  function rect([lng, lat], [width, height], [dx, dy] = [0, 0], rotation = 0) {
    const mLat = 111320, mLng = 111320 * Math.cos(lat * Math.PI / 180);
    const angle = rotation * Math.PI / 180, cos = Math.cos(angle), sin = Math.sin(angle);
    const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1], [-1, -1]].map(([sx, sy]) => {
      const u = dx + sx * width / 2, v = dy + sy * height / 2;
      return [lng + (u * cos - v * sin) / mLng, lat + (u * sin + v * cos) / mLat];
    });
    return [corners];
  }
  function circle([lng, lat], radius) {
    const points = [];
    for (let i = 0; i <= 48; i++) {
      const angle = (i / 48) * Math.PI * 2;
      points.push([lng + (radius * Math.cos(angle)) / (111320 * Math.cos(lat * Math.PI / 180)), lat + (radius * Math.sin(angle)) / 111320]);
    }
    return [points];
  }

  // Cada piso son dos volúmenes: la losa (más ancha y clara) y el vidrio (retirado y dorado).
  function buildingsData(future) {
    const features = [];
    places.filter(place => Boolean(place.future) === future).forEach(place => {
      volumesOf(place).forEach(volume => {
        const glass = volume.size.map(side => side * 0.9);
        const full = floorsBuilt(volume, place);
        const building = progress[place.id] < 1;
        for (let floor = 0; floor < full; floor++) {
          const base = floor * FLOOR_HEIGHT;
          // El último piso construido se ve encendido mientras la obra sigue, como una losa recién hormigonada.
          const lit = building && floor === full - 1;
          features.push({ type: 'Feature', properties: { pid: place.id, part: 'slab', base, top: base + SLAB }, geometry: { type: 'Polygon', coordinates: rect(place.coords, volume.size, volume.offset, place.rotation) } });
          features.push({ type: 'Feature', properties: { pid: place.id, part: lit ? 'active' : 'glass', base: base + SLAB, top: base + FLOOR_HEIGHT }, geometry: { type: 'Polygon', coordinates: rect(place.coords, glass, volume.offset, place.rotation) } });
        }
      });
    });
    return { type: 'FeatureCollection', features };
  }
  function areasData() {
    const features = areas.filter(area => shownAreas.has(area.id)).map(area => ({ type: 'Feature', properties: { pid: area.id, kind: 'lot' }, geometry: { type: 'Polygon', coordinates: circle(area.coords, area.radius) } }));
    // Terreno y boulevard de los proyectos que ocupan un macrolote.
    places.filter(place => place.lotSize && progress[place.id] > 0).forEach(place => {
      features.push({ type: 'Feature', properties: { pid: place.id, kind: 'macro' }, geometry: { type: 'Polygon', coordinates: rect(place.coords, place.lotSize, [0, 0], place.rotation) } });
      if (place.boulevard) features.push({ type: 'Feature', properties: { pid: place.id, kind: 'boulevard' }, geometry: { type: 'Polygon', coordinates: rect(place.coords, place.boulevard.size, place.boulevard.offset, place.rotation) } });
    });
    return { type: 'FeatureCollection', features };
  }
  // Pisos visibles de un volumen según el avance de su obra.
  const floorsBuilt = (volume, place) => Math.round(volume.floors * progress[place.id]);

  // La geometría solo se regenera cuando cambia la cantidad de pisos o las zonas visibles: regenerarla en cada
  // cuadro traba la animación de la cámara.
  let lastShape = '';
  function refreshData() {
    const shape = places.map(place => `${volumesOf(place).map(volume => floorsBuilt(volume, place)).join('.')}${progress[place.id] < 1 ? '*' : ''}`).join('|') + '#' + [...shownAreas].sort().join(',');
    if (shape !== lastShape) {
      lastShape = shape;
      map.getSource('marq-built')?.setData(buildingsData(false));
      map.getSource('marq-future')?.setData(buildingsData(true));
      map.getSource('marq-areas')?.setData(areasData());
    }
    Object.entries(pins).forEach(([id, pin]) => {
      const element = pin.getElement();
      if (!(id in progress)) { element.classList.toggle('is-hidden', !shownAreas.has(id)); return; }
      const total = maxFloors(find(id));
      const building = progress[id] > 0 && progress[id] < 1;
      element.classList.toggle('is-hidden', !building && progress[id] < 1);
      element.classList.toggle('is-building', building);
      // Contador en vivo mientras se construye.
      const name = projectById(id).name;
      const label = building ? `${name} · piso ${Math.round(progress[id] * total)}/${total}` : name;
      const nameEl = element.querySelector('.map-pin-name');
      if (nameEl.textContent !== label) nameEl.textContent = label;
      if (progress[id] >= 1 && !completed.has(id)) {
        completed.add(id);
        element.classList.add('just-built');
        setTimeout(() => element.classList.remove('just-built'), 900);
      } else if (progress[id] < 1) completed.delete(id);
    });
  }

  // Ondas doradas que se expanden sobre el suelo cuando arranca una obra.
  function addRipple(coords) {
    const now = performance.now();
    ripples.push({ coords, start: now }, { coords, start: now + 280 });
    if (ripples.length <= 2) requestAnimationFrame(animateRipples);
  }
  function animateRipples(now) {
    ripples = ripples.filter(ripple => now - ripple.start < 1500);
    const features = ripples.map(ripple => {
      const t = Math.max(0, (now - ripple.start) / 1500);
      return { type: 'Feature', properties: { r: 6 + 80 * (1 - Math.pow(1 - t, 3)), o: t > 0 ? 0.85 * (1 - t) : 0 }, geometry: { type: 'Point', coordinates: ripple.coords } };
    });
    map.getSource('marq-ripple')?.setData({ type: 'FeatureCollection', features });
    if (ripples.length) requestAnimationFrame(animateRipples);
  }

  // Color de losa y vidrio según selección y hover (se compara el id del proyecto dentro de la expresión).
  function partColor(slab, glass) {
    return ['match', ['get', 'part'], 'slab', slab, 'active', '#fff1cf', glass];
  }
  function highlight(normal, hover, active) {
    return ['case', ['==', ['get', 'pid'], selectedId || ''], active, ['==', ['get', 'pid'], hoveredId || ''], hover, normal];
  }
  function paintHighlights() {
    if (!map?.getLayer('marq-built')) return;
    map.setPaintProperty('marq-built', 'fill-extrusion-color', highlight(partColor('#f3e6cc', '#b88642'), partColor('#f8eedb', '#cf9d57'), partColor('#fff7e8', '#e0ad5f')));
    map.setPaintProperty('marq-future', 'fill-extrusion-color', highlight(partColor('#f3e6cc', '#d9ba88'), partColor('#f8eedb', '#e2c89c'), partColor('#fff7e8', '#e9cf9e')));
    map.setPaintProperty('marq-areas-fill', 'fill-opacity', highlight(0.42, 0.6, 0.7));
  }

  // Estilo "maqueta": piso crema, ciudad en blanco mate, agua y verde suaves, pocos textos.
  function applyMaquetteStyle() {
    const colors = {
      background: '#efe9df', park: '#e2e5d6', water: '#c9d8d5', landuse_residential: '#ebe5da', landcover_wood: '#dfe3d3',
      waterway: '#c2d3d0', highway_minor: '#f9f6f0', highway_path: '#f5f1ea', highway_major_casing: '#ddd5c7', highway_major_inner: '#fbf9f5',
      highway_major_subtle: '#e6dfd3', highway_motorway_casing: '#d6cdbd', highway_motorway_inner: '#fbf9f5', highway_motorway_subtle: '#e3dccf'
    };
    const keepLabels = ['label_city', 'label_town', 'label_village', 'label_other', 'water_name_point_label', 'water_name_line_label', 'highway-name-major'];
    map.getStyle().layers.forEach(layer => {
      if (colors[layer.id]) map.setPaintProperty(layer.id, `${layer.type}-color`, colors[layer.id]);
      if (layer.type === 'symbol') {
        if (!keepLabels.includes(layer.id)) map.setLayoutProperty(layer.id, 'visibility', 'none');
        else {
          map.setPaintProperty(layer.id, 'text-color', layer.id.startsWith('water') ? '#6f8e8a' : '#8d877f');
          map.setPaintProperty(layer.id, 'text-halo-color', '#efe9df');
        }
      }
      if (layer.id.startsWith('boundary') || layer.id.startsWith('railway') || layer.id === 'building') map.setLayoutProperty(layer.id, 'visibility', 'none');
    });
    map.setLight({ anchor: 'map', position: [1.4, 215, 45], color: '#fff3e0', intensity: 0.42 });
  }

  function renderList() {
    document.querySelector('#map-list').innerHTML = [...places, ...areas].map(item => {
      const project = projectById(item.id);
      return `<button type="button" data-map-go="${esc(item.id)}"><img src="${esc(project.image)}" alt="" loading="lazy"><span><b>${esc(project.name)}</b><small>${esc(project.status)}</small></span></button>`;
    }).join('');
  }

  function renderCard(id) {
    const card = document.querySelector('#map-card');
    if (!id) { card.hidden = true; return; }
    const item = find(id);
    const project = projectById(id);
    card.innerHTML = `<button class="map-card-close" type="button" data-map-close aria-label="Cerrar">×</button>
      <img src="${esc(project.image)}" alt="${esc(project.imageAlt)}">
      <div class="map-card-body">
        <span class="map-card-status">${esc(project.category)} · ${esc(project.status)}</span>
        <h3>${esc(project.name)}</h3>
        <p class="map-card-address">${esc(item.address)}</p>
        <p>${esc(project.description)}</p>
        <div class="map-card-actions"><button class="btn-primary" type="button" data-team="${esc(id)}">Quiénes están detrás <span>↗</span></button></div>
      </div>`;
    card.hidden = false;
    card.classList.remove('is-in');
    requestAnimationFrame(() => card.classList.add('is-in'));
  }

  function select(id, fly = true) {
    // Si la obra todavía no apareció en la línea de tiempo, se completa la ciudad.
    if ((id in progress && progress[id] < 1) || (!(id in progress) && !shownAreas.has(id))) { stopTimeline(); scrub(100); }
    selectedId = id;
    paintHighlights();
    Object.entries(pins).forEach(([pinId, pin]) => pin.getElement().classList.toggle('is-active', pinId === id));
    document.querySelectorAll('#map-list [data-map-go]').forEach(button => button.classList.toggle('is-active', button.dataset.mapGo === id));
    renderCard(id);
    if (fly) {
      stopDrift();
      const item = find(id);
      const zoom = item.lotSize ? 16.4 : item.coords && item.id in progress ? 16.7 : item.radius > 600 ? 13.2 : 14.6;
      map.flyTo({ center: item.coords, zoom, pitch: item.id in progress ? 64 : 50, bearing: map.getBearing() + 35, duration: reducedMotion ? 0 : 2600, essential: true });
    }
  }
  function clearSelection() {
    selectedId = null;
    paintHighlights();
    Object.values(pins).forEach(pin => pin.getElement().classList.remove('is-active'));
    document.querySelectorAll('#map-list [data-map-go]').forEach(button => button.classList.remove('is-active'));
    renderCard(null);
  }

  // Lleva la ciudad a un punto de la línea de tiempo: cada obra muestra su avance según ese momento.
  const easeInOut = t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  function scrub(value) {
    timeValue = Math.min(100, Math.max(0, value));
    SEQUENCE.forEach(item => {
      const place = find(item.id); if (!place) return;
      if (item.id in progress) {
        const before = progress[item.id];
        const raw = Math.min(1, Math.max(0, (timeValue - item.start) / item.len));
        progress[item.id] = easeInOut(raw);
        if (before === 0 && raw > 0) addRipple(place.coords); // arranca la obra
      } else if (timeValue >= item.start) shownAreas.add(item.id);
      else shownAreas.delete(item.id);
    });
    updateTimelineUI();
    refreshData();
  }

  function updateTimelineUI() {
    const slider = document.querySelector('#map-timeline');
    slider.value = String(timeValue);
    slider.style.setProperty('--fill', `${timeValue}%`);
    const future = timeValue > REALITY_END;
    document.querySelectorAll('.map-ticks button').forEach((button, index) => button.classList.toggle('is-active', index === 0 ? timeValue > 0 : future));
    const building = SEQUENCE.some(item => item.id in progress && progress[item.id] > 0 && progress[item.id] < 1);
    const text = future
      ? (building ? 'Levantando Torre Panorama, MARQ Collection y Distrito Horizonte…' : 'Torre Panorama, MARQ Collection y Distrito Horizonte: el próximo capítulo de la ciudad.')
      : (building ? 'Levantando las torres, edificios y barrios que MARQ ya construyó o tiene en obra…' : 'Torres, edificios y barrios que MARQ ya construyó o tiene en obra.');
    document.querySelector('#map-caption').innerHTML = `<b>${future ? 'Lo que viene' : 'Lo que es realidad'}</b> ${esc(text)}`;
  }

  // Recorre la línea de tiempo hasta `target` en `ms` milisegundos, de forma continua.
  function animateTimeline(target, ms, onDone) {
    stopTimeline();
    if (reducedMotion) { scrub(target); onDone?.(); return; }
    const from = timeValue, began = performance.now();
    const frame = now => {
      const t = Math.min(1, (now - began) / ms);
      scrub(from + (target - from) * t);
      anim = t < 1 ? requestAnimationFrame(frame) : null;
      if (t >= 1) onDone?.();
    };
    anim = requestAnimationFrame(frame);
  }
  function stopTimeline() {
    if (anim !== null) { cancelAnimationFrame(anim); anim = null; }
  }

  function goToOverview(duration = 2200) {
    map.flyTo({ ...OVERVIEW, duration: reducedMotion ? 0 : duration, essential: true });
  }

  // Cuando termina de construirse todo, el movimiento se detiene y la cámara vuelve suave a la vista general.
  function settleCamera() {
    if (drift === null) return; // el usuario ya tomó el control de la cámara
    stopDrift();
    map.easeTo({ ...OVERVIEW, duration: 1800, essential: true });
  }

  // Movimiento continuo de la vista general mientras se construye: la cámara gira ±20° y cambia la inclinación
  // alrededor del centro, sin acercarse a las obras. Cuanto más gira, más se aleja un poco, para que todas sigan a la vista.
  const DRIFT = { bearing: 20, bearingPeriod: 14, pitch: 7, pitchPeriod: 11, zoomPerDegree: 0.02 };
  function startDrift() {
    if (reducedMotion || drift !== null || touring) return;
    const began = performance.now();
    const frame = now => {
      const seconds = (now - began) / 1000;
      const ramp = Math.min(1, seconds / 2); // arranca de a poco, sin saltos
      const bearing = DRIFT.bearing * ramp * Math.sin((seconds * 2 * Math.PI) / DRIFT.bearingPeriod);
      map.jumpTo({
        bearing: OVERVIEW.bearing + bearing,
        pitch: OVERVIEW.pitch + DRIFT.pitch * ramp * Math.sin((seconds * 2 * Math.PI) / DRIFT.pitchPeriod),
        zoom: OVERVIEW.zoom - Math.abs(bearing) * DRIFT.zoomPerDegree
      });
      drift = requestAnimationFrame(frame);
    };
    drift = requestAnimationFrame(frame);
  }
  function stopDrift() {
    if (drift !== null) { cancelAnimationFrame(drift); drift = null; }
  }

  // Recorrido automático por todas las obras, para dejar corriendo en una presentación.
  function startTour() {
    stopDrift();
    stopTimeline();
    scrub(100);
    touring = true;
    document.querySelector('#map-tour').textContent = '■ Detener recorrido';
    const order = [...places, ...areas].map(item => item.id);
    let index = 0;
    const next = () => {
      if (!touring) return;
      select(order[index]);
      index = (index + 1) % order.length;
      tourTimer = setTimeout(next, 6500);
    };
    next();
  }
  function stopTour(backToOverview = false) {
    if (!touring) return;
    touring = false;
    clearTimeout(tourTimer);
    document.querySelector('#map-tour').textContent = '▶ Recorrer las obras';
    if (backToOverview) { clearSelection(); goToOverview(); }
  }

  function createPins() {
    [...places, ...areas].forEach(item => {
      const project = projectById(item.id);
      const element = document.createElement('button');
      element.type = 'button';
      element.className = 'map-pin is-hidden';
      element.setAttribute('aria-label', `Ver ${project.name}`);
      element.innerHTML = `<span class="map-pin-photo"><img src="${esc(project.image)}" alt=""></span><span class="map-pin-name">${esc(project.name)}</span><span class="map-pin-stem"></span>`;
      // El palito del pin es más largo cuanto más alta es la obra, para que la foto "flote" sobre el edificio.
      element.style.setProperty('--stem', `${item.id in progress ? Math.min(90, 22 + maxFloors(item) * 2.4) : 14}px`);
      element.addEventListener('click', event => { event.stopPropagation(); stopTour(); select(item.id); });
      element.addEventListener('mouseenter', () => { hoveredId = item.id; paintHighlights(); });
      element.addEventListener('mouseleave', () => { hoveredId = null; paintHighlights(); });
      pins[item.id] = new maplibregl.Marker({ element, anchor: 'bottom' }).setLngLat(item.coords).addTo(map);
    });
  }

  function build() {
    map = new maplibregl.Map({ container, style: 'https://tiles.openfreemap.org/styles/positron', ...OVERVIEW, maxPitch: 75, attributionControl: { compact: true } });
    map.scrollZoom.disable(); // la rueda sigue bajando la página; se acerca con los botones, arrastrando o con pellizco
    // Margen interno para que la lista (izquierda) y la línea de tiempo (abajo) no tapen las obras.
    if (container.clientWidth > 900) map.setPadding({ left: 270, bottom: 110, top: 60, right: 0 });

    map.on('load', () => {
      applyMaquetteStyle();
      // Solo las obras de MARQ en 3D: los edificios del resto de la ciudad no se dibujan.
      map.addSource('marq-ripple', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addLayer({ id: 'marq-ripple', type: 'circle', source: 'marq-ripple', paint: { 'circle-radius': ['get', 'r'], 'circle-color': '#d9ba88', 'circle-opacity': ['*', ['get', 'o'], 0.18], 'circle-stroke-color': '#b88642', 'circle-stroke-width': 2.5, 'circle-stroke-opacity': ['get', 'o'], 'circle-pitch-alignment': 'map' } });
      map.addSource('marq-areas', { type: 'geojson', data: areasData() });
      map.addLayer({ id: 'marq-areas-fill', type: 'fill', source: 'marq-areas', paint: { 'fill-color': ['match', ['get', 'kind'], 'macro', '#e6d3ae', 'boulevard', '#9fb58a', '#a9bd8c'], 'fill-opacity': 0.42 } });
      map.addLayer({ id: 'marq-areas-line', type: 'line', source: 'marq-areas', paint: { 'line-color': '#b88642', 'line-width': 1.6, 'line-dasharray': [2, 2] } });
      [['marq-built', 1], ['marq-future', 0.85]].forEach(([id, opacity]) => {
        map.addSource(id, { type: 'geojson', data: buildingsData(id === 'marq-future') });
        map.addLayer({ id, type: 'fill-extrusion', source: id, paint: { 'fill-extrusion-color': '#b88642', 'fill-extrusion-base': ['get', 'base'], 'fill-extrusion-height': ['get', 'top'], 'fill-extrusion-opacity': opacity } });
      });
      paintHighlights();

      ['marq-built', 'marq-future', 'marq-areas-fill'].forEach(layer => {
        map.on('mousemove', layer, event => {
          map.getCanvas().style.cursor = 'pointer';
          const id = event.features[0]?.properties.pid;
          if (id !== hoveredId) { hoveredId = id; paintHighlights(); }
        });
        map.on('mouseleave', layer, () => { map.getCanvas().style.cursor = ''; hoveredId = null; paintHighlights(); });
        map.on('click', layer, event => { stopTour(); select(event.features[0].properties.pid); });
      });
      map.on('click', event => {
        if (!map.queryRenderedFeatures(event.point, { layers: ['marq-built', 'marq-future', 'marq-areas-fill'] }).length) clearSelection();
      });
      ['mousedown', 'touchstart'].forEach(type => map.on(type, () => { stopTour(); stopDrift(); }));

      createPins();
      scrub(0);
      if (reducedMotion) { scrub(100); return; }
      // La intro arranca cuando el mapa está realmente a la vista.
      new IntersectionObserver((entries, observer) => {
        if (entries.some(entry => entry.isIntersecting)) { observer.disconnect(); animateTimeline(100, INTRO_MS, settleCamera); startDrift(); }
      }, { threshold: 0.45 }).observe(container);
    });
  }

  document.querySelector('#map-list').addEventListener('click', event => {
    const button = event.target.closest('[data-map-go]');
    if (button && map) { stopTour(); select(button.dataset.mapGo); }
  });
  document.querySelector('#map-card').addEventListener('click', event => {
    if (event.target.closest('[data-map-close]')) clearSelection();
  });
  document.querySelector('#map-overview').addEventListener('click', () => {
    if (!map) return;
    stopTour(); stopDrift(); clearSelection();
    map.flyTo({ center: [-59.0, -27.398], zoom: 11.3, pitch: 40, bearing: -20, duration: reducedMotion ? 0 : 2600 });
  });
  document.querySelector('#map-zoom-in').addEventListener('click', () => { stopDrift(); map?.zoomIn(); });
  document.querySelector('#map-zoom-out').addEventListener('click', () => { stopDrift(); map?.zoomOut(); });
  document.querySelector('#map-tour').addEventListener('click', () => { if (map) (touring ? stopTour(true) : startTour()); });
  // Línea de tiempo continua: arrastrarla construye o "desconstruye" la ciudad en vivo.
  const slider = document.querySelector('#map-timeline');
  Object.assign(slider, { min: '0', max: '100', step: '0.1' });
  slider.addEventListener('input', event => { if (!map) return; stopTour(); stopTimeline(); settleCamera(); scrub(Number(event.target.value)); });
  const ticks = document.querySelector('.map-ticks');
  ticks.style.gridTemplateColumns = `${REALITY_END}fr ${100 - REALITY_END}fr`;
  ticks.innerHTML = '<button type="button" data-jump="reality">Lo que es realidad</button><button type="button" data-jump="future">Lo que viene</button>';
  ticks.addEventListener('click', event => {
    const button = event.target.closest('[data-jump]');
    if (!button || !map) return;
    stopTour();
    settleCamera();
    // Cada tramo se recorre de forma continua desde donde está la línea de tiempo.
    animateTimeline(button.dataset.jump === 'future' ? 100 : REALITY_END, 7000);
  });

  renderList();
  // El mapa se crea recién cuando la sección se acerca a la pantalla.
  new IntersectionObserver((entries, observer) => {
    if (entries.some(entry => entry.isIntersecting)) { build(); observer.disconnect(); }
  }, { rootMargin: '100px 0px' }).observe(section);
})();
