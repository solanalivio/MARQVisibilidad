// Contenido demostrativo: reemplazá estos datos por la información validada de cada proyecto.
const projects = [
  { id:'torre-natalini', name:'Torre Natalini', category:'Edificios', year:'2024', description:'Arquitectura moderna y de vanguardia en la ciudad de Resistencia. Una torre que transforma el perfil urbano.', image:'https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=1500&q=85', imageAlt:'Edificio contemporáneo de líneas claras', team:[
    {name:'María López',role:'Arquitectura',description:'Lideró el diseño arquitectónico y la relación del edificio con su entorno.',image:'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=500&q=80'},
    {name:'Estudio Norte',role:'Dirección / desarrollo',description:'Acompañó el desarrollo del proyecto desde la idea inicial hasta su planificación.',image:'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=500&q=80'},
    {name:'Constructora Litoral',role:'Construcción',description:'Hizo posible la obra con un equipo comprometido con cada detalle.',image:'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=500&q=80'},
    {name:'Juan Pérez',role:'Diseño de interiores',description:'Trabajó en la materialidad y en los espacios comunes del edificio.',image:'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=500&q=80'}]},
  { id:'uno-boulevard', name:'Uno Boulevard', category:'Edificios', year:'2023', description:'Volúmenes y líneas que generan diversidad de planos, luz natural y vistas abiertas.', image:'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1500&q=85', imageAlt:'Fachada residencial con balcones y vegetación', team:[
    {name:'Lucía Benítez',role:'Arquitectura',description:'Diseñó el juego de volúmenes y la apertura de los ambientes al paisaje.',image:'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=500&q=80'},
    {name:'Equipo MARQ',role:'Desarrollo',description:'Coordinó las distintas etapas del proyecto y su propuesta de valor.',image:'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=500&q=80'},
    {name:'Obras del Paraná',role:'Construcción',description:'Llevó adelante la obra y resolvió cada encuentro de materiales.',image:'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=500&q=80'}]},
  { id:'casa-bdn', name:'Casas BDN + Terreno', category:'Casas', year:'2024', description:'Tu casa y tu terreno en un barrio costero consolidado. Brisas del Norte es un proyecto habitado y en pleno crecimiento.', image:'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1500&q=85', imageAlt:'Interior de casa con materiales cálidos y luz natural', team:[
    {name:'Sofía Acosta',role:'Arquitectura',description:'Interpretó el terreno y organizó la casa para acercarla a las vistas.',image:'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=500&q=80'},
    {name:'Familia B.',role:'Comitentes',description:'Compartió su manera de vivir y sus deseos para orientar cada decisión.',image:'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=500&q=80'},
    {name:'Taller Madera',role:'Carpintería',description:'Realizó piezas a medida que suman calidez y carácter a la casa.',image:'https://images.unsplash.com/photo-1601058268499-e52658b8bb88?auto=format&fit=crop&w=500&q=80'}]},
  { id:'pueblo-mio', name:'Pueblo Mío', category:'Lotes', year:'2023', description:'Un barrio privado con laguna, espacios verdes y una nueva forma de conectar con el paisaje.', image:'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1500&q=85', imageAlt:'Paisaje verde con agua y vegetación', team:[
    {name:'Equipo Urbanismo MARQ',role:'Urbanismo',description:'Pensó la trama del barrio y la convivencia entre naturaleza y vida cotidiana.',image:'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=500&q=80'},
    {name:'Verde Vivo',role:'Paisajismo',description:'Definió especies y espacios para acompañar la identidad natural del lugar.',image:'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=500&q=80'},
    {name:'Desarrollo B.',role:'Desarrollo',description:'Impulsó el proyecto y articuló a los equipos que lo hicieron posible.',image:'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=500&q=80'}]},
  { id:'casa-fo', name:'Casa FO', category:'Casas', year:'2022', description:'Un equilibrio entre calidad, confort y diseño para acompañar la vida de sus habitantes.', image:'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1500&q=85', imageAlt:'Casa contemporánea integrada con el exterior', team:[
    {name:'Tomás Fernández',role:'Arquitectura',description:'Desarrolló una propuesta funcional que aprovecha cada metro de la casa.',image:'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=500&q=80'},
    {name:'Estudio Luz',role:'Iluminación',description:'Acompañó el diseño con una propuesta de luz natural y artificial.',image:'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=500&q=80'}]},
  { id:'parque-arboledas', name:'Parque Arboledas', category:'Lotes', year:'2021', description:'Un loteo residencial que propone vivir cerca de la ciudad, rodeado de naturaleza.', image:'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=1500&q=85', imageAlt:'Arboleda bañada por luz de tarde', team:[
    {name:'Carolina Ruiz',role:'Urbanismo',description:'Diseñó una propuesta que integra el trazado y el bosque nativo.',image:'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=500&q=80'},
    {name:'Equipo de infraestructura',role:'Obras y servicios',description:'Planificó las redes y los espacios comunes que dan soporte al barrio.',image:'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=500&q=80'},
    {name:'Vivero Raíz',role:'Proveedores',description:'Aportó especies nativas y conocimiento local para el paisaje.',image:'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=500&q=80'}]}
];

const grid=document.querySelector('#projects-grid');
const modal=document.querySelector('#team-modal');
const teamGrid=document.querySelector('#team-grid');
let previousFocus=null;

function renderProjects(filter='Todos'){
  const displayOrder=['casa-bdn','torre-natalini','uno-boulevard','pueblo-mio','casa-fo','parque-arboledas'];
  const visible=projects.filter(project=>filter==='Todos'||project.category===filter).sort((a,b)=>displayOrder.indexOf(a.id)-displayOrder.indexOf(b.id));
  grid.innerHTML=visible.map((project,index)=>`<article class="project-card" id="${project.id}">
    <div class="project-image-wrap"><img class="project-image" src="${project.image}" alt="${project.imageAlt}" loading="lazy"><span class="image-count">0${index+1} / 0${projects.length}</span></div>
    <div class="project-info"><div class="project-meta"><span class="project-category">${project.category}</span><span class="project-year">${project.year}</span></div>
    <h2 class="project-title">${project.name}</h2><p class="project-description">${project.description}</p>
    <div class="project-actions"><a class="project-link" href="#${project.id}">Ver proyecto <span>↗</span></a><button class="team-link" data-project="${project.id}">Conocé quiénes están detrás <span>↗</span></button></div></div></article>`).join('');
  grid.querySelectorAll('.team-link').forEach(button=>button.addEventListener('click',()=>openTeam(button.dataset.project)));
}

function openTeam(id){
  const project=projects.find(item=>item.id===id); if(!project)return;
  previousFocus=document.activeElement;
  modal.querySelector('#modal-title').textContent=project.name;
  modal.querySelector('.modal-category').textContent=project.category;
  modal.querySelector('.modal-index').textContent=`PROYECTO ${String(projects.indexOf(project)+1).padStart(2,'0')} / 0${projects.length}`;
  teamGrid.innerHTML=project.team.map(person=>`<article class="person-card"><img class="person-photo" src="${person.image}" alt="Retrato demostrativo de ${person.name}" loading="lazy"><div class="person-content"><span class="person-role">${person.role}</span><h4 class="person-name">${person.name}</h4><p class="person-description">${person.description}</p></div></article>`).join('');
  modal.classList.add('open');modal.setAttribute('aria-hidden','false');document.body.classList.add('modal-open');modal.querySelector('.modal-close').focus();
}
function closeModal(){modal.classList.remove('open');modal.setAttribute('aria-hidden','true');document.body.classList.remove('modal-open');if(previousFocus)previousFocus.focus();}
document.querySelectorAll('.filter').forEach(button=>button.addEventListener('click',()=>{document.querySelector('.filter.active')?.classList.remove('active');button.classList.add('active');renderProjects(button.dataset.filter)}));
modal.querySelectorAll('[data-close-modal]').forEach(button=>button.addEventListener('click',closeModal));
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&modal.classList.contains('open'))closeModal()});
const menuButton=document.querySelector('.menu-toggle');
menuButton.addEventListener('click',()=>{const nav=document.querySelector('.main-nav');const isOpen=nav.classList.toggle('mobile-open');menuButton.setAttribute('aria-expanded',String(isOpen));menuButton.setAttribute('aria-label',isOpen?'Cerrar navegación':'Abrir navegación')});
document.querySelectorAll('.main-nav a').forEach(link=>link.addEventListener('click',()=>{document.querySelector('.main-nav').classList.remove('mobile-open');menuButton.setAttribute('aria-expanded','false')}));
renderProjects();
