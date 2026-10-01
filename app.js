// Contenido demostrativo. En una versión conectada a servidor, estos datos
// deberían leerse y guardarse mediante una API con acceso autenticado.
const MARQ_WHATSAPP = '5493624119351'; // WhatsApp público del estudio (estudiomarq.com.ar).
const STORAGE_KEYS = { projects: 'marq-projects-v6', people: 'marq-people-v6', webStats: 'marq-web-stats-v1' };
const STATUSES = ['Nuevo contacto', 'En conversación', 'Información enviada', 'Visita agendada', 'En negociación', 'Cerró operación', 'Sin interés por ahora'];
const CLOSED_STATUSES = ['Cerró operación', 'Sin interés por ahora'];
const STATUS_TONES = { 'Nuevo contacto': 'tone-new', 'En conversación': 'tone-active', 'Información enviada': 'tone-active', 'Visita agendada': 'tone-warm', 'En negociación': 'tone-warm', 'Cerró operación': 'tone-done', 'Sin interés por ahora': 'tone-muted' };
const INTERESTS = ['Vivienda propia', 'Inversión', 'Alquiler', 'A definir'];
const CHANNELS = ['WhatsApp', 'Llamada', 'Visita', 'Email', 'Instagram', 'Facebook', 'Presencial'];
const NEWS_TYPES = ['Avance de obra', 'Disponibilidad', 'Promoción', 'Evento', 'Modificación', 'Información relevante'];
const PROFILES = { vivienda: { label: 'Busco mi próxima vivienda', interest: 'Vivienda propia', tab: 'Para vivir' }, inversion: { label: 'Busco oportunidades de inversión', interest: 'Inversión', tab: 'Para invertir' } };
const STRONG_SIGNALS = ['visit'];

// Etapas de precio de un desarrollo, según cómo las explicó el estudio en la entrevista.
const STAGES = {
  preventa: { label: 'Preventa', short: 'hasta 20% por debajo del precio en obra' },
  obra: { label: 'En obra', short: 'la estructura ya se ve y el precio sube cerca de 10%' },
  posventa: { label: 'Terminado', short: 'sin riesgo de obra: se paga y se muda' },
  lotes: { label: 'Lotes en venta', short: 'tierra urbanizada con financiación propia' },
  portfolio: { label: 'Obra realizada', short: 'proyecto terminado' }
};

// Qué proyectos están a la venta y para qué perfil (datos publicados en estudiomarq.com.ar y en prensa, 2026).
const PROJECT_DETAILS = {
  'torre-natalini': { forSale: true, profiles: ['vivienda', 'inversion'], stage: 'posventa', livingHint: 'Últimas unidades, listas para mudarse' },
  'marq-collection': { forSale: true, profiles: ['vivienda', 'inversion'], stage: 'preventa', livingHint: 'En pozo, desde USD 79.000' },
  'torre-panorama': { forSale: true, profiles: ['vivienda', 'inversion'], stage: 'preventa', livingHint: 'En preventa' },
  'casa-bdn': { forSale: true, profiles: ['vivienda'], stage: 'obra', livingHint: 'Casa + terreno en hasta 84 cuotas' },
  'pueblo-mio': { forSale: true, profiles: ['vivienda', 'inversion'], stage: 'lotes', livingHint: 'Lotes de 400 m² con laguna' },
  'gran-arboledas': { forSale: true, profiles: ['vivienda', 'inversion'], stage: 'lotes', livingHint: '193 lotes entre bosque nativo' },
  'brisas-del-norte': { forSale: true, profiles: ['vivienda', 'inversion'], stage: 'lotes', livingHint: 'Laguna, muelle y todos los servicios' },
  'parque-arboledas': { forSale: true, profiles: ['vivienda', 'inversion'], stage: 'lotes', livingHint: 'Predio de 6 hectáreas' }
};
const detailFor = project => PROJECT_DETAILS[project.id] || { forSale: false, profiles: [], stage: 'portfolio', livingHint: '' };

const isoDate = date => { const d = new Date(date); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };
const todayIso = () => isoDate(new Date());
const daysFromToday = days => { const d = new Date(); d.setDate(d.getDate() + days); return isoDate(d); };
const dayDiff = iso => Math.round((new Date(`${iso}T00:00`) - new Date(`${todayIso()}T00:00`)) / 86400000);
const formatDate = iso => iso ? iso.split('-').reverse().join('/') : '';
const dueTone = iso => { const diff = dayDiff(iso); return diff < 0 ? 'overdue' : diff === 0 ? 'today' : ''; };
function relativeDay(iso) {
  const diff = dayDiff(iso);
  if (diff === 0) return 'Hoy';
  if (diff === 1) return 'Mañana';
  if (diff === -1) return 'Ayer';
  return diff < 0 ? `Hace ${-diff} días` : `En ${diff} días`;
}

// Proyectos reales de Estudio MARQ (fuente: estudiomarq.com.ar y prensa local, 2026).
const MARQ_IMG = 'https://estudiomarq.com.ar/wp-content/uploads';
const ALEJANDRA = { name: 'Arq. María Alejandra Maro', role: 'Proyecto y dirección', description: 'Fundadora y directora de Estudio MARQ. “Los detalles hacen el diseño.”', image: `${MARQ_IMG}/Ale-unoboulevard4.webp` };
const MARQ_TEAM = { name: 'Equipo MARQ', role: 'Arquitectura · comunicación · administración', description: 'Un equipo interdisciplinario de 15 personas que acompaña cada etapa, del análisis del terreno a la entrega.' };
const teamWith = (...extra) => [ALEJANDRA, MARQ_TEAM, ...extra];

const initialProjects = [
  { id:'torre-natalini', name:'Torre Natalini', category:'Edificios', year:'2024', status:'Últimas unidades', location:'Formosa 485 y Av. Rivadavia', facts:['26 pisos', '10.172 m²'], description:'26 pisos de arquitectura contemporánea sobre el antiguo vivero de la familia Natalini. Unidades amplias y luminosas, materiales nobles y amenities de primer nivel.', image:`${MARQ_IMG}/2024/07/contacto-04-1.webp`, imageAlt:'Torre Natalini iluminada al atardecer', team: teamWith(
    { name:'Familia Natalini', role:'El lugar', description:'En su terreno funcionaba el vivero familiar. Sus plantas se trasladaron durante la obra y hoy forman el jardín vertical.' },
    { name:'Schindler', role:'Proveedores', description:'Ascensores Schindler 5500: tecnología de elevación poco habitual en la ciudad hasta esta torre.' }
  ), news:[{ id:1, date:daysFromToday(-17), type:'Disponibilidad', title:'Últimas unidades de 2 dormitorios', body:'Quedan pocas unidades de 2 dormitorios con vista al jardín vertical. Se entregan terminadas.' }] },
  { id:'marq-collection', name:'MARQ Collection', category:'Edificios', year:'2026', status:'En pozo', location:'Av. Italia 1640 y Rissione', facts:['30 unidades', 'Desde USD 79.000'], description:'La expresión de una nueva forma de habitar: vegetación integrada a la fachada, un entorno verde frente a la Laguna Francia y amenities pensados también para mascotas.', image:'https://www.libertaddigital.com.ar/content/bucket/9/69299w850h638c.png.webp', imageAlt:'Identidad visual de MARQ Collection', team: teamWith(), news:[{ id:2, date:daysFromToday(-9), type:'Evento', title:'Presentación de la preventa', body:'Presentamos MARQ Collection en el estudio: planos, tipologías y condiciones para ingresar en pozo.' }] },
  { id:'torre-panorama', name:'Torre Panorama', category:'Edificios', year:'', status:'En preventa', location:'Resistencia', facts:['25.000 m²'], description:'Un desarrollo de 25.000 m² en una zona estratégica de la ciudad, pensado para correr los límites del mercado local.', image:`${MARQ_IMG}/2024/08/torre-panorama-proyecto.webp`, imageAlt:'Render de Torre Panorama', team: teamWith(), news:[] },
  { id:'torre-nbch', name:'Torre NBCH', category:'Edificios', year:'', status:'En obra', location:'Resistencia', facts:['Mutual NBCH'], description:'Una inversión segura para la Mutual Bancaria del Personal del Nuevo Banco del Chaco.', image:`${MARQ_IMG}/2024/08/torre-nbch-proyecto.webp`, imageAlt:'Render de Torre NBCH', team: teamWith(
    { name:'Mutual Bancaria del Personal del NBCH', role:'Comitente', description:'Impulsa el edificio como inversión para sus asociados.' }
  ), news:[] },
  { id:'uno-boulevard', name:'Uno Boulevard', category:'Edificios', year:'2017', status:'Terminado', location:'Av. Sarmiento', facts:['9 pisos + 2 subsuelos', '3.500 m²'], description:'Un juego de volúmenes y líneas que multiplica los planos de la fachada, privilegia la luz natural y abre vistas lejanas.', image:`${MARQ_IMG}/2024/07/uno-proyecto.webp`, imageAlt:'Fachada de Uno Boulevard con líneas de luz', team: [
    { ...ALEJANDRA, role:'Arquitecta a cargo' },
    { name:'Arq. Julián Berdichevsky', role:'Estudio asociado · BARQ', description:'Diseñó el edificio junto a Estudio MARQ entre 2013 y 2014.', image:`${MARQ_IMG}/2024/06/julian.webp` },
    MARQ_TEAM
  ], news:[] },
  { id:'distrito-horizonte', name:'Distrito Horizonte', category:'Edificios Especiales', year:'', status:'En desarrollo', location:'Av. Ávalos', facts:['16.000 m²', 'Uso mixto'], description:'La ciudad que viene comienza acá: un macrolote de 16.000 m² junto al Carrefour de Av. Ávalos, pensado como polo administrativo, comercial y gastronómico, con oficinas, entretenimiento y espacio residencial.', image:'img/distrito-horizonte.jpg', imageAlt:'Render de Distrito Horizonte: torres de vidrio sobre un basamento con vegetación', team: teamWith(
    { name:'Candelaria Alegre Maro', role:'Comunicación', description:'Presentó el proyecto junto a Alejandra Maro como “una nueva forma de pensar la ciudad”.' }
  ), news:[{ id:3, date:'2026-03-27', type:'Evento', title:'Distrito Horizonte en Radio Libertad', body:'Alejandra Maro y Candelaria Alegre Maro presentaron el proyecto: una nueva forma de pensar la ciudad.' }] },
  { id:'torre-vista', name:'Torre Vista', category:'Edificios', year:'2013', status:'Terminado', location:'Salta y Donovan', facts:['Esquina', 'Semitorre + torre'], description:'Edificio en esquina con base en semitorre y torre en altura. Revitalizó una zona del centro que hoy tiene comercios y una plaza para caminar tranquilo.', image:`${MARQ_IMG}/2024/07/torre-vista-proyecto.webp`, imageAlt:'Acceso de Torre Vista', team: teamWith(), news:[] },
  { id:'gaba', name:'Edificio GABA', category:'Edificios', year:'', status:'Terminado', location:'Resistencia', facts:['Live & work'], description:'Un edificio versátil bajo el concepto live & work: para vivir, trabajar o alquilar temporariamente.', image:`${MARQ_IMG}/2024/07/gaba-proyecto.webp`, imageAlt:'Edificio GABA con balcones verdes', team: teamWith(), news:[] },
  { id:'casa-bdn', name:'Casas BDN + Terreno', category:'Casas', year:'', status:'En construcción', location:'Brisas del Norte', facts:['1 a 3 dormitorios', '52 a 120 m²'], description:'Tu casa y tu terreno en un barrio costero consolidado, habitado y en pleno crecimiento.', image:`${MARQ_IMG}/casas-bdn-portada-proyectos.webp`, imageAlt:'Casa de Brisas del Norte con jardín', team: teamWith(), news:[] },
  { id:'loft-al-rio', name:'Loft al Río', category:'Casas', year:'', status:'Terminado', location:'Resistencia', facts:['Doble altura'], description:'Viviendas en doble altura frente al agua, con superficies flexibles para disfrutar sin límites.', image:`${MARQ_IMG}/2024/08/loftalrio-proyecto.webp`, imageAlt:'Lofts iluminados frente al río', team: teamWith(), news:[] },
  { id:'casa-fo', name:'Casa FO', category:'Casas', year:'', status:'Terminado', location:'Resistencia', facts:['Proyecto a medida'], description:'Un equilibrio entre calidad y costo, con un valor único pensado para el estilo de vida soñado por sus dueños.', image:`${MARQ_IMG}/2024/07/casa-fontanes-proyecto.webp`, imageAlt:'Casa FO con jardín tropical', team: teamWith(), news:[] },
  { id:'pueblo-mio', name:'Pueblo Mío', category:'Lotes', year:'', status:'En desarrollo', location:'Ruta 11, Puerto Tirol', facts:['100 ha', 'Lotes de 400 m²'], description:'Un barrio privado con laguna sobre 100 hectáreas de agua y bosque, a 10 minutos del centro.', image:`${MARQ_IMG}/2024/07/pueblomio-proyecto.webp`, imageAlt:'Bosque nativo de Pueblo Mío', team: teamWith(), news:[] },
  { id:'gran-arboledas', name:'Gran Arboledas', category:'Lotes', year:'', status:'En venta', location:'Av. Sarmiento 4500', facts:['193 lotes', '300 a 400 m²'], description:'193 lotes con infraestructura completa que conservan el bosque nativo, a minutos de la ciudad.', image:`${MARQ_IMG}/2024/07/gran-arboledas-inversiones.webp`, imageAlt:'Loteo Gran Arboledas', team: teamWith(), news:[] },
  { id:'brisas-del-norte', name:'Brisas del Norte', category:'Lotes', year:'', status:'En venta', location:'Av. Juan Manuel de Rosas 3700', facts:['Laguna y muelle'], description:'Un loteo rodeado de naturaleza, con laguna, muelle y espacios de recreación: ideal para vivir o invertir.', image:`${MARQ_IMG}/2024/07/brisas-del-norte-proyecto.webp`, imageAlt:'Muelle sobre la laguna de Brisas del Norte', team: teamWith(), news:[] },
  { id:'parque-arboledas', name:'Parque Arboledas', category:'Lotes', year:'', status:'En venta', location:'Av. Ávalos', facts:['6 ha'], description:'Un predio de 6 hectáreas de características únicas, a 1.000 m de la Ruta 16.', image:`${MARQ_IMG}/2024/07/parque-arboledas-proyecto.webp`, imageAlt:'Vista aérea de Parque Arboledas', team: teamWith(), news:[] },
  { id:'interiorismo-pe', name:'Interiorismo PE', category:'Interiorismo', year:'', status:'Terminado', location:'Resistencia', facts:['Rediseño interior'], description:'Estilo clásico, lujo y modernidad en un rediseño interior minimalista con el sello MARQ.', image:`${MARQ_IMG}/2024/07/interiorismo-peruchena-proyecto.webp`, imageAlt:'Living luminoso con interiorismo MARQ', team: teamWith(), news:[] },
  { id:'ax-sarmiento', name:'AX Sarmiento', category:'Locales Comerciales', year:'', status:'Terminado', location:'Av. Sarmiento 1510', facts:['AXION Energy'], description:'Estación de servicio para la cadena AXION Energy, una de las cuatro que el estudio proyectó en la región.', image:`${MARQ_IMG}/2024/07/axion-proyecto.webp`, imageAlt:'Estación de servicio AXION en Av. Sarmiento', team: teamWith(
    { name:'AXION Energy', role:'Cliente', description:'Cadena para la que MARQ proyectó estaciones de servicio en Resistencia y Puerto Tirol.' }
  ), news:[] },
  { id:'cet', name:'C.E.T.', category:'Edificios Especiales', year:'', status:'Terminado', location:'Resistencia', facts:['Gran escala'], description:'Centro Educativo Terapéutico: arquitectura de gran escala y vanguardia con el estilo MARQ.', image:`${MARQ_IMG}/2024/07/C.E.T-proyecto.webp`, imageAlt:'Fachada del Centro Educativo Terapéutico', team: teamWith(), news:[] }
];

// Las fechas se calculan desde hoy para que la agenda siempre tenga tareas vencidas, de hoy y próximas.
const initialPeople = [
  { id:'p1', name:'Ana Martínez', phone:'5493624000001', email:'ana.martinez@correo.com', source:'Instagram', projects:['torre-natalini'], interest:'Vivienda propia', status:'En conversación', notes:'Busca 2 dormitorios en piso alto, con balcón. Es su primera vivienda.', nextAction:{ text:'Enviar planos del piso 8 y opciones de financiación', date:daysFromToday(0) }, history:[
    { date:daysFromToday(-9), channel:'Instagram', note:'Consultó por departamentos de 2 dormitorios en Torre Natalini.' },
    { date:daysFromToday(-4), channel:'Llamada', note:'Le interesa un piso alto con balcón. Pidió planos y formas de pago.' }
  ]},
  { id:'p2', name:'Diego Fernández', phone:'5493624000002', email:'', source:'WhatsApp', projects:['torre-natalini', 'marq-collection'], interest:'Inversión', status:'Información enviada', notes:'Inversor. Compara ingresar en pozo en MARQ Collection con comprar terminado en Torre Natalini.', nextAction:{ text:'Preguntar si revisó el brochure de inversión', date:daysFromToday(-2) }, history:[
    { date:daysFromToday(-12), channel:'WhatsApp', note:'Pidió información para invertir en pozo.' },
    { date:daysFromToday(-7), channel:'Email', note:'Se le envió el brochure con precios y plazos de entrega de ambos proyectos.' }
  ]},
  { id:'p3', name:'Paula Gómez', phone:'5493624000003', email:'paula.gomez@correo.com', source:'Facebook', projects:['marq-collection'], interest:'Vivienda propia', status:'Visita agendada', notes:'Viene con su pareja. Tienen un perro: contarle sobre los espacios comunes.', nextAction:{ text:'Visita al showroom con su pareja (18 h)', date:daysFromToday(1) }, history:[
    { date:daysFromToday(-15), channel:'Facebook', note:'Comentó una publicación de MARQ Collection y se la contactó por privado.' },
    { date:daysFromToday(-5), channel:'WhatsApp', note:'Coordinamos una visita al showroom.' }
  ]},
  { id:'p4', name:'Julián Benítez', phone:'5493624000004', email:'', source:'Visita', projects:['casa-bdn'], interest:'Vivienda propia', status:'En conversación', notes:'Necesita vender su casa actual para poder comprar.', nextAction:{ text:'Llamar para saber si ya tasó su casa actual', date:daysFromToday(0) }, history:[
    { date:daysFromToday(-20), channel:'Visita', note:'Recorrió Brisas del Norte un sábado. Le gustó la casa modelo.' },
    { date:daysFromToday(-8), channel:'Llamada', note:'Está esperando la tasación de su casa para definir.' }
  ]},
  { id:'p5', name:'Carla Ruiz', phone:'5493624000005', email:'carla.ruiz@correo.com', source:'Instagram', projects:['pueblo-mio', 'parque-arboledas'], interest:'Inversión', status:'En negociación', notes:'Quiere dos lotes contiguos. Pide condiciones para pagar en 12 cuotas.', nextAction:{ text:'Enviar propuesta de pago por dos lotes', date:daysFromToday(-1) }, history:[
    { date:daysFromToday(-25), channel:'Instagram', note:'Consultó por lotes con vista a la laguna.' },
    { date:daysFromToday(-10), channel:'Visita', note:'Visitó Pueblo Mío y Parque Arboledas. Prefiere lotes contiguos.' },
    { date:daysFromToday(-3), channel:'WhatsApp', note:'Pidió una propuesta por dos lotes en 12 cuotas.' }
  ]},
  { id:'p6', name:'Marcos Vera', phone:'5493624000006', email:'', source:'WhatsApp', projects:['parque-arboledas'], interest:'A definir', status:'Nuevo contacto', notes:'', nextAction:null, history:[
    { date:daysFromToday(-2), channel:'WhatsApp', note:'Preguntó precios de lotes. Todavía no sabe si es para vivir o para invertir.' }
  ]},
  { id:'p7', name:'Lucía Sosa', phone:'5493624000007', email:'lucia.sosa@correo.com', source:'Llamada', projects:['torre-natalini'], interest:'Inversión', status:'Nuevo contacto', notes:'Busca una unidad de un dormitorio para alquilar.', nextAction:{ text:'Enviar tipologías de un dormitorio disponibles', date:daysFromToday(3) }, history:[
    { date:daysFromToday(-1), channel:'Llamada', note:'Llamó a la oficina por unidades de un dormitorio.' }
  ]},
  { id:'p8', name:'Roberto Díaz', phone:'5493624000008', email:'', source:'Presencial', projects:['casa-bdn'], interest:'Vivienda propia', status:'Cerró operación', notes:'Firmó boleto. Mantener el vínculo: puede recomendarnos.', nextAction:null, history:[
    { date:daysFromToday(-40), channel:'Presencial', note:'Se acercó a la oficina por Casas BDN.' },
    { date:daysFromToday(-6), channel:'Presencial', note:'Firmó el boleto de compraventa.' }
  ]}
];

// Actividad de ejemplo en los showrooms personales (horas atrás desde ahora).
const hoursAgo = hours => new Date(Date.now() - hours * 3600000).toISOString();
const initialSignals = {
  p1: [
    { at: hoursAgo(27), type: 'open', label: 'Abrió su showroom' },
    { at: hoursAgo(27), type: 'profile', label: 'Eligió “Busco mi próxima vivienda”' },
    { at: hoursAgo(26), type: 'team', projectId: 'torre-natalini', label: 'Conoció al equipo de Torre Natalini' },
    { at: hoursAgo(21), type: 'visit', projectId: 'torre-natalini', label: 'Pidió agendar una visita por Torre Natalini' }
  ],
  p2: [
    { at: hoursAgo(3), type: 'open', label: 'Abrió su showroom' },
    { at: hoursAgo(3), type: 'profile', label: 'Eligió “Busco oportunidades de inversión”' },
    { at: hoursAgo(2), type: 'team', projectId: 'marq-collection', label: 'Conoció al equipo de MARQ Collection' },
    { at: hoursAgo(2), type: 'team', projectId: 'torre-natalini', label: 'Conoció al equipo de Torre Natalini' }
  ],
  p6: [
    { at: hoursAgo(40), type: 'open', label: 'Abrió su showroom' }
  ]
};
initialPeople.forEach(person => { person.signals = initialSignals[person.id] || []; });

const loadList = (key, fallback) => {
  try { const value = JSON.parse(localStorage.getItem(key)); if (Array.isArray(value)) return value; } catch {}
  return structuredClone(fallback);
};
let projects = loadList(STORAGE_KEYS.projects, initialProjects);
let people = loadList(STORAGE_KEYS.people, initialPeople);
const savePeople = () => { try { localStorage.setItem(STORAGE_KEYS.people, JSON.stringify(people)); } catch {} };
const saveData = () => {
  try { localStorage.setItem(STORAGE_KEYS.projects, JSON.stringify(projects)); } catch {}
  savePeople();
};
const loadWebStats = () => {
  try { return { vivienda: 0, inversion: 0, visit: 0, ...JSON.parse(localStorage.getItem(STORAGE_KEYS.webStats)) }; } catch { return { vivienda: 0, inversion: 0, visit: 0 }; }
};
const countWebEvent = key => {
  const stats = loadWebStats(); stats[key]++;
  try { localStorage.setItem(STORAGE_KEYS.webStats, JSON.stringify(stats)); } catch {}
};

const grid = document.querySelector('#projects-grid');
const modal = document.querySelector('#team-modal');
const teamGrid = document.querySelector('#team-grid');
const companyView = document.querySelector('#company-view');
const modeToggle = document.querySelector('#mode-toggle');
let previousFocus = null, companyMode = false;
let view = { name: 'agenda' };
let contactFilters = { query: '', project: '', status: '' };
let followup = null; // Recontacto por novedad: { projectId, newsId, selected, queue, index, sent }
let currentProfile = null;
const showroomId = new URLSearchParams(location.search).get('showroom');

const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
const initials = name => name.split(' ').filter(Boolean).map(part => part[0]).slice(0, 2).join('').toUpperCase();
const projectById = id => projects.find(project => project.id === id);
const personById = id => people.find(person => person.id === id);
const projectNames = person => person.projects.map(id => projectById(id)?.name).filter(Boolean);
const interestedIn = projectId => people.filter(person => person.projects.includes(projectId));
const isOpen = person => !CLOSED_STATUSES.includes(person.status);
const lastInteraction = person => person.history[person.history.length - 1];
const whatsappUrl = (phone, text = '') => `https://wa.me/${phone}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
const statusChip = status => `<span class="status-chip ${STATUS_TONES[status] || ''}">${esc(status)}</span>`;
const avatar = (name, extra = '') => `<span class="company-avatar ${extra}">${esc(initials(name))}</span>`;
const options = (list, selected) => list.map(item => `<option ${item === selected ? 'selected' : ''}>${esc(item)}</option>`).join('');
const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'instant' });
const firstName = person => person.name.split(' ')[0];
const isStrong = signal => STRONG_SIGNALS.includes(signal.type);
const hoursSince = at => (Date.now() - new Date(at)) / 3600000;
const showroomUrl = person => `${location.href.split(/[?#]/)[0]}?showroom=${encodeURIComponent(person.id)}`;
function relativeTime(at) {
  const minutes = Math.round((Date.now() - new Date(at)) / 60000);
  if (minutes < 1) return 'Recién';
  if (minutes < 60) return `Hace ${minutes} min`;
  if (minutes < 60 * 24) return `Hace ${Math.round(minutes / 60)} h`;
  return relativeDay(isoDate(new Date(at)));
}
const capitalize = text => text.charAt(0).toUpperCase() + text.slice(1);

function toast(message) {
  const element = document.createElement('div');
  element.className = 'toast';
  element.setAttribute('role', 'status');
  element.textContent = message;
  document.body.append(element);
  setTimeout(() => element.remove(), 2600);
}

/* ---------- Vista cliente y showroom personal ---------- */

// Un showroom es la misma web abierta con ?showroom=<id de contacto>: el link que la vendedora
// le manda a alguien que ya escribió. Lo que haga ahí se registra en su ficha de MARQ Contigo.
const showroomPerson = () => showroomId ? personById(showroomId) : null;
const activeFilter = () => document.querySelector('.filter.active')?.dataset.filter || 'Todos';
const listJoin = items => items.length > 1 ? `${items.slice(0, -1).join(', ')} y ${items[items.length - 1]}` : items[0] || '';

function renderProjects(filter = activeFilter()) {
  const displayOrder = initialProjects.map(project => project.id);
  const person = showroomPerson();
  const asked = project => Boolean(person?.projects.includes(project.id));
  const recommended = project => Boolean(currentProfile && detailFor(project).profiles.includes(currentProfile));
  const rank = project => (asked(project) ? 0 : 4) + (recommended(project) ? 0 : 2) + (detailFor(project).forSale ? 0 : 1);
  const visible = projects.filter(project => filter === 'Todos' || project.category === filter)
    .sort((a, b) => rank(a) - rank(b) || displayOrder.indexOf(a.id) - displayOrder.indexOf(b.id));
  const total = String(visible.length).padStart(2, '0');
  grid.innerHTML = visible.length ? visible.map((project, index) => {
    const detail = detailFor(project);
    const flag = asked(project) ? 'Consultaste por este proyecto' : recommended(project) ? PROFILES[currentProfile].tab : '';
    const hint = currentProfile === 'inversion' ? `${STAGES[detail.stage].label} · ${STAGES[detail.stage].short}` : currentProfile === 'vivienda' ? detail.livingHint : '';
    const statusTone = /pozo|preventa/i.test(project.status) ? 'is-presale' : /obra|construcción|desarrollo/i.test(project.status) ? 'is-building' : /venta|unidades/i.test(project.status) ? 'is-selling' : '';
    return `<article class="project-card" id="${esc(project.id)}" style="--i: ${index % 3}">
    <div class="project-image-wrap"><img class="project-image" src="${esc(project.image)}" alt="${esc(project.imageAlt)}" loading="lazy">${flag ? `<span class="card-flag">${esc(flag)}</span>` : ''}<span class="card-status ${statusTone}">${esc(project.status)}</span><span class="image-count">${String(index + 1).padStart(2, '0')} / ${total}</span></div>
    <div class="project-info"><div class="project-meta"><span class="project-category">${esc(project.category)}${project.year ? ` · ${esc(project.year)}` : ''}</span><span class="project-year">${esc(project.location)}</span></div>
    <h2 class="project-title">${esc(project.name)}</h2><p class="project-description">${esc(project.description)}</p>
    ${project.facts?.length ? `<ul class="project-facts">${project.facts.map(fact => `<li>${esc(fact)}</li>`).join('')}</ul>` : ''}${hint && detail.forSale ? `<p class="profile-hint">${esc(hint)}</p>` : ''}
    <div class="project-actions"><button class="team-link" type="button" data-team="${esc(project.id)}">Conocé quiénes están detrás <span>↗</span></button>${detail.forSale ? '' : `<span class="project-done">${/terminad/i.test(project.status) ? 'Obra realizada' : 'Próximamente'}</span>`}</div></div></article>`;
  }).join('')
    : `<div class="projects-empty"><p>Todavía no hay proyectos publicados en <strong>${esc(filter)}</strong>.</p><button class="text-link" type="button" data-filter-reset>Ver todos los proyectos <span>↗</span></button></div>`;
  document.querySelector('#end-note-count').textContent = visible.length ? `01 — ${total}` : '00';
}

function openTeam(id) {
  const project = projectById(id); if (!project) return;
  previousFocus = document.activeElement;
  modal.querySelector('#modal-title').textContent = project.name;
  modal.querySelector('.modal-category').textContent = project.category;
  modal.querySelector('.modal-index').textContent = `PROYECTO ${String(projects.indexOf(project) + 1).padStart(2, '0')} / ${String(projects.length).padStart(2, '0')}`;
  teamGrid.innerHTML = `${project.team.map(person => `<article class="person-card">${person.image ? `<img class="person-photo" src="${esc(person.image)}" alt="Retrato de ${esc(person.name)}" loading="lazy">` : `<div class="person-photo monogram" aria-hidden="true">${esc(initials(person.name.replace(/^Arq\. /, '')))}</div>`}<div class="person-content"><span class="person-role">${esc(person.role)}</span><h4 class="person-name">${esc(person.name)}</h4><p class="person-description">${esc(person.description)}</p></div></article>`).join('')}
    <section class="public-updates"><span class="eyebrow"><span class="eyebrow-line"></span> NOVEDADES DEL PROYECTO</span><h3>Lo último de ${esc(project.name)}</h3>${project.news?.length ? project.news.map(item => `<article class="update-card"><span>${esc(formatDate(item.date))} · ${esc(item.type)}</span><h4>${esc(item.title)}</h4><p>${esc(item.body)}</p></article>`).join('') : '<p class="updates-empty">Pronto compartiremos novedades de este proyecto.</p>'}</section>`;
  modal.classList.add('open'); modal.setAttribute('aria-hidden', 'false'); document.body.classList.add('modal-open'); modal.querySelector('.modal-close').focus();
  if (showroomPerson()) logSignal('team', id, `Conoció al equipo de ${project.name}`);
}
function closeModal() { modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'true'); document.body.classList.remove('modal-open'); if (previousFocus) previousFocus.focus(); }

function syncProfileCards() {
  document.querySelectorAll('.profile-card').forEach(card => {
    const selected = card.dataset.profile === currentProfile;
    card.classList.toggle('selected', selected);
    card.setAttribute('aria-pressed', String(selected));
  });
}

// Clasificación silenciosa: elegir un perfil ordena los proyectos y, en un showroom, clasifica al contacto.
function setProfile(profile) {
  if (profile === currentProfile) return;
  currentProfile = profile;
  syncProfileCards();
  if (showroomPerson()) {
    logSignal('profile', null, `Eligió “${PROFILES[profile].label}”`, person => {
      person.interest = PROFILES[profile].interest;
    });
  } else countWebEvent(profile);
  renderProjects();
}

function logSignal(type, projectId, label, update) {
  // Se relee lo guardado para no pisar cambios hechos en MARQ Contigo desde otra pestaña.
  people = loadList(STORAGE_KEYS.people, initialPeople);
  const person = showroomPerson(); if (!person) return;
  person.signals = person.signals || [];
  person.signals.push({ at: new Date().toISOString(), type, projectId, label });
  update?.(person);
  savePeople();
}

function requestVisit(projectId) {
  const project = projectById(projectId);
  logSignal('visit', projectId || null, `Pidió agendar una visita${project ? ` por ${project.name}` : ''}`, person => {
    person.nextAction = { text: `Coordinar la visita al estudio que pidió desde su showroom${project ? ` (${project.name})` : ''}`, date: todayIso() };
  });
  renderShowroomBanner();
}

function renderShowroomBanner() {
  const person = showroomPerson(); if (!person) return;
  const banner = document.querySelector('#showroom-banner');
  const names = projectNames(person);
  const requested = person.signals?.some(signal => signal.type === 'visit');
  banner.hidden = false;
  banner.innerHTML = `<div><span class="eyebrow"><span class="eyebrow-line"></span> TU SHOWROOM MARQ</span><h2>Hola, ${esc(firstName(person))}. Preparamos este espacio para vos.</h2><p>Acá está todo sobre ${names.length ? esc(listJoin(names)) : 'nuestros proyectos'}: las personas que lo hacen posible, en qué etapa está y dónde queda en la ciudad. Cuando quieras, lo vemos en persona.</p></div>
    <div class="showroom-side">${requested ? '<p class="visit-done">Listo. Te escribimos para coordinar la visita.</p>' : '<button class="team-link" type="button" data-request-visit="">Agendar una visita al estudio <span>↗</span></button>'}<small>Registramos qué proyectos mirás en este espacio para asesorarte mejor. Solo lo ve el equipo de MARQ.</small></div>`;
}

function initShowroom() {
  const person = showroomPerson(); if (!person) return;
  document.body.classList.add('showroom-mode');
  document.title = `Showroom de ${firstName(person)} — Estudio MARQ`;
  const known = Object.keys(PROFILES).find(key => PROFILES[key].interest === person.interest);
  if (known) { currentProfile = known; syncProfileCards(); }
  renderShowroomBanner();
  let alreadyOpened = false;
  try { alreadyOpened = sessionStorage.getItem(`marq-showroom-${person.id}`) === '1'; sessionStorage.setItem(`marq-showroom-${person.id}`, '1'); } catch {}
  if (!alreadyOpened) logSignal('open', null, 'Abrió su showroom');
}

document.addEventListener('click', event => {
  if (companyView.contains(event.target)) return;
  const target = event.target.closest('[data-profile],[data-team],[data-request-visit],[data-web-visit],[data-filter-reset]');
  if (!target) return;
  if (target.dataset.profile) setProfile(target.dataset.profile);
  else if (target.dataset.team) openTeam(target.dataset.team);
  else if (target.hasAttribute('data-request-visit')) requestVisit(target.dataset.requestVisit);
  else if (target.hasAttribute('data-web-visit')) countWebEvent('visit');
  else if (target.hasAttribute('data-filter-reset')) document.querySelector('.filter[data-filter="Todos"]').click();
});

/* ---------- MARQ Contigo (vista empresa) ---------- */

function setMode(enabled) {
  companyMode = enabled;
  document.body.classList.toggle('company-mode', enabled);
  document.querySelector('main').hidden = enabled;
  document.querySelector('footer').hidden = enabled;
  document.querySelector('.whatsapp').hidden = enabled;
  companyView.hidden = !enabled;
  followup = null;
  if (enabled) { view = { name: 'agenda' }; renderCompany(); }
  scrollToTop();
}

function go(nextView) { view = nextView; renderCompany(); scrollToTop(); }

function agendaGroups() {
  const withAction = people.filter(person => person.nextAction).sort((a, b) => a.nextAction.date.localeCompare(b.nextAction.date));
  return {
    overdue: withAction.filter(person => dayDiff(person.nextAction.date) < 0),
    today: withAction.filter(person => dayDiff(person.nextAction.date) === 0),
    upcoming: withAction.filter(person => dayDiff(person.nextAction.date) > 0),
    withoutNext: people.filter(person => !person.nextAction && isOpen(person))
  };
}

function renderCompany() {
  if ((view.name === 'proyecto' && !projectById(view.id)) || (view.name === 'contacto' && !personById(view.id))) view = { name: 'agenda' };
  const agenda = agendaGroups();
  const pending = agenda.overdue.length + agenda.today.length;
  const titles = { agenda: 'Agenda', contactos: 'Contactos', proyecto: projectById(view.id)?.name, contacto: personById(view.id)?.name };
  const navItem = (name, label, count, alert = false) => `<button class="company-nav-item ${view.name === name || (name === 'contactos' && view.name === 'contacto') ? 'selected' : ''}" data-go="${name}">${label}<span class="nav-count ${alert ? 'alert' : ''}">${count}</span></button>`;
  const content = view.name === 'contactos' ? renderContacts()
    : view.name === 'proyecto' ? renderProject(projectById(view.id))
    : view.name === 'contacto' ? renderContact(personById(view.id))
    : renderAgenda(agenda);
  companyView.innerHTML = `<div class="company-shell">
    <aside class="company-sidebar" aria-label="Navegación de MARQ Contigo">
      <div class="company-brand"><b>marQ</b><span>CONTIGO</span></div>
      <p class="company-label">Seguimiento</p>
      <nav class="company-nav">${navItem('agenda', 'Agenda', pending, pending > 0)}${navItem('contactos', 'Contactos', people.length)}</nav>
      <p class="company-label">Proyectos</p>
      <nav class="company-nav">${projects.filter(project => detailFor(project).forSale || interestedIn(project.id).length).map(project => `<button class="company-nav-item ${view.name === 'proyecto' && view.id === project.id ? 'selected' : ''}" data-go="proyecto" data-id="${esc(project.id)}"><span class="project-dot"></span>${esc(project.name)}<span class="nav-count">${interestedIn(project.id).length}</span></button>`).join('')}</nav>
      <div class="company-user">${avatar('Equipo Comercial')}<div>Equipo comercial<small>Datos de ejemplo</small></div></div>
      <button class="sidebar-reset" data-action="reset">Restablecer datos de ejemplo</button>
    </aside>
    <div class="company-main">
      <div class="company-topbar"><span>MARQ Contigo / <b>${esc(titles[view.name] || '')}</b></span><div class="topbar-actions"><span class="demo-label">Prototipo</span><button class="admin-secondary admin-small" data-action="exit">Ver sitio público ↗</button></div></div>
      <div class="company-content">${content}</div>
    </div>
  </div>`;
}

function taskRow(person) {
  return `<article class="task-row">
    <button class="row-link" data-go="contacto" data-id="${esc(person.id)}">${avatar(person.name)}<span class="task-copy"><b>${esc(person.name)}</b><span>${esc(person.nextAction.text)}</span><small>${esc(projectNames(person).join(' · ') || 'Sin proyecto')} · ${esc(person.status)}</small></span></button>
    <span class="due-chip ${dueTone(person.nextAction.date)}">${relativeDay(person.nextAction.date)}</span>
    <div class="task-actions"><a class="admin-secondary admin-small" href="${esc(whatsappUrl(person.phone))}" target="_blank" rel="noopener">WhatsApp ↗</a><button class="admin-primary admin-small" data-action="complete" data-id="${esc(person.id)}">Registrar</button></div>
  </article>`;
}

function renderAgenda(agenda) {
  const dateLabel = capitalize(new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date()));
  const group = (title, list, tone) => list.length ? `<h3 class="group-title">${title}<span class="group-count ${tone}">${list.length}</span></h3>${list.map(taskRow).join('')}` : '';
  const hasTasks = agenda.overdue.length + agenda.today.length + agenda.upcoming.length > 0;
  const signals = people.flatMap(person => (person.signals || []).map((signal, order) => ({ person, signal, order })))
    .filter(({ signal }) => signal.type !== 'open' && hoursSince(signal.at) < 24 * 7)
    .sort((a, b) => b.signal.at.localeCompare(a.signal.at) || b.order - a.order);
  const strongCount = signals.filter(({ signal }) => isStrong(signal)).length;
  const web = loadWebStats();
  return `<div class="company-heading"><div><span class="eyebrow">${esc(dateLabel)}</span><h1>Agenda de seguimiento</h1><p>Los próximos pasos con cada contacto, ordenados por fecha. Registrá cada conversación para que ninguna relación quede sin continuidad.</p></div><div class="heading-actions"><button class="admin-primary" data-action="new-contact">＋ Nuevo contacto</button></div></div>
    <div class="company-stats">
      <article class="${agenda.overdue.length ? 'alert' : ''}"><span>Vencidas</span><b>${agenda.overdue.length}</b></article>
      <article><span>Para hoy</span><b>${agenda.today.length}</b></article>
      <article class="${strongCount ? 'signal' : ''}"><span>Señales de showroom (7 días)</span><b>${strongCount}</b></article>
      <article class="${agenda.withoutNext.length ? 'warn' : ''}"><span>Sin próximo paso</span><b>${agenda.withoutNext.length}</b></article>
    </div>
    <div class="company-columns">
      <section class="admin-panel"><div class="admin-panel-head"><div><h2>Próximas acciones</h2><p>Qué hay que hacer con cada contacto y cuándo.</p></div></div>
        ${hasTasks ? group('Vencidas', agenda.overdue, 'overdue') + group('Para hoy', agenda.today, 'today') + group('Próximos días', agenda.upcoming, '') : '<p class="admin-empty">No hay acciones pendientes.</p>'}
      </section>
      <div class="admin-stack">
        <section class="admin-panel"><div class="admin-panel-head"><div><h2>En sus showrooms</h2><p>Lo que hicieron tus contactos en su link personal. Las señales fuertes piden que alguien les escriba.</p></div></div>
          ${signals.length ? signals.slice(0, 6).map(({ person, signal }) => `<div class="person-row signal-row ${isStrong(signal) ? 'strong' : ''}"><button class="row-link" data-go="contacto" data-id="${esc(person.id)}">${avatar(person.name)}<span class="associated-copy"><b>${esc(person.name)}</b><small>${esc(signal.label)} · ${esc(relativeTime(signal.at))}</small></span></button>${isStrong(signal) ? `<a class="admin-secondary admin-small" href="${esc(whatsappUrl(person.phone))}" target="_blank" rel="noopener">Escribir ↗</a>` : ''}</div>`).join('') : '<p class="admin-empty">Todavía no hay actividad esta semana. Mandá el showroom desde la ficha de cada contacto.</p>'}
        </section>
        <section class="admin-panel"><div class="admin-panel-head"><div><h2>Sin próximo paso</h2><p>Contactos abiertos que podrían perderse si nadie los retoma.</p></div></div>
          ${agenda.withoutNext.length ? agenda.withoutNext.map(person => `<div class="person-row"><button class="row-link" data-go="contacto" data-id="${esc(person.id)}">${avatar(person.name)}<span class="associated-copy"><b>${esc(person.name)}</b><small>${esc(projectNames(person).join(' · ') || 'Sin proyecto')} · ${esc(person.status)}</small></span></button><button class="admin-secondary admin-small" data-action="set-next" data-id="${esc(person.id)}">Definir paso</button></div>`).join('') : '<p class="admin-empty">Todos los contactos abiertos tienen un próximo paso.</p>'}
        </section>
        <section class="admin-panel"><div class="admin-panel-head"><div><h2>Sitio web · visitas anónimas</h2><p>Sin datos personales: sirve para medir, no para contactar.</p></div></div>
          <div class="web-stats"><div><b>${web.vivienda}</b><span>Eligieron vivienda</span></div><div><b>${web.inversion}</b><span>Eligieron inversión</span></div><div><b>${web.visit}</b><span>Pidieron visita por WhatsApp</span></div></div>
        </section>
      </div>
    </div>`;
}

function contactRows() {
  const query = contactFilters.query.trim().toLowerCase();
  const list = people.filter(person => (!contactFilters.project || person.projects.includes(contactFilters.project))
    && (!contactFilters.status || person.status === contactFilters.status)
    && (!query || [person.name, person.phone, person.notes, person.interest, ...projectNames(person)].join(' ').toLowerCase().includes(query)));
  if (!list.length) return '<tr class="empty-row"><td colspan="5"><p class="admin-empty">No hay contactos que coincidan con la búsqueda.</p></td></tr>';
  return list.map(person => {
    const last = lastInteraction(person);
    return `<tr data-go="contacto" data-id="${esc(person.id)}" tabindex="0">
      <td><span class="cell-person">${avatar(person.name)}<span><b>${esc(person.name)}${(person.signals || []).some(signal => isStrong(signal) && hoursSince(signal.at) < 72) ? '<span class="signal-dot" title="Actividad reciente en su showroom"></span>' : ''}</b><small class="cell-sub">${esc(person.interest)}</small></span></span></td>
      <td><span class="chip-list">${projectNames(person).map(name => `<span class="project-chip">${esc(name)}</span>`).join('') || '<span class="cell-sub">—</span>'}</span></td>
      <td>${statusChip(person.status)}</td>
      <td>${person.nextAction ? `<span class="cell-next">${esc(person.nextAction.text)}</span><span class="due-chip ${dueTone(person.nextAction.date)}">${relativeDay(person.nextAction.date)}</span>` : '<span class="cell-sub">Sin próximo paso</span>'}</td>
      <td>${last ? `${esc(relativeDay(last.date))}<small class="cell-sub">${esc(last.channel)}</small>` : '—'}</td>
    </tr>`;
  }).join('');
}

function renderContacts() {
  return `<div class="company-heading"><div><span class="eyebrow">MARQ Contigo</span><h1>Contactos</h1><p>Cada persona con sus proyectos de interés, el estado de la conversación y el próximo paso.</p></div><div class="heading-actions"><button class="admin-primary" data-action="new-contact">＋ Nuevo contacto</button></div></div>
    <section class="admin-panel">
      <div class="filter-bar">
        <label class="people-search"><span aria-hidden="true">⌕</span><input id="contact-search" type="search" value="${esc(contactFilters.query)}" placeholder="Buscar por nombre, teléfono o nota" aria-label="Buscar contactos"></label>
        <select id="contact-project" aria-label="Filtrar por proyecto"><option value="">Todos los proyectos</option>${projects.map(project => `<option value="${esc(project.id)}" ${project.id === contactFilters.project ? 'selected' : ''}>${esc(project.name)}</option>`).join('')}</select>
        <select id="contact-status" aria-label="Filtrar por estado"><option value="">Todos los estados</option>${options(STATUSES, contactFilters.status)}</select>
      </div>
      <table class="contacts-table"><thead><tr><th>Contacto</th><th>Proyectos</th><th>Estado</th><th>Próximo paso</th><th>Última interacción</th></tr></thead><tbody id="contacts-body">${contactRows()}</tbody></table>
    </section>`;
}

function renderContact(person) {
  const history = [...person.history].reverse();
  const relatedNews = projects.filter(project => person.projects.includes(project.id))
    .flatMap(project => (project.news || []).map(news => ({ project, news })))
    .sort((a, b) => b.news.date.localeCompare(a.news.date)).slice(0, 3);
  const nextCard = person.nextAction
    ? `<section class="next-card"><span class="eyebrow">Próximo paso · ${relativeDay(person.nextAction.date)}</span><h3>${esc(person.nextAction.text)}</h3><p>${esc(formatDate(person.nextAction.date))}</p><div class="next-actions"><button class="admin-primary" data-action="complete" data-id="${esc(person.id)}">Registrar lo que pasó</button><button class="admin-link" data-action="set-next" data-id="${esc(person.id)}">Reprogramar</button></div></section>`
    : `<section class="next-card empty"><span class="eyebrow">Próximo paso</span><h3>Este contacto no tiene un próximo paso.</h3><p>Definí qué hacer y cuándo, para que la relación no pierda continuidad.</p><div class="next-actions"><button class="admin-primary" data-action="set-next" data-id="${esc(person.id)}">Definir próximo paso</button></div></section>`;
  return `<button class="admin-back" data-go="contactos">← Volver a contactos</button>
    <div class="contact-header">${avatar(person.name, 'large')}<div><span class="eyebrow">Contacto desde ${esc(formatDate(person.history[0]?.date))} · ${esc(person.source)}</span><h1>${esc(person.name)}</h1><div class="contact-meta">+${esc(person.phone)}${person.email ? ` · ${esc(person.email)}` : ''}</div></div>
      <div class="heading-actions"><label class="status-field"><span>Estado</span><select id="contact-status-select" class="status-select">${options(STATUSES, person.status)}</select></label><a class="admin-secondary" href="${esc(whatsappUrl(person.phone))}" target="_blank" rel="noopener">WhatsApp ↗</a><button class="admin-secondary" data-action="edit-contact" data-id="${esc(person.id)}">Editar datos</button></div></div>
    <div class="company-columns">
      <div class="admin-stack">
        ${nextCard}
        <section class="admin-panel"><div class="admin-panel-head"><div><h2>Historial</h2><p>${history.length} ${history.length === 1 ? 'interacción registrada' : 'interacciones registradas'}.</p></div><button class="admin-secondary admin-small" data-action="log" data-id="${esc(person.id)}">＋ Registrar interacción</button></div>
          <ol class="timeline">${history.map(item => `<li><span class="timeline-meta">${esc(formatDate(item.date))} · ${esc(item.channel)}</span><p>${esc(item.note)}</p></li>`).join('')}</ol>
        </section>
      </div>
      <div class="admin-stack">
        ${showroomPanel(person)}
        <section class="admin-panel"><div class="admin-panel-head"><div><h2>Datos del contacto</h2></div></div>
          <dl class="data-list">
            <div><dt>Proyectos de interés</dt><dd class="chip-list">${person.projects.map(id => projectById(id) ? `<button class="project-chip" data-go="proyecto" data-id="${esc(id)}">${esc(projectById(id).name)}</button>` : '').join('') || 'Sin proyecto asignado'}</dd></div>
            <div><dt>Busca</dt><dd>${esc(person.interest)}${(person.signals || []).some(signal => signal.type === 'profile') ? ' <span class="auto-tag">Lo eligió en su showroom</span>' : ''}</dd></div>
            <div><dt>Primer contacto</dt><dd>${esc(person.source)}</dd></div>
            <div><dt>Notas</dt><dd>${esc(person.notes) || 'Sin notas.'}</dd></div>
          </dl>
        </section>
        <section class="admin-panel"><div class="admin-panel-head"><div><h2>Novedades de sus proyectos</h2><p>Motivos para volver a escribirle.</p></div></div>
          ${relatedNews.length ? relatedNews.map(({ project, news }) => `<article class="admin-update"><span>${esc(formatDate(news.date))} · ${esc(project.name)}</span><h3>${esc(news.title)}</h3></article>`).join('') : '<p class="admin-empty">Sus proyectos todavía no tienen novedades.</p>'}
        </section>
      </div>
    </div>`;
}

function showroomPanel(person) {
  const url = showroomUrl(person);
  const names = projectNames(person);
  const message = `Hola ${firstName(person)}, ¿cómo estás? Te preparé un espacio con toda la información de ${names.length ? listJoin(names) : 'nuestros proyectos'}: precios, financiación y el equipo que lo hace posible. Miralo cuando quieras: ${url}`;
  const signals = [...(person.signals || [])].reverse();
  return `<section class="admin-panel showroom-panel"><div class="admin-panel-head"><div><h2>Showroom personal</h2><p>Un link propio para ${esc(firstName(person))}: lo que haga ahí se registra en esta ficha.</p></div></div>
    <div class="showroom-link"><input readonly value="${esc(url)}" aria-label="Link del showroom de ${esc(person.name)}"><button class="admin-secondary admin-small" data-action="copy-link" data-id="${esc(person.id)}">Copiar</button></div>
    <div class="showroom-actions"><a class="admin-primary admin-small" href="${esc(whatsappUrl(person.phone, message))}" target="_blank" rel="noopener">Enviar por WhatsApp ↗</a><a class="admin-secondary admin-small" href="${esc(url)}" target="_blank" rel="noopener">Ver como cliente ↗</a></div>
    <h3 class="group-title">Lo que hizo en su showroom</h3>
    ${signals.length ? `<ul class="signal-list">${signals.map(signal => `<li class="${isStrong(signal) ? 'strong' : ''}"><span>${esc(signal.label)}</span><small>${esc(relativeTime(signal.at))}</small></li>`).join('')}</ul>` : '<p class="admin-empty">Todavía no abrió su showroom.</p>'}
  </section>`;
}

function renderProject(project) {
  const interested = interestedIn(project.id);
  const lastNews = project.news?.[0];
  return `<button class="admin-back" data-go="agenda">← Volver a la agenda</button>
    <div class="company-heading"><div><span class="eyebrow">${esc(project.category)} · ${esc(project.year)}</span><h1>${esc(project.name)}</h1><p>${esc(project.description)}</p></div><div class="heading-actions"><button class="admin-primary" data-action="add-news">＋ Publicar novedad</button></div></div>
    <div class="company-stats three"><article><span>Contactos interesados</span><b>${interested.length}</b></article><article><span>Conversaciones abiertas</span><b>${interested.filter(isOpen).length}</b></article><article><span>Última novedad</span><b>${lastNews ? esc(formatDate(lastNews.date)) : '—'}</b></article></div>
    ${followup && followup.projectId === project.id ? renderFollowup(project) : ''}
    <div class="company-columns">
      <section class="admin-panel"><div class="admin-panel-head"><div><h2>Contactos interesados</h2><p>Personas que consultaron por este proyecto.</p></div></div>
        ${interested.length ? interested.map(person => `<button class="person-row row-link" data-go="contacto" data-id="${esc(person.id)}">${avatar(person.name)}<span class="associated-copy"><b>${esc(person.name)}</b><small>${esc(person.interest)} · ${person.nextAction ? `Próximo: ${esc(person.nextAction.text)}` : 'Sin próximo paso'}</small></span>${statusChip(person.status)}</button>`).join('') : '<p class="admin-empty">Todavía no hay contactos asociados a este proyecto.</p>'}
      </section>
      <section class="admin-panel"><div class="admin-panel-head"><div><h2>Novedades publicadas</h2><p>Visibles para los clientes en la ficha pública del proyecto.</p></div></div>
        ${project.news?.length ? project.news.map(item => `<article class="admin-update"><span>${esc(formatDate(item.date))} · ${esc(item.type)}</span><h3>${esc(item.title)}</h3><p>${esc(item.body)}</p><button class="admin-link" data-action="start-followup" data-news="${esc(item.id)}">Avisar a interesados →</button></article>`).join('') : '<div class="admin-empty">Todavía no hay novedades. Publicá la primera actualización del proyecto.</div>'}
      </section>
    </div>`;
}

function renderFollowup(project) {
  const news = project.news.find(item => item.id === followup.newsId);
  const candidates = interestedIn(project.id);
  const close = '<button class="dialog-close" data-action="close-followup" aria-label="Cerrar recontacto">×</button>';
  if (!followup.queue.length) {
    const count = followup.selected.length;
    const allSelected = candidates.length > 0 && count === candidates.length;
    return `<section class="admin-panel followup-panel"><div class="admin-panel-head"><div><span class="eyebrow"><span class="eyebrow-line"></span> Novedad: ${esc(news.title)}</span><h2>¿A quién le avisamos?</h2><p>Estas personas consultaron por ${esc(project.name)}. Elegí a quiénes volver a contactar: cada mensaje lo revisás y lo enviás vos.</p></div>${close}</div>
      ${candidates.length ? `<div class="select-list">${candidates.map(person => { const last = lastInteraction(person); return `<label class="person-row select-row"><input type="checkbox" data-select="${esc(person.id)}" ${followup.selected.includes(person.id) ? 'checked' : ''}>${avatar(person.name)}<span class="associated-copy"><b>${esc(person.name)}</b><small>${esc(person.interest)} · Última interacción: ${last ? esc(relativeDay(last.date).toLowerCase()) : '—'}</small></span>${statusChip(person.status)}</label>`; }).join('')}</div>
      <div class="people-actions"><button class="admin-link" data-action="select-all">${allSelected ? 'Quitar selección' : 'Seleccionar todos'}</button><button class="admin-primary" data-action="prepare" ${count ? '' : 'disabled'}>Preparar ${count || ''} ${count === 1 ? 'mensaje' : 'mensajes'} →</button></div>` : '<p class="admin-empty">No hay contactos interesados en este proyecto todavía.</p>'}
    </section>`;
  }
  if (followup.index >= followup.queue.length) {
    return `<section class="admin-panel followup-panel"><div class="admin-panel-head"><div><span class="eyebrow"><span class="eyebrow-line"></span> Recontacto terminado</span><h2>${followup.sent} de ${followup.queue.length} contactos avisados</h2><p>Cada mensaje enviado quedó registrado en el historial del contacto.</p></div><button class="admin-primary" data-action="close-followup">Listo</button></div></section>`;
  }
  const draft = followup.queue[followup.index];
  const person = personById(draft.personId);
  return `<section class="admin-panel followup-panel"><div class="admin-panel-head"><div><span class="eyebrow"><span class="eyebrow-line"></span> Mensaje ${followup.index + 1} de ${followup.queue.length}</span><h2>${esc(person.name)}</h2><p>Revisá y ajustá el mensaje antes de abrir WhatsApp.</p></div>${close}</div>
    <div class="queue-progress"><span style="width:${(followup.index / followup.queue.length) * 100}%"></span></div>
    <textarea class="message-text" id="followup-message" aria-label="Mensaje para ${esc(person.name)}">${esc(draft.message)}</textarea>
    <div class="people-actions"><button class="admin-link" data-action="skip">Saltear este contacto</button><a class="admin-primary" id="followup-send" data-action="send" href="${esc(whatsappUrl(person.phone, draft.message))}" target="_blank" rel="noopener">Abrir WhatsApp y registrar ↗</a></div>
  </section>`;
}

function buildMessage(person, project, news) {
  const title = news.title.charAt(0).toLowerCase() + news.title.slice(1);
  return `Hola ${person.name.split(' ')[0]}, ¿cómo estás? Te escribo de MARQ. Hace un tiempo consultaste por ${project.name} y tenemos una novedad que puede interesarte: ${title}. ¿Querés que te cuente más?`;
}

/* ---------- Formularios ---------- */

const field = (label, control) => `<label>${label}${control}</label>`;
const projectChecks = selected => `<fieldset class="check-group"><legend>Proyectos de interés</legend>${projects.map(project => `<label><input type="checkbox" name="projects" value="${esc(project.id)}" ${selected.includes(project.id) ? 'checked' : ''}> ${esc(project.name)}</label>`).join('')}</fieldset>`;
const nextActionFields = action => `<div class="field-row wide-first">${field('Próximo paso', `<input name="nextText" maxlength="120" value="${esc(action?.text || '')}" placeholder="Ej. Enviar planos y precios">`)}${field('Fecha', `<input type="date" name="nextDate" value="${esc(action?.date || daysFromToday(2))}">`)}</div><p class="field-hint">Dejalo vacío si por ahora no hay nada pendiente.</p>`;
const readNextAction = form => {
  const text = String(form.get('nextText') || '').trim();
  return text ? { text, date: form.get('nextDate') || daysFromToday(2) } : null;
};

function openDialog({ eyebrow = '', title, intro = '', fields, submitLabel, onSubmit }) {
  const backdrop = document.createElement('div');
  backdrop.className = 'update-dialog-backdrop';
  backdrop.innerHTML = `<form class="update-dialog"><div class="admin-panel-head"><div>${eyebrow ? `<span class="eyebrow">${esc(eyebrow)}</span>` : ''}<h2>${esc(title)}</h2></div><button type="button" class="dialog-close" aria-label="Cerrar">×</button></div>${intro ? `<p>${esc(intro)}</p>` : ''}${fields}<div class="dialog-actions"><button type="button" class="admin-secondary" data-dismiss>Cancelar</button><button class="admin-primary" type="submit">${esc(submitLabel)}</button></div></form>`;
  const dismiss = () => backdrop.remove();
  backdrop.addEventListener('click', event => { if (event.target === backdrop) dismiss(); });
  backdrop.querySelectorAll('.dialog-close,[data-dismiss]').forEach(button => button.addEventListener('click', dismiss));
  backdrop.querySelector('form').addEventListener('submit', event => {
    event.preventDefault();
    onSubmit(new FormData(event.currentTarget));
    dismiss(); saveData(); renderCompany();
  });
  document.body.append(backdrop);
  backdrop.querySelector('input:not([type=checkbox]),textarea,select')?.focus();
}

function openLogDialog(person, completing = false) {
  openDialog({
    eyebrow: person.name,
    title: completing ? 'Registrar lo que pasó' : 'Registrar interacción',
    intro: completing ? `Paso pendiente: ${person.nextAction.text}` : 'Anotá qué se habló, para que cualquiera del equipo pueda retomar la conversación.',
    fields: `<div class="field-row">${field('Fecha', `<input type="date" name="date" value="${todayIso()}" required>`)}${field('Canal', `<select name="channel">${options(CHANNELS, 'WhatsApp')}</select>`)}</div>
      ${field('¿Qué pasó?', '<textarea name="note" required maxlength="500" placeholder="Ej. Le envié los planos. Quiere visitar el showroom el sábado."></textarea>')}
      ${field('Estado de la conversación', `<select name="status">${options(STATUSES, person.status)}</select>`)}
      <p class="dialog-section">Próximo paso</p>${nextActionFields(completing ? null : person.nextAction)}`,
    submitLabel: 'Guardar',
    onSubmit: form => {
      person.history.push({ date: form.get('date'), channel: form.get('channel'), note: String(form.get('note')).trim() });
      person.history.sort((a, b) => a.date.localeCompare(b.date));
      person.status = form.get('status');
      person.nextAction = readNextAction(form);
      toast('Interacción registrada');
    }
  });
}

function openNextDialog(person) {
  openDialog({
    eyebrow: person.name,
    title: person.nextAction ? 'Reprogramar próximo paso' : 'Definir próximo paso',
    intro: '¿Qué hay que hacer con este contacto y cuándo?',
    fields: nextActionFields(person.nextAction),
    submitLabel: 'Guardar',
    onSubmit: form => { person.nextAction = readNextAction(form); toast(person.nextAction ? 'Próximo paso guardado' : 'Próximo paso quitado'); }
  });
}

function openContactDialog(person = null) {
  openDialog({
    eyebrow: 'MARQ Contigo',
    title: person ? 'Editar contacto' : 'Nuevo contacto',
    intro: person ? '' : 'Registrá a la persona después del primer contacto, con lo que ya sabés de ella.',
    fields: `${field('Nombre y apellido', `<input name="name" required maxlength="80" value="${esc(person?.name || '')}">`)}
      <div class="field-row">${field('Teléfono (con código de país)', `<input name="phone" required inputmode="tel" value="${esc(person?.phone || '')}" placeholder="5493624…">`)}${field('Email', `<input type="email" name="email" value="${esc(person?.email || '')}" placeholder="Opcional">`)}</div>
      <div class="field-row">${field('Busca', `<select name="interest">${options(INTERESTS, person?.interest || 'A definir')}</select>`)}${field('Primer contacto por', `<select name="source">${options(CHANNELS, person?.source || 'WhatsApp')}</select>`)}</div>
      ${projectChecks(person?.projects || [])}
      ${person ? field('Notas', `<textarea name="notes" maxlength="500">${esc(person.notes)}</textarea>`) : `${field('¿Qué consultó?', '<textarea name="firstNote" required maxlength="500" placeholder="Ej. Preguntó por lotes con vista a la laguna."></textarea>')}<p class="dialog-section">Próximo paso</p>${nextActionFields(null)}`}`,
    submitLabel: person ? 'Guardar cambios' : 'Crear contacto',
    onSubmit: form => {
      const data = { name: String(form.get('name')).trim(), phone: String(form.get('phone')).replace(/\D/g, ''), email: String(form.get('email')).trim(), interest: form.get('interest'), source: form.get('source'), projects: form.getAll('projects') };
      if (person) { Object.assign(person, data, { notes: String(form.get('notes')).trim() }); toast('Contacto actualizado'); return; }
      const created = { id: `p${Date.now()}`, ...data, status: 'Nuevo contacto', notes: '', nextAction: readNextAction(form), history: [{ date: todayIso(), channel: data.source, note: String(form.get('firstNote')).trim() }], signals: [] };
      people.push(created);
      view = { name: 'contacto', id: created.id };
      toast('Contacto creado');
    }
  });
}

function openNewsDialog(project) {
  openDialog({
    eyebrow: project.name,
    title: 'Publicar novedad',
    intro: 'Quedará visible para quienes visiten el proyecto en el sitio. Después vas a poder elegir a qué contactos avisarles.',
    fields: `${field('Tipo de novedad', `<select name="type">${options(NEWS_TYPES, NEWS_TYPES[0])}</select>`)}
      ${field('Título', '<input name="title" required maxlength="100" placeholder="Ej. Nueva etapa de obra">')}
      ${field('Detalle', '<textarea name="body" required maxlength="500" placeholder="Contá brevemente qué cambió."></textarea>')}`,
    submitLabel: 'Publicar novedad',
    onSubmit: form => {
      const item = { id: Date.now(), date: todayIso(), type: form.get('type'), title: String(form.get('title')).trim(), body: String(form.get('body')).trim() };
      project.news = project.news || [];
      project.news.unshift(item);
      followup = { projectId: project.id, newsId: item.id, selected: [], queue: [], index: 0, sent: 0 };
      toast('Novedad publicada en el sitio');
    }
  });
}

/* ---------- Eventos ---------- */

companyView.addEventListener('click', event => {
  const target = event.target.closest('[data-go],[data-action]');
  if (!target) return;
  const { go: destination, action, id } = target.dataset;
  if (destination) { go(destination === 'agenda' || destination === 'contactos' ? { name: destination } : { name: destination, id }); return; }
  const person = personById(id);
  const project = projectById(view.id);
  if (action === 'exit') setMode(false);
  else if (action === 'copy-link') {
    navigator.clipboard?.writeText(showroomUrl(person)).then(() => toast('Link del showroom copiado'), () => toast('No se pudo copiar el link'));
  }
  else if (action === 'reset') {
    if (!confirm('¿Restablecer los datos de ejemplo? Se borran los contactos, interacciones y novedades cargados en esta demo.')) return;
    projects = structuredClone(initialProjects); people = structuredClone(initialPeople); followup = null;
    saveData(); renderProjects(); go({ name: 'agenda' });
  }
  else if (action === 'new-contact') openContactDialog();
  else if (action === 'edit-contact') openContactDialog(person);
  else if (action === 'complete') openLogDialog(person, true);
  else if (action === 'log') openLogDialog(person);
  else if (action === 'set-next') openNextDialog(person);
  else if (action === 'add-news') openNewsDialog(project);
  else if (action === 'start-followup') { followup = { projectId: project.id, newsId: Number(target.dataset.news), selected: [], queue: [], index: 0, sent: 0 }; renderCompany(); scrollToTop(); }
  else if (action === 'close-followup') { followup = null; renderCompany(); }
  else if (action === 'select-all') {
    const candidates = interestedIn(project.id).map(item => item.id);
    followup.selected = followup.selected.length === candidates.length ? [] : candidates;
    renderCompany();
  }
  else if (action === 'prepare') {
    const news = project.news.find(item => item.id === followup.newsId);
    followup.queue = followup.selected.map(personId => ({ personId, message: buildMessage(personById(personId), project, news) }));
    renderCompany();
  }
  else if (action === 'skip') { followup.index++; renderCompany(); }
  else if (action === 'send') {
    // El enlace abre WhatsApp; acá solo se registra el envío y se pasa al siguiente contacto.
    const news = project.news.find(item => item.id === followup.newsId);
    personById(followup.queue[followup.index].personId).history.push({ date: todayIso(), channel: 'WhatsApp', note: `Recontacto por la novedad “${news.title}”.` });
    followup.sent++; followup.index++;
    saveData();
    setTimeout(renderCompany);
  }
});

companyView.addEventListener('change', event => {
  const target = event.target;
  if (target.matches('[data-select]')) {
    const personId = target.dataset.select;
    followup.selected = target.checked ? [...followup.selected, personId] : followup.selected.filter(item => item !== personId);
    renderCompany();
  } else if (target.id === 'contact-project' || target.id === 'contact-status') {
    contactFilters[target.id === 'contact-project' ? 'project' : 'status'] = target.value;
    companyView.querySelector('#contacts-body').innerHTML = contactRows();
  } else if (target.id === 'contact-status-select') {
    const person = personById(view.id);
    person.history.push({ date: todayIso(), channel: 'Estado', note: `Cambió de “${person.status}” a “${target.value}”.` });
    person.status = target.value;
    saveData(); renderCompany(); toast('Estado actualizado');
  }
});

companyView.addEventListener('input', event => {
  if (event.target.id === 'contact-search') {
    contactFilters.query = event.target.value;
    companyView.querySelector('#contacts-body').innerHTML = contactRows();
  } else if (event.target.id === 'followup-message') {
    const draft = followup.queue[followup.index];
    draft.message = event.target.value;
    companyView.querySelector('#followup-send').href = whatsappUrl(personById(draft.personId).phone, draft.message);
  }
});

companyView.addEventListener('keydown', event => {
  if (event.key === 'Enter' && event.target.matches('tr[data-go]')) event.target.click();
});

document.querySelectorAll('.filter').forEach(button => button.addEventListener('click', () => { document.querySelector('.filter.active')?.classList.remove('active'); button.classList.add('active'); renderProjects(button.dataset.filter); }));
modal.querySelectorAll('[data-close-modal]').forEach(button => button.addEventListener('click', closeModal));
document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  const dialog = document.querySelector('.update-dialog-backdrop');
  if (dialog) dialog.remove();
  else if (modal.classList.contains('open')) closeModal();
});

// Sincronización entre pestañas: con MARQ Contigo abierto, lo que un contacto hace en su showroom
// (otra pestaña o ventana) aparece al instante. En producción esto llegaría desde el servidor.
window.addEventListener('storage', event => {
  if (event.key === STORAGE_KEYS.people) {
    const fresh = [];
    loadList(STORAGE_KEYS.people, initialPeople).forEach(incoming => {
      const current = personById(incoming.id);
      if (!current) { people.push(incoming); return; }
      const known = (current.signals || []).length;
      fresh.push(...(incoming.signals || []).slice(known).filter(isStrong).map(signal => ({ person: current, signal })));
      Object.assign(current, incoming); // se conserva el mismo objeto para no romper formularios abiertos
    });
    if (fresh.length) { const { person, signal } = fresh[fresh.length - 1]; toast(`${firstName(person)}: ${signal.label.charAt(0).toLowerCase()}${signal.label.slice(1)}`); }
  } else if (event.key === STORAGE_KEYS.projects) {
    projects = loadList(STORAGE_KEYS.projects, initialProjects);
    renderProjects();
  } else if (event.key !== STORAGE_KEYS.webStats) return;
  if (companyMode && !document.querySelector('.update-dialog-backdrop') && !followup?.queue.length) renderCompany();
});
modeToggle.addEventListener('click', () => setMode(!companyMode));
const menuButton = document.querySelector('.menu-toggle');
menuButton.addEventListener('click', () => { const nav = document.querySelector('.main-nav'); const isOpen = nav.classList.toggle('mobile-open'); menuButton.setAttribute('aria-expanded', String(isOpen)); menuButton.setAttribute('aria-label', isOpen ? 'Cerrar navegación' : 'Abrir navegación'); });
document.querySelectorAll('.main-nav a').forEach(link => link.addEventListener('click', () => { document.querySelector('.main-nav').classList.remove('mobile-open'); menuButton.setAttribute('aria-expanded', 'false'); }));
document.querySelector('.whatsapp').href = whatsappUrl(MARQ_WHATSAPP, 'Hola, quiero consultar por un proyecto de MARQ.');
/* ---------- Landing: animaciones ---------- */

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function initReveal() {
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('is-visible');
    observer.unobserve(entry.target);
  }), { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
  document.querySelectorAll('[data-reveal],[data-split]').forEach(element => observer.observe(element));
}

function initLoader(onDone) {
  const loader = document.querySelector('#intro-loader');
  let seen = false;
  try { seen = sessionStorage.getItem('marq-intro') === '1'; sessionStorage.setItem('marq-intro', '1'); } catch {}
  if (!loader || seen || prefersReducedMotion) { if (loader) loader.hidden = true; onDone(); return; }
  document.body.classList.add('is-loading');
  setTimeout(() => {
    loader.classList.add('is-done');
    document.body.classList.remove('is-loading');
    onDone();
    setTimeout(() => { loader.hidden = true; }, 900);
  }, 1500);
}

const HERO_SLIDE_MS = 6000;

// Hero: fotos de las obras que se suceden, con índice y barra de progreso por obra.
function initHero() {
  const hero = document.querySelector('#hero'); if (!hero) return;
  const slides = [...hero.querySelectorAll('.hero-media img')];
  const bars = document.querySelector('#hero-bars');
  const now = hero.querySelector('.hero-now');
  let index = 0, timer = null;
  hero.style.setProperty('--slide', `${HERO_SLIDE_MS}ms`);
  bars.innerHTML = slides.map((slide, i) => `<button type="button" aria-label="Ver ${esc(slide.dataset.caption)}" class="${i === 0 ? 'is-active' : ''}"><i></i></button>`).join('');
  const show = next => {
    slides[index].classList.remove('is-active');
    index = next;
    slides[index].classList.add('is-active');
    [...bars.children].forEach((bar, i) => {
      bar.classList.remove('is-active');
      bar.classList.toggle('is-done', i < index);
      void bar.offsetWidth; // reinicia la animación de la barra
      bar.classList.toggle('is-active', i === index);
    });
    document.querySelector('#hero-count').textContent = `${String(index + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
    document.querySelector('#hero-caption').textContent = slides[index].dataset.caption;
    document.querySelector('#hero-meta').textContent = slides[index].dataset.meta;
    now.classList.remove('is-changing'); void now.offsetWidth; now.classList.add('is-changing');
  };
  const play = () => { clearInterval(timer); if (!prefersReducedMotion) timer = setInterval(() => show((index + 1) % slides.length), HERO_SLIDE_MS); };
  bars.addEventListener('click', event => {
    const next = [...bars.children].indexOf(event.target.closest('button'));
    if (next >= 0) { show(next); play(); }
  });
  play();

  // Palabras que rotan en la etiqueta superior.
  const words = [...hero.querySelectorAll('.hero-rotator > span')];
  let word = 0;
  if (!prefersReducedMotion) setInterval(() => {
    const leaving = words[word];
    leaving.classList.remove('is-active'); leaving.classList.add('is-leaving');
    setTimeout(() => leaving.classList.remove('is-leaving'), 650);
    word = (word + 1) % words.length;
    words[word].classList.add('is-active');
  }, 2200);

  // Linterna y leve movimiento de la foto siguiendo al mouse.
  if (!prefersReducedMotion) hero.addEventListener('pointermove', event => {
    const rect = hero.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width, y = (event.clientY - rect.top) / rect.height;
    hero.style.setProperty('--mx', `${x * 100}%`);
    hero.style.setProperty('--my', `${y * 100}%`);
    hero.style.setProperty('--px', (x - 0.5).toFixed(3));
    hero.style.setProperty('--py', (y - 0.5).toFixed(3));
  });
}

// Parte el título del hero en letras (agrupadas por palabra) para animarlas una por una.
function splitHeroTitle() {
  const title = document.querySelector('.hero-title'); if (!title) return;
  let count = 0;
  title.querySelectorAll('.line > span').forEach(container => {
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node => {
      const fragment = document.createDocumentFragment();
      node.textContent.split(/(\s+)/).forEach(part => {
        if (!part) return;
        if (/^\s+$/.test(part)) { fragment.append(document.createTextNode(' ')); return; }
        const wordEl = document.createElement('span');
        wordEl.className = 'word';
        [...part].forEach(char => {
          const charEl = document.createElement('span');
          charEl.className = 'char';
          charEl.style.setProperty('--c', count++);
          charEl.textContent = char;
          wordEl.append(charEl);
        });
        fragment.append(wordEl);
      });
      node.replaceWith(fragment);
    });
  });
  title.setAttribute('aria-label', title.textContent.replace(/\s+/g, ' ').trim());
}

function initScrollEffects() {
  const header = document.querySelector('.site-header');
  const hero = document.querySelector('#hero');
  const progress = document.querySelector('#scroll-progress');
  const parallax = [...document.querySelectorAll('[data-parallax]')];
  let ticking = false;
  const update = () => {
    ticking = false;
    if (companyMode) return;
    const viewport = innerHeight;
    header.classList.toggle('is-scrolled', scrollY > 30);
    header.classList.toggle('on-dark', Boolean(hero) && !document.body.classList.contains('showroom-mode') && scrollY < hero.offsetHeight - 90);
    const max = document.documentElement.scrollHeight - viewport;
    progress.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
    if (prefersReducedMotion) return;
    // Se mide el contenedor (sin transformar) para que el efecto no se retroalimente.
    parallax.forEach(element => {
      const rect = element.parentElement.getBoundingClientRect();
      element.style.transform = `translate3d(0, ${(rect.top + rect.height / 2 - viewport / 2) * Number(element.dataset.parallax)}px, 0)`;
    });
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  addEventListener('resize', update);
  update();
}

function initActiveNav() {
  const links = [...document.querySelectorAll('.main-nav a')];
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    links.forEach(link => link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`));
  }), { rootMargin: '-45% 0px -50% 0px' });
  links.forEach(link => { const section = document.querySelector(link.getAttribute('href')); if (section) observer.observe(section); });
}

function initMagnetic() {
  if (prefersReducedMotion || !matchMedia('(hover: hover)').matches) return;
  document.querySelectorAll('.magnetic').forEach(element => {
    element.addEventListener('mousemove', event => {
      const rect = element.getBoundingClientRect();
      element.style.transform = `translate(${(event.clientX - rect.left - rect.width / 2) * 0.2}px, ${(event.clientY - rect.top - rect.height / 2) * 0.3}px)`;
    });
    element.addEventListener('mouseleave', () => { element.style.transform = ''; });
  });
}

function initLanding() {
  splitHeroTitle();
  initHero();
  initScrollEffects();
  initActiveNav();
  initMagnetic();
  initLoader(initReveal);
}

initShowroom();
renderProjects();
initLanding();
