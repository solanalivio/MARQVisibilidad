// Contenido demostrativo. En una versión conectada a servidor, estos datos
// deberían leerse y guardarse mediante una API con acceso autenticado.
const MARQ_WHATSAPP = '5493624119351'; // WhatsApp público del estudio (estudiomarq.com.ar).
const STORAGE_KEYS = { projects: 'marq-projects-v10', people: 'marq-people-v10', webStats: 'marq-web-stats-v1' };
const STATUSES = ['Nuevo contacto', 'En conversación', 'Información enviada', 'Visita agendada', 'En negociación', 'Cerró operación', 'Sin interés por ahora'];
const CLOSED_STATUSES = ['Cerró operación', 'Sin interés por ahora'];
const STATUS_TONES = { 'Nuevo contacto': 'tone-new', 'En conversación': 'tone-active', 'Información enviada': 'tone-active', 'Visita agendada': 'tone-warm', 'En negociación': 'tone-warm', 'Cerró operación': 'tone-done', 'Sin interés por ahora': 'tone-muted' };
// Sin "Alquiler": los alquileres los manejan las inmobiliarias, no el estudio.
// "A definir" queda solo por compatibilidad: en MARQ Contigo esos contactos se tratan como particulares.
const INTERESTS = ['Vivienda propia', 'Inversión', 'A definir'];
const CHANNELS = ['WhatsApp', 'Llamada', 'Reunión', 'Visita', 'Email', 'Instagram', 'Facebook', 'Sitio web', 'Presencial'];
const MEETING_PLACES = { Estudio: 'el estudio', Showroom: 'el showroom', Obra: 'la obra' };
const NEWS_TYPES = ['Avance de obra', 'Disponibilidad', 'Promoción', 'Evento', 'Modificación', 'Información relevante'];
const PROFILES = { vivienda: { label: 'Busco mi próxima vivienda', interest: 'Vivienda propia', tab: 'Para vivir' }, inversion: { label: 'Busco oportunidades de inversión', interest: 'Inversión', tab: 'Para invertir' } };
const STRONG_SIGNALS = ['visit'];

// Segmentos de la cartera: se atienden distinto, por eso cada uno tiene su propia vista.
const SEGMENTS = {
  inversor: { label: 'Inversor', plural: 'Inversores', interest: 'Inversión', mark: '▲' },
  particular: { label: 'Particular', plural: 'Particulares', interest: 'Vivienda propia', mark: '●' }
};
// Perfil comercial: todos los campos son opcionales y se eligen con un clic.
const TYPOLOGIES = ['Monoambiente', '1 dormitorio', '2 dormitorios', '3 dormitorios', 'Lote'];
const FINANCING = ['Contado', 'Cuotas del estudio', 'Crédito hipotecario', 'Vende su propiedad'];
const GOALS = ['Renta', 'Revalorización'];
const MODALITIES = ['En pozo', 'Terminado', 'Indistinto'];
const MONTHLY_MEETING_GOAL = 6;

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
  { id:'casa-bdn', name:'Casas BDN + Terreno', category:'Casas', year:'', status:'En construcción', location:'Brisas del Norte', facts:['1 a 3 dormitorios', '52 a 120 m²'], description:'Tu casa y tu terreno en un barrio costero consolidado, habitado y en pleno crecimiento.', image:`${MARQ_IMG}/casas-bdn-portada-proyectos.webp`, imageAlt:'Casa de Brisas del Norte con jardín', team: teamWith(), news:[{ id:4, date:daysFromToday(-45), type:'Avance de obra', title:'Casas modelo terminadas', body:'Ya se pueden recorrer las casas modelo de 2 y 3 dormitorios en Brisas del Norte.' }] },
  { id:'loft-al-rio', name:'Loft al Río', category:'Casas', year:'', status:'Terminado', location:'Resistencia', facts:['Doble altura'], description:'Viviendas en doble altura frente al agua, con superficies flexibles para disfrutar sin límites.', image:`${MARQ_IMG}/2024/08/loftalrio-proyecto.webp`, imageAlt:'Lofts iluminados frente al río', team: teamWith(), news:[] },
  { id:'casa-fo', name:'Casa FO', category:'Casas', year:'', status:'Terminado', location:'Resistencia', facts:['Proyecto a medida'], description:'Un equilibrio entre calidad y costo, con un valor único pensado para el estilo de vida soñado por sus dueños.', image:`${MARQ_IMG}/2024/07/casa-fontanes-proyecto.webp`, imageAlt:'Casa FO con jardín tropical', team: teamWith(), news:[] },
  { id:'pueblo-mio', name:'Pueblo Mío', category:'Lotes', year:'', status:'En desarrollo', location:'Ruta 11, Puerto Tirol', facts:['100 ha', 'Lotes de 400 m²'], description:'Un barrio privado con laguna sobre 100 hectáreas de agua y bosque, a 10 minutos del centro.', image:`${MARQ_IMG}/2024/07/pueblomio-proyecto.webp`, imageAlt:'Bosque nativo de Pueblo Mío', team: teamWith(), news:[{ id:5, date:daysFromToday(-60), type:'Disponibilidad', title:'Nueva etapa de lotes frente a la laguna', body:'Habilitamos la segunda etapa de lotes de 400 m² con vista a la laguna.' }] },
  { id:'gran-arboledas', name:'Gran Arboledas', category:'Lotes', year:'', status:'En venta', location:'Av. Sarmiento 4500', facts:['193 lotes', '300 a 400 m²'], description:'193 lotes con infraestructura completa que conservan el bosque nativo, a minutos de la ciudad.', image:`${MARQ_IMG}/2024/07/gran-arboledas-inversiones.webp`, imageAlt:'Loteo Gran Arboledas', team: teamWith(), news:[] },
  { id:'brisas-del-norte', name:'Brisas del Norte', category:'Lotes', year:'', status:'En venta', location:'Av. Juan Manuel de Rosas 3700', facts:['Laguna y muelle'], description:'Un loteo rodeado de naturaleza, con laguna, muelle y espacios de recreación: ideal para vivir o invertir.', image:`${MARQ_IMG}/2024/07/brisas-del-norte-proyecto.webp`, imageAlt:'Muelle sobre la laguna de Brisas del Norte', team: teamWith(), news:[] },
  { id:'parque-arboledas', name:'Parque Arboledas', category:'Lotes', year:'', status:'En venta', location:'Av. Ávalos', facts:['6 ha'], description:'Un predio de 6 hectáreas de características únicas, a 1.000 m de la Ruta 16.', image:`${MARQ_IMG}/2024/07/parque-arboledas-proyecto.webp`, imageAlt:'Vista aérea de Parque Arboledas', team: teamWith(), news:[] },
  { id:'interiorismo-pe', name:'Interiorismo PE', category:'Interiorismo', year:'', status:'Terminado', location:'Resistencia', facts:['Rediseño interior'], description:'Estilo clásico, lujo y modernidad en un rediseño interior minimalista con el sello MARQ.', image:`${MARQ_IMG}/2024/07/interiorismo-peruchena-proyecto.webp`, imageAlt:'Living luminoso con interiorismo MARQ', team: teamWith(), news:[] },
  { id:'ax-sarmiento', name:'AX Sarmiento', category:'Locales Comerciales', year:'', status:'Terminado', location:'Av. Sarmiento 1510', facts:['AXION Energy'], description:'Estación de servicio para la cadena AXION Energy, una de las cuatro que el estudio proyectó en la región.', image:`${MARQ_IMG}/2024/07/axion-proyecto.webp`, imageAlt:'Estación de servicio AXION en Av. Sarmiento', team: teamWith(
    { name:'AXION Energy', role:'Cliente', description:'Cadena para la que MARQ proyectó estaciones de servicio en Resistencia y Puerto Tirol.' }
  ), news:[] },
  { id:'cet', name:'C.E.T.', category:'Edificios Especiales', year:'', status:'Terminado', location:'Resistencia', facts:['Gran escala'], description:'Centro Educativo Terapéutico: arquitectura de gran escala y vanguardia con el estilo MARQ.', image:`${MARQ_IMG}/2024/07/C.E.T-proyecto.webp`, imageAlt:'Fachada del Centro Educativo Terapéutico', team: teamWith(), news:[] }
];

// Stock de ejemplo por tipología. En producción lo actualizaría administración con cada boleto o reserva.
const INVENTORY = {
  'torre-natalini': { total: 52, salesPerMonth: 1, types: [
    { typology: '1 dormitorio', m2: 45, from: 71000, available: 2, reserved: 0 },
    { typology: '2 dormitorios', m2: 68, from: 98000, available: 1, reserved: 1 }
  ] },
  'marq-collection': { total: 30, salesPerMonth: 1.5, types: [
    { typology: '1 dormitorio', m2: 42, from: 79000, available: 8, reserved: 0 },
    { typology: '2 dormitorios', m2: 64, from: 112000, available: 9, reserved: 1 },
    { typology: '3 dormitorios', m2: 96, from: 158000, available: 3, reserved: 0 }
  ] },
  'torre-panorama': { total: 64, salesPerMonth: 1, types: [
    { typology: '1 dormitorio', m2: 40, from: 68000, available: 20, reserved: 0 },
    { typology: '2 dormitorios', m2: 62, from: 95000, available: 26, reserved: 2 },
    { typology: '3 dormitorios', m2: 90, from: 140000, available: 10, reserved: 0 }
  ] },
  'casa-bdn': { total: 24, salesPerMonth: 2, types: [
    { typology: '1 dormitorio', m2: 52, from: 48000, available: 3, reserved: 0 },
    { typology: '2 dormitorios', m2: 78, from: 66000, available: 5, reserved: 1 },
    { typology: '3 dormitorios', m2: 120, from: 92000, available: 2, reserved: 1 }
  ] },
  'pueblo-mio': { total: 180, salesPerMonth: 3, types: [{ typology: 'Lote', m2: 400, from: 18000, available: 140, reserved: 4 }] },
  'gran-arboledas': { total: 193, salesPerMonth: 4, types: [{ typology: 'Lote', m2: 300, from: 16000, available: 70, reserved: 3 }] },
  'brisas-del-norte': { total: 90, salesPerMonth: 2, types: [{ typology: 'Lote', m2: 350, from: 20000, available: 18, reserved: 2 }] },
  'parque-arboledas': { total: 60, salesPerMonth: 2, types: [{ typology: 'Lote', m2: 300, from: 14000, available: 37, reserved: 2 }] }
};

// Campañas de ejemplo. Inversión y leads vendrían de Meta Ads / Google Ads;
// reuniones y ventas, de las fichas atribuidas a cada campaña.
const CAMPAIGNS = [
  { id: 'c1', name: 'Preventa MARQ Collection', platform: 'Meta Ads', projectId: 'marq-collection', status: 'Activa', since: daysFromToday(-24), spend: 180000, leads: 14, meetings: 2, sales: 0 },
  { id: 'c2', name: 'Últimas unidades Natalini', platform: 'Meta Ads', projectId: 'torre-natalini', status: 'Activa', since: daysFromToday(-18), spend: 90000, leads: 5, meetings: 0, sales: 0 },
  { id: 'c3', name: 'Casas BDN en cuotas', platform: 'Google Ads', projectId: 'casa-bdn', status: 'Activa', since: daysFromToday(-30), spend: 60000, leads: 3, meetings: 1, sales: 1 },
  { id: 'c4', name: 'Lotes con laguna', platform: 'Instagram', projectId: 'pueblo-mio', status: 'Pausada', since: daysFromToday(-40), spend: 45000, leads: 4, meetings: 1, sales: 0 }
];

// Las fechas se calculan desde hoy para que siempre haya visitas pasadas, de hoy y próximas.
// Las reuniones ya hechas quedan en el historial con visit: 'done' | 'noshow'.
const initialPeople = [
  { id:'p1', name:'Ana Martínez', phone:'5493624000001', email:'ana.martinez@correo.com', source:'WhatsApp', showroom:{ projects:['torre-panorama', 'casa-bdn', 'torre-natalini'], at:daysFromToday(-9) }, journey:['Tótem de Torre Natalini', 'mapa 3D', 'WhatsApp'], projects:['torre-panorama'], interest:'Vivienda propia', status:'En conversación', profile:{ typology:'2 dormitorios', budget:100000, financing:'Cuotas del estudio' }, notes:'Busca su primer hogar. Le gusta Torre Panorama y quiere entrar en preventa para mudarse cuando se entregue.', nextAction:{ source:'showroom', text:'Coordinar la visita al estudio que pidió desde su showroom (Torre Panorama)', date:daysFromToday(0) }, history:[
    { date:daysFromToday(-9), channel:'WhatsApp', note:'Preguntó el precio de Torre Panorama. Se le envió su showroom personal.' },
    { date:daysFromToday(-4), channel:'Llamada', note:'Busca su primer departamento. Pidió valores y formas de pago en preventa.' }
  ]},
  { id:'p2', name:'Diego Fernández', phone:'5493624000002', email:'', source:'WhatsApp', showroom:{ projects:['marq-collection', 'torre-natalini'], at:daysFromToday(-7) }, journey:['Sitio web', 'mapa 3D', 'WhatsApp'], projects:['torre-natalini', 'marq-collection'], interest:'Inversión', status:'Visita agendada', profile:{ typology:'2 dormitorios', budget:100000, goal:'Renta', modality:'Indistinto', units:1 }, notes:'Inversor. Compara ingresar en pozo en MARQ Collection con comprar terminado en Torre Natalini.', nextAction:{ kind:'meeting', text:'Reunión en la obra · Torre Natalini', date:daysFromToday(0), time:'17:30', place:'Obra', projectId:'torre-natalini' }, history:[
    { date:daysFromToday(-12), channel:'WhatsApp', note:'Pidió información para invertir en pozo.' },
    { date:daysFromToday(-7), channel:'Email', note:'Se le envió el brochure con precios y plazos de entrega de ambos proyectos.' },
    { date:daysFromToday(-2), channel:'Llamada', note:'Quiere ver una unidad terminada de 2 dormitorios antes de decidir.' }
  ]},
  { id:'p3', name:'Paula Gómez', phone:'5493624000003', email:'paula.gomez@correo.com', source:'Facebook', journey:['Publicación de MARQ Collection', 'mensaje privado'], projects:['marq-collection'], interest:'Vivienda propia', status:'Visita agendada', profile:{ typology:'2 dormitorios', budget:120000, financing:'Crédito hipotecario' }, notes:'Viene con su pareja. Tienen un perro: contarle sobre los espacios comunes.', nextAction:{ kind:'meeting', text:'Reunión en el showroom · MARQ Collection', date:daysFromToday(0), time:'11:00', place:'Showroom', projectId:'marq-collection' }, history:[
    { date:daysFromToday(-15), channel:'Facebook', note:'Comentó una publicación de MARQ Collection y se la contactó por privado.' },
    { date:daysFromToday(-5), channel:'WhatsApp', note:'Coordinamos una visita al showroom.' }
  ]},
  { id:'p4', name:'Julián Benítez', phone:'5493624000004', email:'', source:'Visita', projects:['casa-bdn'], interest:'Vivienda propia', status:'En conversación', profile:{ typology:'3 dormitorios', budget:95000, financing:'Vende su propiedad' }, notes:'Necesita vender su casa actual para poder comprar.', nextAction:{ text:'Llamar para saber si ya tasó su casa actual', date:daysFromToday(0) }, history:[
    { date:daysFromToday(-20), channel:'Visita', note:'Recorrió Brisas del Norte un sábado. Le gustó la casa modelo.', visit:'done', projectId:'casa-bdn' },
    { date:daysFromToday(-8), channel:'Llamada', note:'Está esperando la tasación de su casa para definir.' }
  ]},
  { id:'p5', name:'Carla Ruiz', phone:'5493624000005', email:'carla.ruiz@correo.com', source:'Instagram', campaign:'c4', projects:['pueblo-mio', 'parque-arboledas'], interest:'Inversión', status:'En negociación', profile:{ typology:'Lote', budget:40000, goal:'Revalorización', modality:'Indistinto', units:2 }, notes:'Quiere dos lotes contiguos. Pide condiciones para pagar en 12 cuotas.', nextAction:{ text:'Enviar propuesta de pago por dos lotes', date:daysFromToday(-1) }, history:[
    { date:daysFromToday(-25), channel:'Instagram', note:'Consultó por lotes con vista a la laguna.' },
    { date:daysFromToday(-10), channel:'Visita', note:'Visitó Pueblo Mío y Parque Arboledas. Prefiere lotes contiguos.', visit:'done', projectId:'pueblo-mio' },
    { date:daysFromToday(-3), channel:'WhatsApp', note:'Pidió una propuesta por dos lotes en 12 cuotas.' }
  ]},
  { id:'p6', name:'Marcos Vera', phone:'5493624000006', email:'', source:'WhatsApp', showroom:{ projects:['parque-arboledas', 'gran-arboledas'], at:daysFromToday(-2) }, projects:['parque-arboledas'], interest:'Vivienda propia', status:'Nuevo contacto', profile:{ typology:'Lote' }, notes:'Quiere un lote para construir su casa.', nextAction:null, history:[
    { date:daysFromToday(-2), channel:'WhatsApp', note:'Preguntó precios de lotes para construir su casa.' }
  ]},
  { id:'p7', name:'Lucía Sosa', phone:'5493624000007', email:'lucia.sosa@correo.com', source:'Llamada', journey:['Cartel de obra de Torre Natalini', 'llamada a la oficina'], projects:['torre-natalini'], interest:'Inversión', status:'Nuevo contacto', profile:{ typology:'1 dormitorio', budget:75000, goal:'Renta', modality:'Terminado', units:1 }, notes:'Busca una unidad de un dormitorio para alquilar.', nextAction:{ text:'Enviar tipologías de un dormitorio disponibles', date:daysFromToday(3) }, history:[
    { date:daysFromToday(-1), channel:'Llamada', note:'Llamó a la oficina por unidades de un dormitorio.' }
  ]},
  { id:'p8', name:'Roberto Díaz', phone:'5493624000008', email:'', source:'Presencial', projects:['casa-bdn'], interest:'Vivienda propia', status:'Cerró operación', profile:{ typology:'2 dormitorios', budget:70000, financing:'Cuotas del estudio' }, notes:'Firmó boleto. Mantener el vínculo: puede recomendarnos.', nextAction:null, history:[
    { date:daysFromToday(-40), channel:'Presencial', note:'Se acercó a la oficina por Casas BDN.' },
    { date:daysFromToday(-6), channel:'Reunión', note:'Firmó el boleto de compraventa en el estudio.', visit:'done', projectId:'casa-bdn' }
  ]},
  { id:'p9', name:'Martín Acosta', phone:'5493624000009', email:'martin.acosta@correo.com', source:'Instagram', campaign:'c1', projects:['marq-collection'], interest:'Inversión', status:'Visita agendada', profile:{ typology:'1 dormitorio', budget:160000, goal:'Revalorización', modality:'En pozo', units:2 }, notes:'Quiere dos unidades de un dormitorio en pozo para vender al terminar la obra.', nextAction:{ kind:'meeting', text:'Reunión en el showroom · MARQ Collection', date:daysFromToday(1), time:'10:00', place:'Showroom', projectId:'marq-collection' }, history:[
    { date:daysFromToday(-6), channel:'Instagram', note:'Respondió el anuncio de la preventa de MARQ Collection.' },
    { date:daysFromToday(-3), channel:'Reunión', note:'Reunión en el estudio: le presentamos tipologías y el plan de pagos en pozo.', visit:'done', projectId:'marq-collection' }
  ]},
  { id:'p10', name:'Sofía Romero', phone:'5493624000010', email:'sofia.romero@correo.com', source:'Sitio web', campaign:'c3', projects:['casa-bdn'], interest:'Vivienda propia', status:'Visita agendada', profile:{ typology:'2 dormitorios', budget:70000, financing:'Cuotas del estudio' }, notes:'Quiere mudarse con su pareja antes de fin del año que viene.', nextAction:{ kind:'meeting', text:'Reunión en la obra · Casas BDN + Terreno', date:daysFromToday(2), time:'18:00', place:'Obra', projectId:'casa-bdn' }, history:[
    { date:daysFromToday(-11), channel:'Sitio web', note:'Completó el formulario de Casas BDN en cuotas.' },
    { date:daysFromToday(-2), channel:'Visita', note:'Recorrió la casa modelo de 2 dormitorios. Vuelve con su pareja.', visit:'done', projectId:'casa-bdn' }
  ]},
  { id:'p11', name:'Gustavo Molina', phone:'5493624000011', email:'', source:'Facebook', campaign:'c2', projects:['torre-natalini'], interest:'Vivienda propia', status:'En conversación', profile:{ typology:'2 dormitorios', budget:105000, financing:'Crédito hipotecario' }, notes:'Busca un 2 dormitorios terminado para mudarse ya.', nextAction:{ text:'Reprogramar la visita a la que no pudo venir', date:daysFromToday(0) }, history:[
    { date:daysFromToday(-8), channel:'Facebook', note:'Escribió por el anuncio de últimas unidades.' },
    { date:daysFromToday(-2), channel:'Reunión', note:'No vino a la visita de la unidad 14B. Avisó tarde que tuvo un imprevisto.', visit:'noshow', projectId:'torre-natalini' }
  ]},
  { id:'p12', name:'Elena Quiroga', phone:'5493624000012', email:'elena.quiroga@correo.com', source:'Presencial', projects:['pueblo-mio'], interest:'Inversión', status:'En negociación', profile:{ typology:'Lote', budget:60000, goal:'Revalorización', modality:'Indistinto', units:3 }, notes:'Busca tres lotes para revender cuando se termine la segunda etapa.', nextAction:{ text:'Enviar el plano del loteo con los lotes elegidos', date:daysFromToday(2) }, history:[
    { date:daysFromToday(-15), channel:'Presencial', note:'Se acercó al estudio por recomendación de un cliente.' },
    { date:daysFromToday(-1), channel:'Visita', note:'Recorrió Pueblo Mío. Eligió tres lotes de la etapa 2.', visit:'done', projectId:'pueblo-mio' }
  ]},
  { id:'p13', name:'Valentina Ríos', phone:'5493624000013', email:'', source:'Facebook', showroom:{ projects:['marq-collection', 'torre-panorama'], at:daysFromToday(-1) }, campaign:'c1', projects:['marq-collection'], interest:'Inversión', status:'Nuevo contacto', profile:{ typology:'1 dormitorio', goal:'Renta', modality:'En pozo' }, notes:'Quiere saber si conviene comprar en pozo para alquilar.', nextAction:null, history:[
    { date:daysFromToday(-1), channel:'Facebook', note:'Completó el formulario de la preventa. Preguntó si las unidades se pueden alquilar.' }
  ]},
  { id:'p14', name:'Federico Paz', phone:'5493624000014', email:'', source:'Instagram', projects:['casa-bdn'], interest:'Vivienda propia', status:'Nuevo contacto', profile:{ typology:'2 dormitorios' }, notes:'Quiere mudarse el año que viene.', nextAction:{ text:'Responder por las casas de 2 dormitorios', date:daysFromToday(1) }, history:[
    { date:daysFromToday(-4), channel:'Instagram', note:'Preguntó si hay casas de 2 dormitorios para mudarse el año que viene.' }
  ]}
];

// Actividad de ejemplo en los showrooms personales (horas atrás desde ahora).
const hoursAgo = hours => new Date(Date.now() - hours * 3600000).toISOString();
const initialSignals = {
  p1: [
    { at: hoursAgo(27), type: 'open', label: 'Abrió su showroom' },
    { at: hoursAgo(27), type: 'profile', label: 'Eligió “Busco mi próxima vivienda”' },
    { at: hoursAgo(26), type: 'team', projectId: 'torre-panorama', label: 'Conoció al equipo de Torre Panorama' },
    { at: hoursAgo(21), type: 'visit', projectId: 'torre-panorama', label: 'Pidió agendar una visita por Torre Panorama' }
  ],
  p2: [
    { at: hoursAgo(3), type: 'open', label: 'Abrió su showroom' },
    { at: hoursAgo(3), type: 'profile', label: 'Eligió “Busco oportunidades de inversión”' },
    { at: hoursAgo(2), type: 'team', projectId: 'marq-collection', label: 'Conoció al equipo de MARQ Collection' },
    { at: hoursAgo(2), type: 'team', projectId: 'torre-natalini', label: 'Conoció al equipo de Torre Natalini' }
  ],
  p6: [
    { at: hoursAgo(40), type: 'open', label: 'Abrió su showroom' }
  ],
  p13: [
    { at: hoursAgo(20), type: 'open', label: 'Abrió su showroom' },
    { at: hoursAgo(19), type: 'team', projectId: 'marq-collection', label: 'Conoció al equipo de MARQ Collection' }
  ]
};
initialPeople.forEach(person => { person.signals = initialSignals[person.id] || []; });

const loadList = (key, fallback) => {
  try { const value = JSON.parse(localStorage.getItem(key)); if (Array.isArray(value)) return value; } catch {}
  return structuredClone(fallback);
};
let projects = loadList(STORAGE_KEYS.projects, initialProjects);
let people = loadList(STORAGE_KEYS.people, initialPeople);
// Contactos guardados antes de sacar "Alquiler" de las opciones.
people.forEach(person => { if (!INTERESTS.includes(person.interest)) person.interest = 'A definir'; person.profile = person.profile || {}; });
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
let listFilters = { query: '', project: '' };
let originMode = 'leads';
let boardMode = 'board';
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
// Abierta como archivo local (por ejemplo, dentro del comercial), el link usa la dirección publicada.
const PUBLIC_URL = 'https://marqcontigo.vercel.app/';
const showroomUrl = person => `${location.protocol === 'file:' ? PUBLIC_URL : location.href.split(/[?#]/)[0]}?showroom=${encodeURIComponent(person.id)}`;
function relativeTime(at) {
  const minutes = Math.round((Date.now() - new Date(at)) / 60000);
  if (minutes < 1) return 'Recién';
  if (minutes < 60) return `Hace ${minutes} min`;
  if (minutes < 60 * 24) return `Hace ${Math.round(minutes / 60)} h`;
  return relativeDay(isoDate(new Date(at)));
}
const capitalize = text => text.charAt(0).toUpperCase() + text.slice(1);
// Un próximo paso puede ser una reunión agendada: { kind: 'meeting', text, date, time, place, projectId }.
const isMeeting = action => action?.kind === 'meeting';
const actionText = action => isMeeting(action) ? `📅 ${action.text}` : action.text;
const actionWhen = action => `${relativeDay(action.date)}${action.time ? ` · ${action.time} h` : ''}`;
const actionKey = action => `${action.date}${action.time || ''}`;

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
  const picked = project => Boolean(person?.showroom?.projects?.includes(project.id));
  const recommended = project => Boolean(currentProfile && detailFor(project).profiles.includes(currentProfile));
  const rank = project => (asked(project) || picked(project) ? 0 : 4) + (recommended(project) ? 0 : 2) + (detailFor(project).forSale ? 0 : 1);
  const visible = projects.filter(project => filter === 'Todos' || project.category === filter)
    .sort((a, b) => rank(a) - rank(b) || displayOrder.indexOf(a.id) - displayOrder.indexOf(b.id));
  const total = String(visible.length).padStart(2, '0');
  grid.innerHTML = visible.length ? visible.map((project, index) => {
    const detail = detailFor(project);
    const flag = asked(project) ? 'Consultaste por este proyecto' : picked(project) ? 'Elegido para vos' : recommended(project) ? PROFILES[currentProfile].tab : '';
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
    person.nextAction = { source: 'showroom', text: `Coordinar la visita al estudio que pidió desde su showroom${project ? ` (${project.name})` : ''}`, date: todayIso() };
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

const segmentOf = person => person.interest === 'Inversión' ? 'inversor' : 'particular';
const inSegment = segment => people.filter(person => segmentOf(person) === segment);
const segmentMark = person => { const key = segmentOf(person); return `<span class="seg-mark seg-${key}" title="${SEGMENTS[key].label}">${SEGMENTS[key].mark}</span>`; };
const segmentBadge = person => { const key = segmentOf(person); return `<span class="seg-badge seg-${key}">${SEGMENTS[key].mark} ${SEGMENTS[key].label}</span>`; };
const usd = value => value ? `USD ${Number(value).toLocaleString('es-AR')}` : '';
const usdShort = value => value ? `USD ${value >= 1000 ? `${Math.round(value / 1000)}k` : value}` : '—';
const ars = value => `$ ${Math.round(value).toLocaleString('es-AR')}`;
const daysSince = iso => iso ? -dayDiff(iso) : Infinity;
const firstContact = person => person.history[0]?.date;
const campaignById = id => CAMPAIGNS.find(campaign => campaign.id === id);
const inventoryFor = id => INVENTORY[id] || null;
const unsoldOf = inventory => inventory.types.reduce((sum, type) => sum + type.available + type.reserved, 0);
const plural = (count, one, many) => `${count} ${count === 1 ? one : many}`;
const latestNews = project => [...(project.news || [])].sort((a, b) => b.date.localeCompare(a.date))[0];


// Visitas: las hechas quedan en el historial (visit: 'done' | 'noshow'); las próximas son el próximo paso de tipo reunión.
const visitLog = () => people.flatMap(person => person.history.filter(item => item.visit).map(item => ({ person, ...item })));
const scheduledVisits = () => people.filter(person => isMeeting(person.nextAction)).map(person => ({ person, ...person.nextAction }));
function visitsOn(offset) {
  const date = daysFromToday(offset);
  const log = visitLog().filter(item => item.date === date);
  return { date, done: log.filter(item => item.visit === 'done'), noshow: log.filter(item => item.visit === 'noshow'), scheduled: scheduledVisits().filter(item => item.date === date).sort((a, b) => (a.time || '').localeCompare(b.time || '')) };
}
const currentMonth = () => todayIso().slice(0, 7);
const meetingsThisMonth = () => visitLog().filter(item => item.visit === 'done' && item.date.startsWith(currentMonth())).length;
const meetingsAheadThisMonth = () => scheduledVisits().filter(item => item.date.startsWith(currentMonth()) && dayDiff(item.date) >= 0).length;
const projectMeetings = (projectId, days = 30) => visitLog().filter(item => item.projectId === projectId && item.visit === 'done' && daysSince(item.date) <= days).length;
const projectScheduled = projectId => scheduledVisits().filter(item => item.projectId === projectId && dayDiff(item.date) >= 0).length;

// Orígenes de los contactos. Los colores siguen al canal (no al ranking) y están validados para daltonismo.
const ORIGINS = [
  { key: 'Presencial', color: '#b07a2a', channels: ['Presencial', 'Visita', 'Reunión'] },
  { key: 'Llamada', color: '#0f7ea6', channels: ['Llamada'] },
  { key: 'WhatsApp', color: '#5f9a3a', channels: ['WhatsApp'] },
  { key: 'Instagram', color: '#a8487a', channels: ['Instagram'] },
  { key: 'Facebook', color: '#4f6fd0', channels: ['Facebook'] }
];
const OTHER_ORIGIN = { key: 'Otros', color: '#a39d94', channels: [] };
const ORIGIN_MODES = { leads: 'Leads', interacciones: 'Interacciones', reuniones: 'Reuniones' };
const originOf = channel => ORIGINS.find(origin => origin.channels.includes(channel)) || OTHER_ORIGIN;
function originData(mode) {
  const channels = mode === 'interacciones' ? people.flatMap(person => person.history.map(item => item.channel)).filter(channel => !['Agenda', 'Estado'].includes(channel))
    : mode === 'reuniones' ? people.filter(person => person.history.some(item => item.visit === 'done') || isMeeting(person.nextAction)).map(person => person.source)
    : people.map(person => person.source);
  const counts = new Map();
  channels.forEach(channel => { const origin = originOf(channel); counts.set(origin, (counts.get(origin) || 0) + 1); });
  return [...ORIGINS, OTHER_ORIGIN].filter(origin => counts.get(origin)).map(origin => ({ ...origin, value: counts.get(origin) }));
}

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

function go(nextView) {
  if (nextView.name !== view.name && nextView.name !== 'contacto' && view.name !== 'contacto') listFilters = { query: '', project: '' };
  view = nextView;
  renderCompany(); scrollToTop();
}


function renderCompany() {
  if ((view.name === 'proyecto' && !projectById(view.id)) || (view.name === 'contacto' && !personById(view.id))) view = { name: 'agenda' };
  const activeIn = segment => inSegment(segment).filter(isOpen).length;
  const titles = { agenda: 'Resumen', inversores: 'Inversores', particulares: 'Particulares', proyecto: projectById(view.id)?.name, contacto: personById(view.id)?.name };
  const current = view.name === 'contacto' ? (view.back?.name || (segmentOf(personById(view.id)) === 'inversor' ? 'inversores' : 'particulares')) : view.name;
  const navItem = (name, label, count = null) => `<button class="company-nav-item ${current === name ? 'selected' : ''}" data-go="${name}">${label}${count === null ? '' : `<span class="nav-count">${count}</span>`}</button>`;
  const content = view.name === 'contacto' ? renderContact(personById(view.id))
    : view.name === 'inversores' ? renderSegment('inversor')
    : view.name === 'particulares' ? renderSegment('particular')
    : view.name === 'proyecto' ? renderProject(projectById(view.id))
    : renderSummary();
  const navProjects = projects.filter(project => detailFor(project).forSale && interestedIn(project.id).some(isOpen));
  companyView.innerHTML = `<div class="company-shell">
    <aside class="company-sidebar" aria-label="Navegación de MARQ Contigo">
      <div class="company-brand"><b>marQ</b><span>CONTIGO</span></div>
      <nav class="company-nav">${navItem('agenda', 'Resumen')}</nav>
      <p class="company-label">Cartera</p>
      <nav class="company-nav">${navItem('inversores', '<span class="nav-mark">▲</span>Inversores', activeIn('inversor'))}${navItem('particulares', '<span class="nav-mark">●</span>Particulares', activeIn('particular'))}</nav>
      <p class="company-label">Proyectos con interesados</p>
      <nav class="company-nav">${navProjects.map(project => `<button class="company-nav-item ${(view.name === 'proyecto' && view.id === project.id) || (current === 'proyecto' && view.back?.id === project.id) ? 'selected' : ''}" data-go="proyecto" data-id="${esc(project.id)}"><span class="project-dot"></span>${esc(project.name)}<span class="nav-count">${interestedIn(project.id).filter(isOpen).length}</span></button>`).join('')}</nav>
      <div class="company-user">${avatar('Equipo Comercial')}<div>Equipo comercial<small>Datos de ejemplo</small></div></div>
      <button class="sidebar-reset" data-action="reset">Restablecer datos de ejemplo</button>
    </aside>
    <div class="company-main">
      <div class="company-topbar"><span>MARQ Contigo / <b>${esc(titles[view.name] || '')}</b></span><div class="topbar-actions"><span class="demo-label">Prototipo</span><button class="admin-secondary admin-small" data-action="exit">Ver sitio público ↗</button></div></div>
      <div class="company-content">${content}</div>
    </div>
  </div>`;
  // En el celular el menú es una barra deslizable: se lleva a la vista la sección actual.
  const sidebar = companyView.querySelector('.company-sidebar');
  const selected = sidebar.querySelector('.company-nav-item.selected');
  if (selected && sidebar.scrollWidth > sidebar.clientWidth) sidebar.scrollLeft = selected.offsetLeft - 70;
  // En el celular cada fila de tabla se muestra como tarjeta: cada celda lleva el nombre de su columna.
  companyView.querySelectorAll('.data-table').forEach(table => {
    const heads = [...table.querySelectorAll('thead th')].map(th => th.textContent.trim());
    table.querySelectorAll('tbody tr, tfoot tr').forEach(row => [...row.children].forEach((cell, index) => { cell.dataset.label = heads[index] || ''; }));
  });
}

const kpi = ({ label, value, note = '', tone = '', extra = '' }) => `<article class="${tone}"><span>${label}</span><b>${value}</b>${extra}${note ? `<small>${note}</small>` : ''}</article>`;
const sectionHead = (number, title, text) => `<div class="section-head"><span class="section-number">${number}</span><div><h2>${title}</h2><p>${text}</p></div></div>`;
const personName = person => `${segmentMark(person)}${esc(person.name)}`;

/* ---------- Agenda ---------- */

function renderSummary() {
  const dateLabel = capitalize(new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date()));
  const monthName = new Intl.DateTimeFormat('es-AR', { month: 'long' }).format(new Date());
  const today = visitsOn(0);
  const now = new Date().toTimeString().slice(0, 5);
  const nextVisit = today.scheduled.find(item => !item.time || item.time >= now);
  const leadsIn = (from, to) => people.filter(person => { const days = daysSince(firstContact(person)); return days >= from && days < to; }).length;
  const week = leadsIn(0, 7), previous = leadsIn(7, 14), trend = week - previous;
  const done = meetingsThisMonth(), ahead = meetingsAheadThisMonth();
  return `<div class="company-heading"><div><span class="eyebrow">${esc(dateLabel)}</span><h1>Resumen comercial</h1><p>Visitas, campañas y proyectos de un vistazo.</p></div><div class="heading-actions"><button class="admin-primary" data-action="new-contact">＋ Nuevo contacto</button></div></div>
    <div class="company-stats">
      ${kpi({ label: 'Visitas hoy', value: today.scheduled.length + today.done.length, note: nextVisit ? `Próxima: ${esc(nextVisit.time)} h · ${esc(firstName(nextVisit.person))}` : 'No quedan visitas por hoy' })}
      ${kpi({ label: 'Cartera activa', value: people.filter(isOpen).length, note: `▲ ${plural(inSegment('inversor').filter(isOpen).length, 'inversor', 'inversores')} · ● ${plural(inSegment('particular').filter(isOpen).length, 'particular', 'particulares')}` })}
      ${kpi({ label: 'Leads nuevos · 7 días', value: week, note: `<span class="trend ${trend >= 0 ? 'up' : 'down'}">${trend >= 0 ? '↑' : '↓'} ${Math.abs(trend)}</span> vs. semana anterior` })}
      ${kpi({ label: `Reuniones de ${monthName}`, value: `${done}<em>/ ${MONTHLY_MEETING_GOAL}</em>`, extra: `<div class="goal-bar" role="img" aria-label="${done} de ${MONTHLY_MEETING_GOAL} reuniones"><span style="width:${Math.min(100, (done / MONTHLY_MEETING_GOAL) * 100)}%"></span></div>`, note: ahead ? `${plural(ahead, 'más agendada', 'más agendadas')} este mes` : 'Ninguna más agendada este mes' })}
    </div>

    ${sectionHead('01', 'Visitas', 'Lo que pasó en los últimos tres días y lo que viene.')}
    <section class="admin-panel"><div class="admin-panel-head"><div><h2>Visitas por día</h2><p>Reuniones en el estudio, el showroom o la obra. Tocá un día para ver el detalle.</p></div>
      <ul class="chart-legend"><li><i class="done"></i>Realizada</li><li><i class="noshow"></i>No vino</li><li><i class="scheduled"></i>Agendada</li></ul></div>
      ${visitChart()}
    </section>

    ${sectionHead('02', 'Campañas y canales', 'Cuánto se invierte, qué vuelve y por dónde llegan las personas.')}
    <div class="company-columns wide-left">
      ${campaignsPanel()}
      ${originPanel()}
    </div>

    ${sectionHead('03', 'Proyectos', 'Stock, demanda y actividad de cada proyecto en venta.')}
    ${projectsOverview()}`;
}

function visitChart() {
  const days = [-3, -2, -1, 0, 1, 2, 3].map(offset => ({ offset, ...visitsOn(offset) }));
  const totals = days.map(day => day.done.length + day.noshow.length + day.scheduled.length);
  const max = Math.max(3, ...totals);
  const weekday = iso => capitalize(new Intl.DateTimeFormat('es-AR', { weekday: 'short' }).format(new Date(`${iso}T00:00`)).replace('.', ''));
  const segment = (count, kind) => count ? `<span class="visit-seg ${kind}" style="flex:${count}"></span>` : '';
  return `<div class="visit-chart">
    <div class="visit-gridlines" aria-hidden="true"><span></span><span></span><span></span><span></span></div>
    ${days.map((day, index) => {
      const total = totals[index];
      const parts = [day.done.length && plural(day.done.length, 'realizada', 'realizadas'), day.noshow.length && `${day.noshow.length} no vino`, day.scheduled.length && plural(day.scheduled.length, 'agendada', 'agendadas')].filter(Boolean);
      const label = day.offset === 0 ? 'Hoy' : weekday(day.date);
      return `<div class="visit-col ${day.offset === 0 ? 'is-today selected' : ''}" tabindex="0" role="img" aria-label="${esc(label)} ${esc(formatDate(day.date))}: ${esc(parts.join(', ') || 'sin visitas')}">
        <span class="visit-plot"><span class="visit-total">${total || ''}</span><span class="visit-bar" style="height:${(total / max) * 100}%">${segment(day.scheduled.length, 'scheduled')}${segment(day.noshow.length, 'noshow')}${segment(day.done.length, 'done')}</span></span>
        <span class="visit-day">${esc(label)}<small>${esc(day.date.slice(8))}/${esc(day.date.slice(5, 7))}</small></span>
        <span class="visit-tip" aria-hidden="true"><b>${esc(label)} ${esc(formatDate(day.date))}</b>${esc(parts.join(' · ') || 'Sin visitas')}</span>
      </div>`;
    }).join('')}
  </div>`;
}

function campaignsPanel() {
  const totals = CAMPAIGNS.reduce((sum, item) => ({ spend: sum.spend + item.spend, leads: sum.leads + item.leads, meetings: sum.meetings + item.meetings, sales: sum.sales + item.sales }), { spend: 0, leads: 0, meetings: 0, sales: 0 });
  const web = loadWebStats();
  const rate = (meetings, leads) => leads ? `${Math.round((meetings / leads) * 100)}%` : '—';
  return `<section class="admin-panel"><div class="admin-panel-head"><div><h2>Campañas en marcha</h2><p>Retorno medido en reuniones y ventas, no en clics.</p></div><span class="demo-label">Ejemplo · conectable con Meta Ads</span></div>
    <div class="table-scroll"><table class="data-table campaigns-table">
      <thead><tr><th>Campaña</th><th class="num">Invertido</th><th class="num">Leads</th><th class="num">$ por lead</th><th class="num">Reuniones</th><th class="num">Ventas</th></tr></thead>
      <tbody>${CAMPAIGNS.map(item => { const weak = item.leads >= 5 && item.meetings === 0; return `<tr class="${weak ? 'flagged' : ''}">
        <td><b>${esc(item.name)}</b><small class="cell-sub" title="Desde el ${esc(formatDate(item.since))}"><span class="platform">${esc(item.platform)}</span> · <span class="${item.status === 'Activa' ? 'is-live' : ''}">${esc(item.status)}</span></small>${weak ? '<small class="cell-alert">⚠ Trae consultas pero ninguna reunión</small>' : ''}</td>
        <td class="num">${ars(item.spend)}</td><td class="num">${item.leads}</td><td class="num">${ars(item.spend / item.leads)}</td>
        <td class="num">${item.meetings}<small class="cell-sub">${rate(item.meetings, item.leads)}</small></td><td class="num">${item.sales || '—'}</td>
      </tr>`; }).join('')}</tbody>
      <tfoot><tr><td>Total · ${CAMPAIGNS.filter(item => item.status === 'Activa').length} activas</td><td class="num">${ars(totals.spend)}</td><td class="num">${totals.leads}</td><td class="num">${ars(totals.spend / totals.leads)}</td><td class="num">${totals.meetings}<small class="cell-sub">${rate(totals.meetings, totals.leads)}</small></td><td class="num">${totals.sales}</td></tr></tfoot>
    </table></div>
    <p class="panel-foot">Sitio web, sin datos personales: ${web.vivienda} eligieron vivienda · ${web.inversion} eligieron inversión · ${web.visit} pidieron visita por WhatsApp.</p>
  </section>`;
}

function originPanel() {
  const data = originData(originMode);
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const radius = 54, circumference = 2 * Math.PI * radius, gap = data.length > 1 ? 2 : 0;
  let offset = 0;
  const arcs = data.map(item => {
    const length = (item.value / total) * circumference;
    const arc = `<circle class="donut-arc" r="${radius}" cx="70" cy="70" stroke="${item.color}" stroke-dasharray="${Math.max(length - gap, 0.5)} ${circumference}" stroke-dashoffset="${-offset}"><title>${esc(item.key)}: ${item.value} (${Math.round((item.value / total) * 100)}%)</title></circle>`;
    offset += length;
    return arc;
  }).join('');
  const max = Math.max(...data.map(item => item.value));
  const leaders = data.filter(item => item.value === max).map(item => item.key);
  const modeLabel = ORIGIN_MODES[originMode].toLowerCase();
  return `<section class="admin-panel"><div class="admin-panel-head"><div><h2>De dónde vienen</h2><p>Compará qué canal trae volumen y cuál trae reuniones.</p></div></div>
    <div class="segmented" role="tablist" aria-label="Medir por">${Object.entries(ORIGIN_MODES).map(([key, label]) => `<button role="tab" aria-selected="${key === originMode}" class="${key === originMode ? 'active' : ''}" data-action="origin-mode" data-mode="${key}">${label}</button>`).join('')}</div>
    ${total ? `<div class="donut-wrap">
      <svg class="donut" viewBox="0 0 140 140" role="img" aria-label="${esc(data.map(item => `${item.key} ${item.value}`).join(', '))}">${arcs}<text x="70" y="68" class="donut-total">${total}</text><text x="70" y="86" class="donut-caption">${esc(modeLabel)}</text></svg>
      <ul class="donut-legend">${data.map(item => `<li><i style="background:${item.color}"></i><span>${esc(item.key)}</span><b>${item.value}</b><small>${Math.round((item.value / total) * 100)}%</small></li>`).join('')}</ul>
    </div>
    <p class="panel-foot">${leaders.length === 1 ? `La mayor parte de los ${esc(modeLabel)} llega por <b>${esc(leaders[0])}</b> (${Math.round((max / total) * 100)}%).` : `Ningún canal domina: <b>${esc(listJoin(leaders))}</b> traen ${max} ${esc(modeLabel)} cada uno.`}</p>` : '<p class="admin-empty">Todavía no hay datos para este indicador.</p>'}
  </section>`;
}

function projectsOverview() {
  const list = projects.filter(project => detailFor(project).forSale && inventoryFor(project.id));
  const stale = list.filter(project => { const news = latestNews(project); return !news || daysSince(news.date) > 30; });
  return `<section class="admin-panel">
    <div class="table-scroll"><table class="data-table projects-table">
      <thead><tr><th>Proyecto</th><th>Etapa</th><th>Vendido</th><th>Interesados</th><th class="num">Reuniones · 30 días</th><th>Última novedad</th></tr></thead>
      <tbody>${list.map(project => {
        const inventory = inventoryFor(project.id);
        const soldPct = Math.round(((inventory.total - unsoldOf(inventory)) / inventory.total) * 100);
        const active = interestedIn(project.id).filter(isOpen);
        const count = segment => active.filter(person => segmentOf(person) === segment).length;
        const news = latestNews(project);
        const newsAge = news ? daysSince(news.date) : null;
        const scheduled = projectScheduled(project.id);
        return `<tr data-go="proyecto" data-id="${esc(project.id)}" tabindex="0">
          <td><b>${esc(project.name)}</b><small class="cell-sub">${esc(project.location)}</small></td>
          <td>${esc(STAGES[detailFor(project).stage].label)}</td>
          <td><span class="meter"><span style="width:${soldPct}%"></span></span><small class="cell-sub">${soldPct}% · quedan ${unsoldOf(inventory)} de ${inventory.total}</small></td>
          <td><span class="seg-count"><span class="seg-mark seg-inversor">▲</span>${count('inversor')}</span><span class="seg-count"><span class="seg-mark seg-particular">●</span>${count('particular')}</span></td>
          <td class="num">${projectMeetings(project.id)}${scheduled ? `<small class="cell-sub">＋${scheduled} agendada${scheduled === 1 ? '' : 's'}</small>` : ''}</td>
          <td class="${newsAge === null || newsAge > 30 ? 'cell-warn' : ''}">${news ? `Hace ${newsAge} días` : 'Sin novedades'}${newsAge === null || newsAge > 30 ? ' ⚠' : ''}</td>
        </tr>`;
      }).join('')}</tbody>
    </table></div>
    ${stale.length ? `<p class="panel-foot warn">⚠ ${plural(stale.length, 'proyecto lleva', 'proyectos llevan')} más de 30 días sin publicar novedades: ${esc(listJoin(stale.map(project => project.name)))}. Publicar algo nuevo es el mejor motivo para volver a escribirles a los interesados.</p>` : ''}
  </section>`;
}

/* ---------- Inversores y particulares ---------- */

const BOARD_COLUMNS = ['Nuevo contacto', 'En conversación', 'Información enviada', 'Visita agendada', 'En negociación', 'Cerró operación'];

function profileLine(person) {
  const profile = person.profile || {};
  return (segmentOf(person) === 'inversor'
    ? [profile.goal, profile.typology, profile.modality, profile.budget && `hasta ${usdShort(profile.budget)}`]
    : [profile.typology, profile.financing, profile.budget && `hasta ${usdShort(profile.budget)}`]).filter(Boolean).join(' · ');
}

function renderSegment(segment) {
  const all = inSegment(segment);
  const active = all.filter(isOpen);
  const query = listFilters.query.trim().toLowerCase();
  const list = all.filter(person => (!listFilters.project || person.projects.includes(listFilters.project))
      && (!query || [person.name, person.phone, person.notes, profileLine(person), ...projectNames(person)].join(' ').toLowerCase().includes(query)))
    .sort((a, b) => Number(!isOpen(a)) - Number(!isOpen(b)) || (a.nextAction ? actionKey(a.nextAction) : '9').localeCompare(b.nextAction ? actionKey(b.nextAction) : '9'));
  const isInvestor = segment === 'inversor';
  let stats;
  if (isInvestor) {
    const capital = people => people.reduce((sum, person) => sum + (person.profile?.budget || 0) * (person.profile?.units || 1), 0);
    const negotiating = active.filter(person => person.status === 'En negociación');
    const comparing = active.filter(person => person.projects.length > 1);
    const goal = name => active.filter(person => person.profile?.goal === name).length;
    stats = [
      kpi({ label: 'Inversores activos', value: active.length, note: `${plural(negotiating.length, 'en negociación', 'en negociación')}` }),
      kpi({ label: 'Capital potencial', value: usdShort(capital(active)), note: `En negociación: ${usdShort(capital(negotiating))}` }),
      kpi({ label: 'Buscan renta', value: goal('Renta'), note: `${goal('Revalorización')} buscan revalorización` }),
      kpi({ label: 'Comparando proyectos', value: comparing.length, note: comparing.length ? esc(comparing.map(person => `${firstName(person)}: ${projectNames(person).join(' vs. ')}`).join(' · ')) : 'Nadie compara entre proyectos' })
    ];
  } else {
    const upcoming = active.filter(person => isMeeting(person.nextAction) && dayDiff(person.nextAction.date) >= 0 && dayDiff(person.nextAction.date) <= 7)
      .sort((a, b) => actionKey(a.nextAction).localeCompare(actionKey(b.nextAction)));
    const blocked = active.filter(person => person.profile?.financing === 'Vende su propiedad');
    const closed = all.filter(person => person.status === 'Cerró operación' && daysSince(lastInteraction(person)?.date) <= 90);
    stats = [
      kpi({ label: 'Particulares activos', value: active.length, note: `${active.filter(person => isMeeting(person.nextAction)).length} con reunión agendada` }),
      kpi({ label: 'Visitas · próximos 7 días', value: upcoming.length, note: upcoming[0] ? `Próxima: ${esc(firstName(upcoming[0]))}, ${esc(actionWhen(upcoming[0].nextAction).toLowerCase())}` : 'Ninguna agendada' }),
      kpi({ label: 'Frenados por financiación', value: blocked.length, tone: blocked.length ? 'warn' : '', note: blocked.length ? `Necesitan vender antes de comprar: ${esc(blocked.map(firstName).join(', '))}` : 'Nadie depende de vender antes' }),
      kpi({ label: 'Cierres · 90 días', value: closed.length, note: closed.length ? esc(closed.map(person => person.name).join(', ')) : 'Sin cierres recientes' })
    ];
  }
  const projectOptions = projects.filter(project => all.some(person => person.projects.includes(project.id)));
  const board = !isInvestor && boardMode === 'board';
  return `<div class="company-heading"><div><span class="eyebrow">Cartera</span><h1>${SEGMENTS[segment].plural}</h1><p>${isInvestor ? 'Personas que compran para obtener renta o revalorización. Importa el ticket, el objetivo y qué proyectos comparan.' : 'Personas y familias que buscan dónde vivir. Importa la tipología, cómo van a pagar y qué los frena.'}</p></div><div class="heading-actions"><button class="admin-primary" data-action="new-contact" data-interest="${SEGMENTS[segment].interest}">＋ Nuevo ${SEGMENTS[segment].label.toLowerCase()}</button></div></div>
    <div class="company-stats">${stats.join('')}</div>
    <section class="admin-panel">
      <div class="filter-bar">
        <label class="people-search"><span aria-hidden="true">⌕</span><input id="list-search" type="search" value="${esc(listFilters.query)}" placeholder="Buscar por nombre, proyecto o lo que busca" aria-label="Buscar ${SEGMENTS[segment].plural.toLowerCase()}"></label>
        <select id="list-project" aria-label="Filtrar por proyecto"><option value="">Todos los proyectos</option>${projectOptions.map(project => `<option value="${esc(project.id)}" ${project.id === listFilters.project ? 'selected' : ''}>${esc(project.name)}</option>`).join('')}</select>
        ${isInvestor ? '' : `<div class="segmented compact" role="tablist" aria-label="Vista">${[['board', 'Tablero'], ['table', 'Tabla']].map(([key, label]) => `<button role="tab" aria-selected="${boardMode === key}" class="${boardMode === key ? 'active' : ''}" data-action="board-mode" data-mode="${key}">${label}</button>`).join('')}</div>`}
      </div>
      ${board ? boardView(list) : segmentTable(list, segment)}
    </section>`;
}

function segmentTable(list, segment) {
  const isInvestor = segment === 'inversor';
  if (!list.length) return '<p class="admin-empty">No hay contactos que coincidan con los filtros.</p>';
  return `<div class="table-scroll"><table class="data-table people-table">
    <thead><tr><th>${SEGMENTS[segment].label}</th><th>${isInvestor ? 'Ticket' : 'Presupuesto'}</th><th>Busca</th><th>Proyectos</th><th>Etapa</th><th>Último contacto</th><th>Próximo paso</th></tr></thead>
    <tbody>${list.map(person => {
      const profile = person.profile || {};
      const last = lastInteraction(person);
      const quiet = isOpen(person) && last && daysSince(last.date) > 7;
      return `<tr data-go="contacto" data-id="${esc(person.id)}" tabindex="0" class="${isOpen(person) ? '' : 'is-closed'}">
        <td><span class="cell-person">${avatar(person.name)}<span><b>${esc(person.name)}</b><small class="cell-sub">${esc(person.source)}${person.campaign ? ' · campaña' : ''}</small></span></span></td>
        <td class="num-left">${profile.budget ? `<b>${usdShort(profile.budget)}</b>` : '<span class="cell-sub">Sin dato</span>'}${isInvestor && profile.units > 1 ? `<small class="cell-sub">${profile.units} unidades</small>` : ''}</td>
        <td>${isInvestor ? `${esc(profile.goal || '—')}<small class="cell-sub">${esc([profile.typology, profile.modality].filter(Boolean).join(' · ') || 'Sin dato')}</small>` : `${esc(profile.typology || '—')}<small class="cell-sub ${profile.financing === 'Vende su propiedad' ? 'cell-alert' : ''}">${esc(profile.financing || 'Sin dato')}</small>`}</td>
        <td><span class="chip-list">${projectNames(person).map(name => `<span class="project-chip">${esc(name)}</span>`).join('') || '<span class="cell-sub">—</span>'}</span>${person.projects.length > 1 ? '<small class="cell-sub">Compara</small>' : ''}</td>
        <td>${statusChip(person.status)}</td>
        <td class="${quiet ? 'cell-warn' : ''}">${last ? `${esc(relativeDay(last.date))}${quiet ? ' ⚠' : ''}<small class="cell-sub">${esc(last.channel)}</small>` : '—'}</td>
        <td>${person.nextAction ? `<span class="cell-next">${esc(actionText(person.nextAction))}</span><span class="due-chip ${dueTone(person.nextAction.date)}">${esc(actionWhen(person.nextAction))}</span>` : `<span class="cell-sub">${isOpen(person) ? 'Sin próximo paso' : '—'}</span>`}</td>
      </tr>`;
    }).join('')}</tbody>
  </table></div>`;
}

function boardView(list) {
  const lost = list.filter(person => person.status === 'Sin interés por ahora');
  const card = person => {
    const profile = person.profile || {};
    return `<article class="board-card" draggable="true" data-drag="${esc(person.id)}" data-go="contacto" data-id="${esc(person.id)}" tabindex="0" aria-label="${esc(person.name)}">
      <div class="board-card-head"><b>${esc(person.name)}</b></div>
      <small>${esc(projectNames(person).join(' · ') || 'Sin proyecto')}</small>
      <div class="board-tags">${profile.typology ? `<span>${esc(profile.typology)}</span>` : ''}${profile.financing ? `<span class="${profile.financing === 'Vende su propiedad' ? 'blocked' : ''}">${profile.financing === 'Vende su propiedad' ? '⛔ ' : ''}${esc(profile.financing)}</span>` : ''}${profile.budget ? `<span>${usdShort(profile.budget)}</span>` : ''}</div>
      ${person.nextAction ? `<p class="board-next"><span class="due-chip ${dueTone(person.nextAction.date)}">${esc(actionWhen(person.nextAction))}</span>${esc(actionText(person.nextAction))}</p>` : isOpen(person) ? '<p class="board-next none">Sin próximo paso</p>' : ''}
    </article>`;
  };
  return `<p class="board-hint"><span class="hint-pointer">Arrastrá una tarjeta para cambiar la etapa. Tocala para abrir la ficha.</span><span class="hint-touch">Deslizá para ver cada etapa. Tocá una tarjeta para abrir la ficha y cambiarla de etapa.</span></p>
    <div class="board" style="grid-template-columns:${BOARD_COLUMNS.map(status => list.some(person => person.status === status) ? 'minmax(180px, 1fr)' : 'minmax(118px, 0.55fr)').join(' ')}">${BOARD_COLUMNS.map(status => { const cards = list.filter(person => person.status === status); return `<section class="board-col ${cards.length ? '' : 'is-empty'}" data-drop="${esc(status)}"><header>${statusChip(status)}<span>${cards.length}</span></header>${cards.map(card).join('') || '<p class="board-empty">Sin contactos</p>'}</section>`; }).join('')}</div>
    ${lost.length ? `<p class="panel-foot">${plural(lost.length, 'contacto', 'contactos')} sin interés por ahora: ${lost.map(person => `<button class="inline-link" data-go="contacto" data-id="${esc(person.id)}">${esc(person.name)}</button>`).join(', ')}.</p>` : ''}`;
}

function setStatus(person, status) {
  person.history.push({ date: todayIso(), channel: 'Estado', note: `Cambió de “${person.status}” a “${status}”.` });
  person.status = status;
  saveData(); renderCompany(); toast(`${firstName(person)}: ${status.toLowerCase()}`);
}

/* ---------- Ficha del contacto ---------- */

function nextCard(person) {
  const meeting = isMeeting(person.nextAction) ? person.nextAction : null;
  if (meeting) return `<section class="next-card"><span class="eyebrow">Reunión · ${esc(actionWhen(meeting))}</span><h3>${esc(meeting.text)}</h3><p>${esc(formatDate(meeting.date))} a las ${esc(meeting.time)} h en ${esc(MEETING_PLACES[meeting.place] || meeting.place)}</p><div class="next-actions"><button class="admin-primary admin-small" data-action="complete" data-id="${esc(person.id)}">Registrar cómo fue</button><button class="admin-link" data-action="meeting" data-id="${esc(person.id)}">Reprogramar</button></div></section>`;
  if (person.nextAction) return `<section class="next-card"><span class="eyebrow">Próximo paso · ${esc(relativeDay(person.nextAction.date))}</span><h3>${esc(person.nextAction.text)}</h3><p>${esc(formatDate(person.nextAction.date))}</p><div class="next-actions"><button class="admin-primary admin-small" data-action="complete" data-id="${esc(person.id)}">Registrar lo que pasó</button><button class="admin-link" data-action="set-next" data-id="${esc(person.id)}">Reprogramar</button></div></section>`;
  return `<section class="next-card empty"><span class="eyebrow">Próximo paso</span><h3>No tiene un próximo paso.</h3><p>Definí qué hacer y cuándo, para que la relación no pierda continuidad.</p><div class="next-actions"><button class="admin-primary admin-small" data-action="set-next" data-id="${esc(person.id)}">Definir próximo paso</button></div></section>`;
}

function renderContact(person) {
  const segment = segmentOf(person);
  const profile = person.profile || {};
  const first = firstContact(person);
  const fill = value => value ? esc(value) : `<button class="inline-link muted" data-action="edit-contact" data-id="${esc(person.id)}">Completar</button>`;
  const rows = segment === 'inversor'
    ? [['Ticket', profile.budget ? `${usd(profile.budget)}${profile.units > 1 ? ` · ${profile.units} unidades` : ''}` : ''], ['Objetivo', profile.goal], ['Modalidad', profile.modality], ['Tipología', profile.typology]]
    : [['Presupuesto', usd(profile.budget)], ['Tipología', profile.typology], ['Financiación', profile.financing]];
  rows.push(['Contacto desde', first ? `${formatDate(first)} (${relativeDay(first).toLowerCase()})` : '']);
  const back = view.back || { name: segment === 'inversor' ? 'inversores' : 'particulares' };
  const backLabel = back.name === 'proyecto' ? projectById(back.id)?.name || 'el proyecto' : { agenda: 'el resumen', inversores: 'inversores', particulares: 'particulares' }[back.name] || 'el resumen';
  return `<button class="admin-back" data-action="contact-back">← Volver a ${esc(backLabel)}</button>
    <header class="contact-hero">
      ${avatar(person.name, 'large')}
      <div class="contact-hero-copy">
        <div class="contact-tags">${segmentBadge(person)}${statusChip(person.status)}</div>
        <h1>${esc(person.name)}</h1>
        <p>+${esc(person.phone)}${person.email ? ` · ${esc(person.email)}` : ''}${first ? ` · Contacto desde ${esc(formatDate(first))}` : ''}</p>
      </div>
      <div class="contact-hero-actions">
        <label class="status-field"><span>Etapa</span><select id="contact-status-select" class="status-select">${options(STATUSES, person.status)}</select></label>
        <a class="admin-secondary" href="${esc(whatsappUrl(person.phone))}" target="_blank" rel="noopener">WhatsApp ↗</a>
        <button class="admin-secondary" data-action="meeting" data-id="${esc(person.id)}">Agendar reunión</button>
        <button class="admin-secondary" data-action="edit-contact" data-id="${esc(person.id)}">Editar</button>
      </div>
    </header>
    <div class="contact-next">${nextCard(person)}</div>
    <div class="contact-trio">
      <section class="admin-panel"><div class="admin-panel-head"><div><h2>Datos comerciales</h2><p>Lo que hay que saber antes de ofrecerle algo.</p></div></div>
        <dl class="summary-grid">
          ${rows.map(([label, value]) => `<div><dt>${label}</dt><dd>${fill(value)}</dd></div>`).join('')}
        </dl>
      </section>
      ${showroomPanel(person)}
      ${teamCard(person)}
    </div>
    <div class="contact-layout">
      ${activityPanel(person)}
      ${notesPanel(person)}
    </div>`;
}

// Lo que el equipo ve de un vistazo: qué busca, qué le interesa, cómo llegó y qué hizo en su showroom.
function teamCard(person) {
  const campaign = campaignById(person.campaign);
  const chose = (person.signals || []).some(signal => signal.type === 'profile');
  const journey = person.journey?.length ? person.journey : [person.source, campaign && `campaña “${campaign.name}”`].filter(Boolean);
  const recent = [...(person.signals || [])].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 2);
  return `<section class="team-card">
    <div class="team-card-bar"><span class="live-dot"></span>MARQ Contigo · Lo que sabe el equipo</div>
    <dl class="team-card-rows">
      <div><dt>Busca</dt><dd><b>${esc(person.interest === 'Inversión' ? 'Inversión' : 'Vivienda propia')}</b>${chose ? '<span class="auto-tag">Lo eligió en su showroom</span>' : ''}</dd></div>
      <div><dt>Le interesa</dt><dd class="chip-list">${person.projects.map(id => projectById(id) ? `<button class="project-chip" data-go="proyecto" data-id="${esc(id)}">${esc(projectById(id).name)}</button>` : '').join('') || '<span class="cell-sub">Sin proyecto</span>'}</dd></div>
      <div><dt>Cómo llegó</dt><dd>${journey.map(esc).join(' <span class="journey-arrow">→</span> ')}</dd></div>
      <div><dt>Actividad</dt><dd>${recent.length ? recent.map(signal => `<span class="activity-line ${isStrong(signal) ? 'strong' : ''}">${esc(signal.label)} · ${esc(relativeTime(signal.at).toLowerCase())}</span>`).join('') : '<span class="cell-sub">Todavía no abrió su showroom</span>'}</dd></div>
    </dl>
  </section>`;
}

function activityPanel(person) {
  const events = [
    ...person.history.map(item => ({ at: `${item.date}T12:00`, meta: `${formatDate(item.date)} · ${item.channel}`, text: item.note, kind: item.channel === 'Estado' ? 'state' : '', badge: item.visit === 'done' ? '<span class="status-chip tone-done">Reunión realizada</span>' : item.visit === 'noshow' ? '<span class="status-chip tone-warm">No vino</span>' : '' })),
    ...(person.signals || []).map(signal => ({ at: signal.at, meta: `${relativeTime(signal.at)} · Showroom`, text: signal.label, kind: isStrong(signal) ? 'signal strong' : 'signal', badge: '' }))
  ].sort((a, b) => b.at.localeCompare(a.at));
  return `<section class="admin-panel"><div class="admin-panel-head"><div><h2>Actividad</h2><p>${plural(person.history.length, 'interacción', 'interacciones')} del equipo y ${plural((person.signals || []).length, 'acción', 'acciones')} en su showroom, en una sola línea de tiempo.</p></div><button class="admin-secondary admin-small" data-action="log" data-id="${esc(person.id)}">＋ Registrar interacción</button></div>
    <ol class="timeline">${events.map(item => `<li class="${item.kind}"><span class="timeline-meta">${esc(item.meta)}</span><p>${esc(item.text)}</p>${item.badge}</li>`).join('')}</ol>
  </section>`;
}

// Recomendaciones para el showroom: proyectos en venta para su perfil, priorizando lo que consultó
// y las tipologías que entran en su presupuesto.
function recommendProjects(person) {
  const profileKey = segmentOf(person) === 'inversor' ? 'inversion' : 'vivienda';
  const profile = person.profile || {};
  const scored = projects.filter(project => detailFor(project).forSale && detailFor(project).profiles.includes(profileKey)).map(project => {
    const detail = detailFor(project);
    const inventory = inventoryFor(project.id);
    const fits = matchUnits(person, inventory);
    const reasons = [];
    let score = 0;
    if (person.projects.includes(project.id)) { reasons.push('Consultó por este proyecto'); score += 3; }
    if (fits.length) { reasons.push(`${fits[0].typology} desde ${usdShort(fits[0].from)}: entra en lo que busca`); score += 2; }
    else if (inventory && profile.typology && !inventory.types.some(type => type.typology === profile.typology)) score -= 2;
    if (profileKey === 'inversion') {
      const stage = STAGES[detail.stage];
      if ((detail.stage === 'preventa' && profile.modality !== 'Terminado') || (detail.stage === 'posventa' && profile.modality !== 'En pozo') || detail.stage === 'lotes') { reasons.push(`${stage.label}: ${stage.short}`); score += 1; }
    } else if (detail.livingHint) {
      reasons.push(detail.livingHint);
      score += 0.5;
    }
    return { project, score, reasons };
  }).sort((a, b) => b.score - a.score);
  const strong = scored.filter(item => item.score >= 2);
  return (strong.length >= 2 ? strong : scored).slice(0, 4);
}

function showroomMessage(person) {
  const picks = (person.showroom?.projects || []).map(id => projectById(id)?.name).filter(Boolean);
  return `Hola ${firstName(person)}, ¿cómo estás? Te preparé un espacio con ${picks.length ? `${listJoin(picks)}, elegidos para vos` : 'nuestros proyectos'}: precios, financiación y el equipo que lo hace posible. Miralo cuando quieras: ${showroomUrl(person)}`;
}

function showroomPanel(person) {
  const showroom = person.showroom;
  const head = `<div class="admin-panel-head"><div><h2>Showroom personal</h2><p>Un link propio para ${esc(firstName(person))}: lo que haga ahí aparece en su actividad.</p></div>${showroom ? `<button class="admin-link" data-action="generate-showroom" data-id="${esc(person.id)}">Rehacer</button>` : ''}</div>`;
  if (!showroom) {
    return `<section class="admin-panel showroom-empty">${head}
      <p class="showroom-intro">Todavía no tiene showroom. Generalo y elegí qué proyectos verá primero: te sugerimos los que mejor encajan con su perfil.</p>
      <button class="admin-primary" data-action="generate-showroom" data-id="${esc(person.id)}">Generar showroom</button>
    </section>`;
  }
  const url = showroomUrl(person);
  return `<section class="admin-panel">${head}
    <div class="showroom-picks"><span>Elegidos para ${esc(firstName(person))}</span><div class="chip-list">${showroom.projects.map(id => projectById(id) ? `<button class="project-chip" data-go="proyecto" data-id="${esc(id)}">${esc(projectById(id).name)}</button>` : '').join('')}</div></div>
    <div class="showroom-link"><input readonly value="${esc(url)}" aria-label="Link del showroom de ${esc(person.name)}"><button class="admin-secondary admin-small" data-action="copy-link" data-id="${esc(person.id)}">Copiar</button></div>
    <div class="showroom-actions"><a class="admin-primary admin-small" href="${esc(whatsappUrl(person.phone, showroomMessage(person)))}" target="_blank" rel="noopener">Enviar por WhatsApp ↗</a><a class="admin-secondary admin-small" href="${esc(url)}" target="_blank" rel="noopener">Ver como cliente ↗</a></div>
  </section>`;
}

function openShowroomDialog(person) {
  const recommendations = recommendProjects(person);
  const current = person.showroom?.projects;
  openDialog({
    eyebrow: person.name,
    title: current ? 'Rehacer showroom' : 'Generar showroom',
    intro: `Estos son los proyectos que mejor encajan con ${firstName(person)}. Elegí cuáles verá primero en su showroom; el resto del catálogo queda disponible más abajo.`,
    fields: `<div class="reco-list">${recommendations.map(({ project, reasons }, index) => `<label class="reco-card">
        <input type="checkbox" name="picks" value="${esc(project.id)}" ${(current ? current.includes(project.id) : index < 3) ? 'checked' : ''}>
        <img src="${esc(project.image)}" alt="" loading="lazy">
        <span class="reco-copy"><b>${esc(project.name)}</b><small>${esc(STAGES[detailFor(project).stage].label)} · ${esc(project.location)}</small>
          ${reasons.length ? `<ul>${reasons.map(reason => `<li>${esc(reason)}</li>`).join('')}</ul>` : ''}</span>
      </label>`).join('')}</div>`,
    submitLabel: current ? 'Guardar showroom' : 'Generar showroom',
    onSubmit: form => {
      const picks = form.getAll('picks');
      person.showroom = { projects: picks, at: todayIso() };
      person.history.push({ date: todayIso(), channel: 'Showroom', note: `Se ${current ? 'actualizó' : 'generó'} su showroom${picks.length ? ` con ${listJoin(picks.map(id => projectById(id)?.name).filter(Boolean))}` : ''}.` });
      person.history.sort((a, b) => a.date.localeCompare(b.date));
      toast(current ? 'Showroom actualizado' : 'Showroom generado: ya podés enviarlo');
    }
  });
}

function notesPanel(person) {
  const relatedNews = projects.filter(project => person.projects.includes(project.id))
    .flatMap(project => (project.news || []).map(news => ({ project, news })))
    .sort((a, b) => b.news.date.localeCompare(a.news.date)).slice(0, 3);
  return `<section class="admin-panel"><div class="admin-panel-head"><div><h2>Notas</h2></div><button class="admin-link" data-action="edit-contact" data-id="${esc(person.id)}">Editar</button></div>
    <p class="notes-text">${esc(person.notes) || '<span class="cell-sub">Sin notas.</span>'}</p>
    <h3 class="group-title">Novedades de sus proyectos</h3>
    ${relatedNews.length ? relatedNews.map(({ project, news }) => `<article class="admin-update"><span>${esc(formatDate(news.date))} · ${esc(project.name)}</span><h3>${esc(news.title)}</h3></article>`).join('') : '<p class="admin-empty">Sus proyectos todavía no tienen novedades.</p>'}
  </section>`;
}

/* ---------- Tablero de proyecto ---------- */

function matchUnits(person, inventory) {
  if (!inventory) return [];
  const profile = person.profile || {};
  return inventory.types.filter(type => type.available > 0 && (!profile.typology || type.typology === profile.typology) && (!profile.budget || type.from <= profile.budget * 1.1));
}

function renderProject(project) {
  const detail = detailFor(project);
  const inventory = inventoryFor(project.id);
  const interested = interestedIn(project.id);
  const active = interested.filter(isOpen);
  const bought = interested.filter(person => person.status === 'Cerró operación').length;
  const count = segment => active.filter(person => segmentOf(person) === segment).length;
  const meetings = projectMeetings(project.id), scheduled = projectScheduled(project.id);
  const unsold = inventory ? unsoldOf(inventory) : 0;
  const soldPct = inventory ? Math.round(((inventory.total - unsold) / inventory.total) * 100) : 0;
  const buyers = active.map(person => ({ person, matches: matchUnits(person, inventory) }))
    .sort((a, b) => Number(!a.matches.length) - Number(!b.matches.length));
  const demand = typology => active.filter(person => person.profile?.typology === typology).length;
  return `<button class="admin-back" data-go="agenda">← Volver al resumen</button>
    <div class="company-heading"><div><span class="eyebrow">${esc(project.category)} · ${esc(STAGES[detail.stage].label)}${project.year ? ` · ${esc(project.year)}` : ''}</span><h1>${esc(project.name)}</h1><p>${esc(project.location)} · ${esc(project.status)}</p></div><div class="heading-actions"><button class="admin-primary" data-action="add-news">＋ Publicar novedad</button></div></div>
    <div class="company-stats">
      ${inventory ? kpi({ label: 'Stock sin vender', value: `${unsold}<em>de ${inventory.total}</em>`, extra: `<div class="goal-bar" role="img" aria-label="${soldPct}% vendido"><span style="width:${soldPct}%"></span></div>`, note: `${soldPct}% vendido` }) : kpi({ label: 'Stock sin vender', value: '—', note: 'Sin stock cargado' })}
      ${kpi({ label: 'Interesados activos', value: active.length, note: `▲ ${plural(count('inversor'), 'inversor', 'inversores')} · ● ${plural(count('particular'), 'particular', 'particulares')}` })}
      ${inventory ? kpi({ label: 'Ritmo de venta', value: `${String(inventory.salesPerMonth).replace('.', ',')}<em>u./mes</em>`, note: `~${plural(Math.ceil(unsold / inventory.salesPerMonth), 'mes', 'meses')} para vender lo que queda` }) : kpi({ label: 'Ritmo de venta', value: '—' })}
      ${kpi({ label: 'Reuniones · 30 días', value: meetings, tone: !meetings && active.length ? 'alert' : '', note: scheduled ? `${plural(scheduled, 'agendada', 'agendadas')} a futuro` : active.length && !meetings ? 'Hay interesados pero ninguna reunión' : 'Ninguna agendada' })}
    </div>
    ${followup && followup.projectId === project.id ? renderFollowup(project) : ''}
    <div class="company-columns">
      <div class="admin-stack">
        <section class="admin-panel"><div class="admin-panel-head"><div><h2>Stock por tipología</h2><p>Lo que queda por vender, cruzado con lo que buscan los interesados.</p></div></div>
          ${inventory ? `<div class="table-scroll"><table class="data-table stock-table">
            <thead><tr><th>Tipología</th><th class="num">m²</th><th class="num">Desde</th><th class="num">Disponibles</th><th class="num">Reservadas</th><th class="num">Interesados</th></tr></thead>
            <tbody>${inventory.types.map(type => `<tr><td><b>${esc(type.typology)}</b></td><td class="num">${type.m2}</td><td class="num">${usd(type.from)}</td><td class="num">${type.available}</td><td class="num">${type.reserved || '—'}</td><td class="num">${demand(type.typology) ? `<span class="demand">${demand(type.typology)}</span>` : '<span class="cell-sub">0</span>'}</td></tr>`).join('')}</tbody>
          </table></div><p class="panel-foot">Stock de ejemplo. En producción lo actualizaría administración con cada reserva o boleto.</p>` : '<p class="admin-empty">Este proyecto todavía no tiene stock cargado.</p>'}
        </section>
        <section class="admin-panel"><div class="admin-panel-head"><div><h2>Novedades publicadas</h2><p>Visibles en la ficha pública. Cada una es un motivo para volver a escribir.</p></div></div>
          ${project.news?.length ? project.news.map(item => `<article class="admin-update"><span>${esc(formatDate(item.date))} · ${esc(item.type)}</span><h3>${esc(item.title)}</h3><p>${esc(item.body)}</p><button class="admin-link" data-action="start-followup" data-news="${esc(item.id)}">Avisar a interesados →</button></article>`).join('') : '<div class="admin-empty">Todavía no hay novedades. Publicá la primera actualización del proyecto.</div>'}
        </section>
      </div>
      <section class="admin-panel"><div class="admin-panel-head"><div><h2>Quién puede comprar</h2><p>Interesados activos y qué unidad encaja con lo que buscan.</p></div></div>
        ${buyers.length ? buyers.map(({ person, matches }) => `<button class="buyer-row" data-go="contacto" data-id="${esc(person.id)}">
          ${avatar(person.name)}
          <span class="buyer-copy"><b>${segmentMark(person)}${esc(person.name)}</b><small>${esc(profileLine(person) || 'Perfil sin completar')}</small>
            <span class="buyer-match ${matches.length ? 'ok' : 'none'}">${matches.length ? `→ Encaja: ${esc(matches.map(type => `${type.typology} desde ${usdShort(type.from)} (${type.available} disp.)`).join(' · '))}` : inventory ? 'Ninguna unidad disponible encaja con lo que busca' : 'Sin stock cargado para comparar'}</span></span>
          ${statusChip(person.status)}
        </button>`).join('') : '<p class="admin-empty">No hay interesados activos en este proyecto.</p>'}
        ${bought ? `<p class="panel-foot">${plural(bought, 'persona ya compró', 'personas ya compraron')} en este proyecto: pueden recomendarlo.</p>` : ''}
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
      ${candidates.length ? `<div class="select-list">${candidates.map(person => { const last = lastInteraction(person); return `<label class="person-row select-row"><input type="checkbox" data-select="${esc(person.id)}" ${followup.selected.includes(person.id) ? 'checked' : ''}>${avatar(person.name)}<span class="associated-copy"><b>${personName(person)}</b><small>${esc(SEGMENTS[segmentOf(person)].label)} · Última interacción: ${last ? esc(relativeDay(last.date).toLowerCase()) : '—'}</small></span>${statusChip(person.status)}</label>`; }).join('')}</div>
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
const projectChecks = selected => `<fieldset class="check-group"><legend>Proyectos de interés</legend>${projects.filter(project => detailFor(project).forSale || selected.includes(project.id)).map(project => `<label><input type="checkbox" name="projects" value="${esc(project.id)}" ${selected.includes(project.id) ? 'checked' : ''}> ${esc(project.name)}</label>`).join('')}</fieldset>`;
const nextActionFields = action => `<div class="field-row wide-first">${field('Próximo paso', `<input name="nextText" maxlength="120" value="${esc(action?.text || '')}" placeholder="Ej. Enviar planos y precios">`)}${field('Fecha', `<input type="date" name="nextDate" value="${esc(action?.date || daysFromToday(2))}">`)}</div><p class="field-hint">Dejalo vacío si por ahora no hay nada pendiente.</p>`;
const readNextAction = form => {
  const text = String(form.get('nextText') || '').trim();
  return text ? { text, date: form.get('nextDate') || daysFromToday(2) } : null;
};
const optionalOptions = (list, selected, empty = 'Sin definir') => `<option value="">${empty}</option>${list.map(item => `<option ${item === selected ? 'selected' : ''}>${esc(item)}</option>`).join('')}`;
const SEGMENT_OPTIONS = [['Vivienda propia', '● Particular'], ['Inversión', '▲ Inversor']];

function openDialog({ eyebrow = '', title, intro = '', fields, submitLabel, onSubmit, onOpen }) {
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
  onOpen?.(backdrop.querySelector('form'));
  backdrop.querySelector('input:not([type=checkbox]),textarea,select')?.focus();
}

function openLogDialog(person, completing = false) {
  const meeting = completing && isMeeting(person.nextAction) ? person.nextAction : null;
  // Registrar otra interacción no reemplaza una reunión agendada.
  const keepMeeting = !completing && isMeeting(person.nextAction);
  openDialog({
    eyebrow: person.name,
    title: meeting ? 'Registrar cómo fue la reunión' : completing ? 'Registrar lo que pasó' : 'Registrar interacción',
    intro: meeting ? `Reunión del ${formatDate(meeting.date)} a las ${meeting.time} h en ${MEETING_PLACES[meeting.place] || meeting.place}.` : completing ? `Paso pendiente: ${person.nextAction.text}` : 'Anotá qué se habló, para que cualquiera del equipo pueda retomar la conversación.',
    fields: `${meeting ? field('Resultado', '<select name="result"><option value="done">Se hizo la reunión</option><option value="noshow">No vino</option></select>') : ''}
      <div class="field-row">${field('Fecha', `<input type="date" name="date" value="${meeting && dayDiff(meeting.date) < 0 ? meeting.date : todayIso()}" required>`)}${field('Canal', `<select name="channel">${options(CHANNELS, meeting ? 'Reunión' : 'WhatsApp')}</select>`)}</div>
      ${field(meeting ? '¿Cómo fue?' : '¿Qué pasó?', `<textarea name="note" required maxlength="500" placeholder="${meeting ? 'Ej. Vinieron con la familia. Les gustó el piso 8 y piden una propuesta de pago.' : 'Ej. Le envié los planos. Quiere visitar el showroom el sábado.'}"></textarea>`)}
      ${field('Etapa de la conversación', `<select name="status">${options(STATUSES, person.status)}</select>`)}
      <p class="dialog-section">Próximo paso</p>${keepMeeting ? `<p class="field-hint">Sigue en pie la reunión del ${esc(formatDate(person.nextAction.date))} a las ${esc(person.nextAction.time)} h.</p>` : nextActionFields(completing ? null : person.nextAction)}`,
    submitLabel: 'Guardar',
    onSubmit: form => {
      const entry = { date: form.get('date'), channel: form.get('channel'), note: String(form.get('note')).trim() };
      if (meeting) Object.assign(entry, { visit: form.get('result') === 'noshow' ? 'noshow' : 'done', projectId: meeting.projectId });
      person.history.push(entry);
      person.history.sort((a, b) => a.date.localeCompare(b.date));
      person.status = form.get('status');
      if (!keepMeeting) person.nextAction = readNextAction(form);
      toast(meeting ? (entry.visit === 'done' ? 'Reunión registrada' : 'Registrado: no vino a la reunión') : 'Interacción registrada');
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

function openMeetingDialog(person) {
  const current = isMeeting(person.nextAction) ? person.nextAction : null;
  const replaced = person.nextAction && !current ? person.nextAction.text : '';
  const selectedProject = current ? current.projectId : person.projects[0];
  const projectOptions = projects.map(project => `<option value="${esc(project.id)}" ${project.id === selectedProject ? 'selected' : ''}>${esc(project.name)}</option>`).join('');
  openDialog({
    eyebrow: person.name,
    title: current ? 'Reprogramar reunión' : 'Agendar reunión',
    intro: replaced ? `Reemplaza el próximo paso actual: “${replaced}”.` : 'La reunión aparece en el gráfico de visitas y como próximo paso con este contacto.',
    fields: `<div class="field-row">${field('Fecha', `<input type="date" name="date" required value="${esc(current?.date || daysFromToday(1))}">`)}${field('Hora', `<input type="time" name="time" required value="${esc(current?.time || '10:00')}">`)}</div>
      <div class="field-row">${field('Lugar', `<select name="place">${options(Object.keys(MEETING_PLACES), current?.place || 'Estudio')}</select>`)}${field('Proyecto', `<select name="projectId"><option value="">Sin proyecto puntual</option>${projectOptions}</select>`)}</div>`,
    submitLabel: current ? 'Guardar cambios' : 'Agendar reunión',
    onSubmit: form => {
      const place = form.get('place'), project = projectById(form.get('projectId'));
      const meeting = { kind: 'meeting', text: `Reunión en ${MEETING_PLACES[place]}${project ? ` · ${project.name}` : ''}`, date: form.get('date'), time: form.get('time'), place, projectId: project?.id || '' };
      person.history.push({ date: todayIso(), channel: 'Agenda', note: `${current ? 'Se reprogramó la reunión' : 'Se agendó una reunión'} en ${MEETING_PLACES[place]} para el ${formatDate(meeting.date)} a las ${meeting.time} h.` });
      person.history.sort((a, b) => a.date.localeCompare(b.date));
      person.nextAction = meeting;
      if (STATUSES.indexOf(person.status) < STATUSES.indexOf('Visita agendada')) person.status = 'Visita agendada';
      toast(current ? 'Reunión reprogramada' : 'Reunión agendada');
    }
  });
}

function openContactDialog(person = null, presetInterest = '') {
  const profile = person?.profile || {};
  const interest = person?.interest === 'Inversión' || presetInterest === 'Inversión' ? 'Inversión' : 'Vivienda propia';
  openDialog({
    eyebrow: 'MARQ Contigo',
    title: person ? 'Editar contacto' : 'Nuevo contacto',
    intro: person ? '' : 'Registrá a la persona después del primer contacto, con lo que ya sabés de ella. Todo el perfil es opcional.',
    fields: `${field('Nombre y apellido', `<input name="name" required maxlength="80" value="${esc(person?.name || '')}">`)}
      <div class="field-row">${field('Teléfono (con código de país)', `<input name="phone" required inputmode="tel" value="${esc(person?.phone || '')}" placeholder="5493624…">`)}${field('Email', `<input type="email" name="email" value="${esc(person?.email || '')}" placeholder="Opcional">`)}</div>
      <div class="field-row">${field('Segmento', `<select name="interest">${SEGMENT_OPTIONS.map(([value, label]) => `<option value="${value}" ${value === interest ? 'selected' : ''}>${label}</option>`).join('')}</select>`)}${field('Primer contacto por', `<select name="source">${options(CHANNELS, person?.source || 'WhatsApp')}</select>`)}</div>
      ${field('Campaña', `<select name="campaign"><option value="">Sin campaña</option>${CAMPAIGNS.map(item => `<option value="${item.id}" ${item.id === person?.campaign ? 'selected' : ''}>${esc(item.name)} · ${esc(item.platform)}</option>`).join('')}</select>`)}
      <p class="dialog-section">Perfil comercial</p>
      <div class="field-row">${field('Presupuesto (USD)', `<input type="number" name="budget" min="0" step="1000" value="${esc(profile.budget || '')}" placeholder="Ej. 90000">`)}${field('Tipología', `<select name="typology">${optionalOptions(TYPOLOGIES, profile.typology)}</select>`)}</div>
      <div class="field-row" data-for="particular">${field('Financiación', `<select name="financing">${optionalOptions(FINANCING, profile.financing)}</select>`)}</div>
      <div class="field-row three" data-for="inversor">${field('Objetivo', `<select name="goal">${optionalOptions(GOALS, profile.goal)}</select>`)}${field('Modalidad', `<select name="modality">${optionalOptions(MODALITIES, profile.modality)}</select>`)}${field('Unidades', `<input type="number" name="units" min="1" max="50" value="${esc(profile.units || '')}" placeholder="1">`)}</div>
      ${projectChecks(person?.projects || [])}
      ${person ? field('Notas', `<textarea name="notes" maxlength="500">${esc(person.notes)}</textarea>`) : `${field('¿Qué consultó?', '<textarea name="firstNote" required maxlength="500" placeholder="Ej. Preguntó por lotes con vista a la laguna."></textarea>')}<p class="dialog-section">Próximo paso</p>${nextActionFields(null)}`}`,
    submitLabel: person ? 'Guardar cambios' : 'Crear contacto',
    onOpen: form => {
      const sync = () => {
        const segment = form.elements.interest.value === 'Inversión' ? 'inversor' : 'particular';
        form.querySelectorAll('[data-for]').forEach(row => { row.hidden = row.dataset.for !== segment; });
      };
      form.elements.interest.addEventListener('change', sync);
      sync();
    },
    onSubmit: form => {
      const segment = form.get('interest') === 'Inversión' ? 'inversor' : 'particular';
      const nextProfile = { budget: Number(form.get('budget')) || undefined, typology: form.get('typology') || undefined };
      if (segment === 'particular') nextProfile.financing = form.get('financing') || undefined;
      if (segment === 'inversor') Object.assign(nextProfile, { goal: form.get('goal') || undefined, modality: form.get('modality') || undefined, units: Number(form.get('units')) || undefined });
      Object.keys(nextProfile).forEach(key => nextProfile[key] === undefined && delete nextProfile[key]);
      const data = { name: String(form.get('name')).trim(), phone: String(form.get('phone')).replace(/\D/g, ''), email: String(form.get('email')).trim(), interest: form.get('interest'), source: form.get('source'), campaign: form.get('campaign') || undefined, projects: form.getAll('projects'), profile: nextProfile };
      if (person) { Object.assign(person, data, { notes: String(form.get('notes')).trim() }); toast('Contacto actualizado'); return; }
      const created = { id: `p${Date.now()}`, ...data, status: 'Nuevo contacto', notes: '', nextAction: readNextAction(form), history: [{ date: todayIso(), channel: data.source, note: String(form.get('firstNote')).trim() }], signals: [] };
      people.push(created);
      view = { name: 'contacto', id: created.id, back: view.name === 'contacto' ? view.back : { name: view.name, id: view.id } };
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
  if (destination === 'contacto') { go({ name: 'contacto', id, back: view.name === 'contacto' ? view.back : { name: view.name, id: view.id } }); return; }
  if (destination) { go(destination === 'proyecto' ? { name: destination, id } : { name: destination }); return; }
  const person = personById(id);
  const project = projectById(view.id);
  if (action === 'exit') setMode(false);
  else if (action === 'contact-back') go(view.back || { name: 'agenda' });
  else if (action === 'origin-mode') { originMode = target.dataset.mode; renderCompany(); }
  else if (action === 'board-mode') { boardMode = target.dataset.mode; renderCompany(); }
  else if (action === 'generate-showroom') openShowroomDialog(person);
  else if (action === 'copy-link') {
    navigator.clipboard?.writeText(showroomUrl(person)).then(() => toast('Link del showroom copiado'), () => toast('No se pudo copiar el link'));
  }
  else if (action === 'reset') {
    if (!confirm('¿Restablecer los datos de ejemplo? Se borran los contactos, interacciones y novedades cargados en esta demo.')) return;
    projects = structuredClone(initialProjects); people = structuredClone(initialPeople); followup = null;
    saveData(); renderProjects(); go({ name: 'agenda' });
  }
  else if (action === 'new-contact') openContactDialog(null, target.dataset.interest);
  else if (action === 'edit-contact') openContactDialog(person);
  else if (action === 'complete') openLogDialog(person, true);
  else if (action === 'log') openLogDialog(person);
  else if (action === 'set-next') openNextDialog(person);
  else if (action === 'meeting') openMeetingDialog(person);
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
  } else if (target.id === 'list-project') {
    listFilters.project = target.value;
    renderCompany();
  } else if (target.id === 'contact-status-select') {
    setStatus(personById(view.id), target.value);
  }
});

companyView.addEventListener('input', event => {
  if (event.target.id === 'list-search') {
    listFilters.query = event.target.value;
    renderCompany();
    const search = companyView.querySelector('#list-search');
    search.focus(); search.setSelectionRange(search.value.length, search.value.length);
  } else if (event.target.id === 'followup-message') {
    const draft = followup.queue[followup.index];
    draft.message = event.target.value;
    companyView.querySelector('#followup-send').href = whatsappUrl(personById(draft.personId).phone, draft.message);
  }
});

companyView.addEventListener('keydown', event => {
  if (event.key === 'Enter' && event.target.matches('[data-go][tabindex]')) event.target.click();
});

// Tablero de particulares: arrastrar una tarjeta a otra columna cambia la etapa.
companyView.addEventListener('dragstart', event => {
  const card = event.target.closest?.('[data-drag]'); if (!card) return;
  event.dataTransfer.setData('text/plain', card.dataset.drag);
  event.dataTransfer.effectAllowed = 'move';
  card.classList.add('dragging');
});
companyView.addEventListener('dragend', event => {
  event.target.closest?.('[data-drag]')?.classList.remove('dragging');
  companyView.querySelectorAll('.drop-target').forEach(column => column.classList.remove('drop-target'));
});
companyView.addEventListener('dragover', event => {
  const column = event.target.closest('[data-drop]'); if (!column) return;
  event.preventDefault();
  if (!column.classList.contains('drop-target')) {
    companyView.querySelectorAll('.drop-target').forEach(item => item.classList.remove('drop-target'));
    column.classList.add('drop-target');
  }
});
companyView.addEventListener('drop', event => {
  const column = event.target.closest('[data-drop]'); if (!column) return;
  event.preventDefault();
  const person = personById(event.dataTransfer.getData('text/plain'));
  if (person && person.status !== column.dataset.drop) setStatus(person, column.dataset.drop);
  else column.classList.remove('drop-target');
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

// Modo demostración: el comercial (promo-marq.html) muestra esta página en un iframe y la maneja
// con mensajes { marqDemo: {...} }. No cambia nada para quien navega el sitio normalmente.
window.addEventListener('message', event => {
  const cmd = event.data && event.data.marqDemo;
  if (!cmd) return;
  if (cmd.prepare) {
    document.querySelector('.whatsapp').hidden = true;
    document.querySelector('#mapa .city-stage').scrollIntoView({ block: 'center' });
  }
  if (cmd.slider != null) {
    const slider = document.querySelector('#map-timeline');
    slider.value = String(cmd.slider);
    slider.dispatchEvent(new Event('input', { bubbles: true }));
  }
  if (cmd.listTo) {
    const list = document.querySelector('#map-list');
    const item = cmd.listTo === 'top' ? null : list.querySelector(cmd.listTo);
    list.scrollTo({ top: item ? item.offsetTop - list.clientHeight / 2 + item.offsetHeight / 2 : 0, behavior: 'smooth' });
  }
  if (cmd.click) document.querySelector(cmd.click)?.click();
  if (cmd.setValue) {
    const field = document.querySelector(cmd.setValue.selector);
    if (field) { field.value = cmd.setValue.value; field.dispatchEvent(new Event('input', { bubbles: true })); }
  }
  if (cmd.scrollTo != null) window.scrollTo({ top: cmd.scrollTo, behavior: 'smooth' });
  if (cmd.clearStorage) Object.values(STORAGE_KEYS).forEach(key => { try { localStorage.removeItem(key); } catch {} });
  if (cmd.reload) location.reload();
  if (cmd.ping) event.source?.postMessage({ marqDemoReady: document.querySelectorAll('.map-pin').length > 0 }, '*');
});

initShowroom();
renderProjects();
initLanding();
