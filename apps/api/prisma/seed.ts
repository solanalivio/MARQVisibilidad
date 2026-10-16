import { PrismaClient, ProjectCategory, ProjectStage, TargetProfile, NewsType, Typology, Financing, InvestGoal, Modality, PipelineStatus, ClientSegment, Channel, CampaignPlatform, CampaignStatus, MapKind, MapPhase, TaskKind, MeetingPlace, TaskSource, ShowroomEventType, VisitOutcome } from '@prisma/client';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { ALL_PERMISSIONS, PERMISSION_DESCRIPTIONS, SEED_ROLES, RoleKey } from '@marq/shared';

const prisma = new PrismaClient();

const ARGON2_OPTIONS: argon2.Options = {
  type: argon2.argon2id,
  memoryCost: 19456, // 19 MiB
  timeCost: 2,
  parallelism: 1,
};

async function main() {
  console.log('--- Iniciando Seed de MARQ Visibilidad ---');

  // 1. Permisos
  for (const permKey of ALL_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key: permKey },
      update: { description: PERMISSION_DESCRIPTIONS[permKey] || permKey },
      create: { key: permKey, description: PERMISSION_DESCRIPTIONS[permKey] || permKey },
    });
  }
  console.log('✔ Permisos creados');

  // 2. Roles y permisos asociados
  const roleRecordMap: Record<string, string> = {};
  for (const [roleKey, roleDef] of Object.entries(SEED_ROLES)) {
    const role = await prisma.role.upsert({
      where: { key: roleKey },
      update: { name: roleDef.name },
      create: { key: roleKey, name: roleDef.name, isSystem: true },
    });
    roleRecordMap[roleKey] = role.id;

    // Vincular permisos
    for (const permKey of roleDef.permissions) {
      const perm = await prisma.permission.findUnique({ where: { key: permKey } });
      if (perm) {
        await prisma.rolePermission.upsert({
          where: { roleId_permissionId: { roleId: role.id, permissionId: perm.id } },
          update: {},
          create: { roleId: role.id, permissionId: perm.id },
        });
      }
    }
  }
  console.log('✔ Roles y asignaciones RBAC listas');

  // 3. Usuarios iniciales
  const defaultPassword = process.env.SEED_DEFAULT_PASSWORD || 'Marq2026!Secure';
  const passwordHash = await argon2.hash(defaultPassword, ARGON2_OPTIONS);

  const seedUsers = [
    { email: 'admin@estudiomarq.com.ar', fullName: 'Administrador MARQ', role: 'admin' },
    { email: 'gerencia@estudiomarq.com.ar', fullName: 'María Alejandra Maro', role: 'gerente' },
    { email: 'asesor1@estudiomarq.com.ar', fullName: 'Camila Asesora', role: 'asesor' },
    { email: 'asesor2@estudiomarq.com.ar', fullName: 'Mateo Asesor', role: 'asesor' },
    { email: 'contenido@estudiomarq.com.ar', fullName: 'Candelaria Alegre Maro', role: 'contenido' },
    { email: 'auditor@estudiomarq.com.ar', fullName: 'Auditor Externo', role: 'auditor' },
  ];

  const userRecordMap: Record<string, string> = {};
  for (const u of seedUsers) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { fullName: u.fullName, isActive: true },
      create: { email: u.email, fullName: u.fullName, passwordHash, isActive: true },
    });
    userRecordMap[u.email] = user.id;

    const roleId = roleRecordMap[u.role];
    if (roleId) {
      await prisma.userRole.upsert({
        where: { userId_roleId: { userId: user.id, roleId } },
        update: {},
        create: { userId: user.id, roleId },
      });
    }
  }
  console.log('✔ Usuarios semilla creados (Contraseña por defecto:', defaultPassword, ')');

  // 4. Proyectos, equipo y novedades (legacy/app.js)
  const MARQ_IMG = 'https://estudiomarq.com.ar/wp-content/uploads';
  const ALEJANDRA = {
    name: 'Arq. María Alejandra Maro',
    role: 'Proyecto y dirección',
    description: 'Fundadora y directora de Estudio MARQ. “Los detalles hacen el diseño.”',
    imageUrl: `${MARQ_IMG}/Ale-unoboulevard4.webp`,
  };
  const MARQ_TEAM = {
    name: 'Equipo MARQ',
    role: 'Arquitectura · comunicación · administración',
    description: 'Un equipo interdisciplinario de 15 personas que acompaña cada etapa, del análisis del terreno a la entrega.',
    imageUrl: null,
  };

  const projectSeedData = [
    {
      slug: 'torre-natalini',
      name: 'Torre Natalini',
      category: ProjectCategory.edificios,
      year: '2024',
      statusLabel: 'Últimas unidades',
      location: 'Formosa 485 y Av. Rivadavia',
      facts: ['26 pisos', '10.172 m²'],
      description: '26 pisos de arquitectura contemporánea sobre el antiguo vivero de la familia Natalini. Unidades amplias y luminosas, materiales nobles y amenities de primer nivel.',
      imageUrl: `${MARQ_IMG}/2024/07/contacto-04-1.webp`,
      imageAlt: 'Torre Natalini iluminada al atardecer',
      forSale: true,
      targetProfiles: [TargetProfile.vivienda, TargetProfile.inversion],
      stage: ProjectStage.posventa,
      livingHint: 'Últimas unidades, listas para mudarse',
      totalUnits: 52,
      salesPerMonth: 1.0,
      sortOrder: 1,
      team: [
        ALEJANDRA,
        MARQ_TEAM,
        { name: 'Familia Natalini', role: 'El lugar', description: 'En su terreno funcionaba el vivero familiar. Sus plantas se trasladaron durante la obra y hoy forman el jardín vertical.', imageUrl: null },
        { name: 'Schindler', role: 'Proveedores', description: 'Ascensores Schindler 5500: tecnología de elevación poco habitual en la ciudad hasta esta torre.', imageUrl: null },
      ],
      news: [
        { publishedDaysAgo: 17, type: NewsType.disponibilidad, title: 'Últimas unidades de 2 dormitorios', body: 'Quedan pocas unidades de 2 dormitorios con vista al jardín vertical. Se entregan terminadas.' },
      ],
      unitTypes: [
        { typology: Typology.un_dormitorio, areaM2: 45, priceFromUsd: 71000, available: 2, reserved: 0 },
        { typology: Typology.dos_dormitorios, areaM2: 68, priceFromUsd: 98000, available: 1, reserved: 1 },
      ],
    },
    {
      slug: 'marq-collection',
      name: 'MARQ Collection',
      category: ProjectCategory.edificios,
      year: '2026',
      statusLabel: 'En pozo',
      location: 'Av. Italia 1640 y Rissione',
      facts: ['30 unidades', 'Desde USD 79.000'],
      description: 'La expresión de una nueva forma de habitar: vegetación integrada a la fachada, un entorno verde frente a la Laguna Francia y amenities pensados también para mascotas.',
      imageUrl: 'https://www.libertaddigital.com.ar/content/bucket/9/69299w850h638c.png.webp',
      imageAlt: 'Identidad visual de MARQ Collection',
      forSale: true,
      targetProfiles: [TargetProfile.vivienda, TargetProfile.inversion],
      stage: ProjectStage.preventa,
      livingHint: 'En pozo, desde USD 79.000',
      totalUnits: 30,
      salesPerMonth: 1.5,
      sortOrder: 2,
      team: [ALEJANDRA, MARQ_TEAM],
      news: [
        { publishedDaysAgo: 9, type: NewsType.evento, title: 'Presentación de la preventa', body: 'Presentamos MARQ Collection en el estudio: planos, tipologías y condiciones para ingresar en pozo.' },
      ],
      unitTypes: [
        { typology: Typology.un_dormitorio, areaM2: 42, priceFromUsd: 79000, available: 8, reserved: 0 },
        { typology: Typology.dos_dormitorios, areaM2: 64, priceFromUsd: 112000, available: 9, reserved: 1 },
        { typology: Typology.tres_dormitorios, areaM2: 96, priceFromUsd: 158000, available: 3, reserved: 0 },
      ],
    },
    {
      slug: 'torre-panorama',
      name: 'Torre Panorama',
      category: ProjectCategory.edificios,
      year: null,
      statusLabel: 'En preventa',
      location: 'Resistencia',
      facts: ['25.000 m²'],
      description: 'Un desarrollo de 25.000 m² en una zona estratégica de la ciudad, pensado para correr los límites del mercado local.',
      imageUrl: `${MARQ_IMG}/2024/08/torre-panorama-proyecto.webp`,
      imageAlt: 'Render de Torre Panorama',
      forSale: true,
      targetProfiles: [TargetProfile.vivienda, TargetProfile.inversion],
      stage: ProjectStage.preventa,
      livingHint: 'En preventa',
      totalUnits: 64,
      salesPerMonth: 1.0,
      sortOrder: 3,
      team: [ALEJANDRA, MARQ_TEAM],
      news: [],
      unitTypes: [
        { typology: Typology.un_dormitorio, areaM2: 40, priceFromUsd: 68000, available: 20, reserved: 0 },
        { typology: Typology.dos_dormitorios, areaM2: 62, priceFromUsd: 95000, available: 26, reserved: 2 },
        { typology: Typology.tres_dormitorios, areaM2: 90, priceFromUsd: 140000, available: 10, reserved: 0 },
      ],
    },
    {
      slug: 'torre-nbch',
      name: 'Torre NBCH',
      category: ProjectCategory.edificios,
      year: null,
      statusLabel: 'En obra',
      location: 'Resistencia',
      facts: ['Mutual NBCH'],
      description: 'Una inversión segura para la Mutual Bancaria del Personal del Nuevo Banco del Chaco.',
      imageUrl: `${MARQ_IMG}/2024/08/torre-nbch-proyecto.webp`,
      imageAlt: 'Render de Torre NBCH',
      forSale: false,
      targetProfiles: [],
      stage: ProjectStage.obra,
      livingHint: null,
      sortOrder: 4,
      team: [
        ALEJANDRA,
        MARQ_TEAM,
        { name: 'Mutual Bancaria del Personal del NBCH', role: 'Comitente', description: 'Impulsa el edificio como inversión para sus asociados.', imageUrl: null },
      ],
      news: [],
      unitTypes: [],
    },
    {
      slug: 'uno-boulevard',
      name: 'Uno Boulevard',
      category: ProjectCategory.edificios,
      year: '2017',
      statusLabel: 'Terminado',
      location: 'Av. Sarmiento',
      facts: ['9 pisos + 2 subsuelos', '3.500 m²'],
      description: 'Un juego de volúmenes y líneas que multiplica los planos de la fachada, privilegia la luz natural y abre vistas lejanas.',
      imageUrl: `${MARQ_IMG}/2024/07/uno-proyecto.webp`,
      imageAlt: 'Fachada de Uno Boulevard con líneas de luz',
      forSale: false,
      targetProfiles: [],
      stage: ProjectStage.portfolio,
      livingHint: null,
      sortOrder: 5,
      team: [
        { ...ALEJANDRA, role: 'Arquitecta a cargo' },
        { name: 'Arq. Julián Berdichevsky', role: 'Estudio asociado · BARQ', description: 'Diseñó el edificio junto a Estudio MARQ entre 2013 y 2014.', imageUrl: `${MARQ_IMG}/2024/06/julian.webp` },
        MARQ_TEAM,
      ],
      news: [],
      unitTypes: [],
    },
    {
      slug: 'distrito-horizonte',
      name: 'Distrito Horizonte',
      category: ProjectCategory.edificios_especiales,
      year: null,
      statusLabel: 'En desarrollo',
      location: 'Av. Ávalos',
      facts: ['16.000 m²', 'Uso mixto'],
      description: 'La ciudad que viene comienza acá: un macrolote de 16.000 m² junto al Carrefour de Av. Ávalos, pensado como polo administrativo, comercial y gastronómico, con oficinas, entretenimiento y espacio residencial.',
      imageUrl: '/img/distrito-horizonte.jpg',
      imageAlt: 'Render de Distrito Horizonte: torres de vidrio sobre un basamento con vegetación',
      forSale: false,
      targetProfiles: [],
      stage: ProjectStage.obra,
      livingHint: null,
      sortOrder: 6,
      team: [
        ALEJANDRA,
        MARQ_TEAM,
        { name: 'Candelaria Alegre Maro', role: 'Comunicación', description: 'Presentó el proyecto junto a Alejandra Maro como “una nueva forma de pensar la ciudad”.', imageUrl: null },
      ],
      news: [
        { publishedDaysAgo: 198, type: NewsType.evento, title: 'Distrito Horizonte en Radio Libertad', body: 'Alejandra Maro y Candelaria Alegre Maro presentaron el proyecto: una nueva forma de pensar la ciudad.' },
      ],
      unitTypes: [],
    },
    {
      slug: 'torre-vista',
      name: 'Torre Vista',
      category: ProjectCategory.edificios,
      year: '2013',
      statusLabel: 'Terminado',
      location: 'Salta y Donovan',
      facts: ['Esquina', 'Semitorre + torre'],
      description: 'Edificio en esquina con base en semitorre y torre en altura. Revitalizó una zona del centro que hoy tiene comercios y una plaza para caminar tranquilo.',
      imageUrl: `${MARQ_IMG}/2024/07/torre-vista-proyecto.webp`,
      imageAlt: 'Acceso de Torre Vista',
      forSale: false,
      targetProfiles: [],
      stage: ProjectStage.portfolio,
      livingHint: null,
      sortOrder: 7,
      team: [ALEJANDRA, MARQ_TEAM],
      news: [],
      unitTypes: [],
    },
    {
      slug: 'gaba',
      name: 'Edificio GABA',
      category: ProjectCategory.edificios,
      year: null,
      statusLabel: 'Terminado',
      location: 'Resistencia',
      facts: ['Live & work'],
      description: 'Un edificio versátil bajo el concepto live & work: para vivir, trabajar o alquilar temporariamente.',
      imageUrl: `${MARQ_IMG}/2024/07/gaba-proyecto.webp`,
      imageAlt: 'Edificio GABA con balcones verdes',
      forSale: false,
      targetProfiles: [],
      stage: ProjectStage.portfolio,
      livingHint: null,
      sortOrder: 8,
      team: [ALEJANDRA, MARQ_TEAM],
      news: [],
      unitTypes: [],
    },
    {
      slug: 'casa-bdn',
      name: 'Casas BDN + Terreno',
      category: ProjectCategory.casas,
      year: null,
      statusLabel: 'En construcción',
      location: 'Brisas del Norte',
      facts: ['1 a 3 dormitorios', '52 a 120 m²'],
      description: 'Tu casa y tu terreno en un barrio costero consolidado, habitado y en pleno crecimiento.',
      imageUrl: `${MARQ_IMG}/casas-bdn-portada-proyectos.webp`,
      imageAlt: 'Casa de Brisas del Norte con jardín',
      forSale: true,
      targetProfiles: [TargetProfile.vivienda],
      stage: ProjectStage.obra,
      livingHint: 'Casa + terreno en hasta 84 cuotas',
      totalUnits: 24,
      salesPerMonth: 2.0,
      sortOrder: 9,
      team: [ALEJANDRA, MARQ_TEAM],
      news: [
        { publishedDaysAgo: 45, type: NewsType.avance_obra, title: 'Casas modelo terminadas', body: 'Ya se pueden recorrer las casas modelo de 2 y 3 dormitorios en Brisas del Norte.' },
      ],
      unitTypes: [
        { typology: Typology.un_dormitorio, areaM2: 52, priceFromUsd: 48000, available: 3, reserved: 0 },
        { typology: Typology.dos_dormitorios, areaM2: 78, priceFromUsd: 66000, available: 5, reserved: 1 },
        { typology: Typology.tres_dormitorios, areaM2: 120, priceFromUsd: 92000, available: 2, reserved: 1 },
      ],
    },
    {
      slug: 'loft-al-rio',
      name: 'Loft al Río',
      category: ProjectCategory.casas,
      year: null,
      statusLabel: 'Terminado',
      location: 'Resistencia',
      facts: ['Doble altura'],
      description: 'Viviendas en doble altura frente al agua, con superficies flexibles para disfrutar sin límites.',
      imageUrl: `${MARQ_IMG}/2024/08/loftalrio-proyecto.webp`,
      imageAlt: 'Lofts iluminados frente al río',
      forSale: false,
      targetProfiles: [],
      stage: ProjectStage.portfolio,
      livingHint: null,
      sortOrder: 10,
      team: [ALEJANDRA, MARQ_TEAM],
      news: [],
      unitTypes: [],
    },
    {
      slug: 'casa-fo',
      name: 'Casa FO',
      category: ProjectCategory.casas,
      year: null,
      statusLabel: 'Terminado',
      location: 'Resistencia',
      facts: ['Proyecto a medida'],
      description: 'Un equilibrio entre calidad y costo, con un valor único pensado para el estilo de vida soñado por sus dueños.',
      imageUrl: `${MARQ_IMG}/2024/07/casa-fontanes-proyecto.webp`,
      imageAlt: 'Casa FO con jardín tropical',
      forSale: false,
      targetProfiles: [],
      stage: ProjectStage.portfolio,
      livingHint: null,
      sortOrder: 11,
      team: [ALEJANDRA, MARQ_TEAM],
      news: [],
      unitTypes: [],
    },
    {
      slug: 'pueblo-mio',
      name: 'Pueblo Mío',
      category: ProjectCategory.lotes,
      year: null,
      statusLabel: 'En desarrollo',
      location: 'Ruta 11, Puerto Tirol',
      facts: ['100 ha', 'Lotes de 400 m²'],
      description: 'Un barrio privado con laguna sobre 100 hectáreas de agua y bosque, a 10 minutos del centro.',
      imageUrl: `${MARQ_IMG}/2024/07/pueblomio-proyecto.webp`,
      imageAlt: 'Bosque nativo de Pueblo Mío',
      forSale: true,
      targetProfiles: [TargetProfile.vivienda, TargetProfile.inversion],
      stage: ProjectStage.lotes,
      livingHint: 'Lotes de 400 m² con laguna',
      totalUnits: 180,
      salesPerMonth: 3.0,
      sortOrder: 12,
      team: [ALEJANDRA, MARQ_TEAM],
      news: [
        { publishedDaysAgo: 60, type: NewsType.disponibilidad, title: 'Nueva etapa de lotes frente a la laguna', body: 'Habilitamos la segunda etapa de lotes de 400 m² con vista a la laguna.' },
      ],
      unitTypes: [{ typology: Typology.lote, areaM2: 400, priceFromUsd: 18000, available: 140, reserved: 4 }],
    },
    {
      slug: 'gran-arboledas',
      name: 'Gran Arboledas',
      category: ProjectCategory.lotes,
      year: null,
      statusLabel: 'En venta',
      location: 'Av. Sarmiento 4500',
      facts: ['193 lotes', '300 a 400 m²'],
      description: '193 lotes con infraestructura completa que conservan el bosque nativo, a minutos de la ciudad.',
      imageUrl: `${MARQ_IMG}/2024/07/gran-arboledas-inversiones.webp`,
      imageAlt: 'Loteo Gran Arboledas',
      forSale: true,
      targetProfiles: [TargetProfile.vivienda, TargetProfile.inversion],
      stage: ProjectStage.lotes,
      livingHint: '193 lotes entre bosque nativo',
      totalUnits: 193,
      salesPerMonth: 4.0,
      sortOrder: 13,
      team: [ALEJANDRA, MARQ_TEAM],
      news: [],
      unitTypes: [{ typology: Typology.lote, areaM2: 300, priceFromUsd: 16000, available: 70, reserved: 3 }],
    },
    {
      slug: 'brisas-del-norte',
      name: 'Brisas del Norte',
      category: ProjectCategory.lotes,
      year: null,
      statusLabel: 'En venta',
      location: 'Av. Juan Manuel de Rosas 3700',
      facts: ['Laguna y muelle'],
      description: 'Un loteo rodeado de naturaleza, con laguna, muelle y espacios de recreación: ideal para vivir o invertir.',
      imageUrl: `${MARQ_IMG}/2024/07/brisas-del-norte-proyecto.webp`,
      imageAlt: 'Muelle sobre la laguna de Brisas del Norte',
      forSale: true,
      targetProfiles: [TargetProfile.vivienda, TargetProfile.inversion],
      stage: ProjectStage.lotes,
      livingHint: 'Laguna, muelle y todos los servicios',
      totalUnits: 90,
      salesPerMonth: 2.0,
      sortOrder: 14,
      team: [ALEJANDRA, MARQ_TEAM],
      news: [],
      unitTypes: [{ typology: Typology.lote, areaM2: 350, priceFromUsd: 20000, available: 18, reserved: 2 }],
    },
    {
      slug: 'parque-arboledas',
      name: 'Parque Arboledas',
      category: ProjectCategory.lotes,
      year: null,
      statusLabel: 'En venta',
      location: 'Av. Ávalos',
      facts: ['6 ha'],
      description: 'Un predio de 6 hectáreas de características únicas, a 1.000 m de la Ruta 16.',
      imageUrl: `${MARQ_IMG}/2024/07/parque-arboledas-proyecto.webp`,
      imageAlt: 'Vista aérea de Parque Arboledas',
      forSale: true,
      targetProfiles: [TargetProfile.vivienda, TargetProfile.inversion],
      stage: ProjectStage.lotes,
      livingHint: 'Predio de 6 hectáreas',
      totalUnits: 60,
      salesPerMonth: 2.0,
      sortOrder: 15,
      team: [ALEJANDRA, MARQ_TEAM],
      news: [],
      unitTypes: [{ typology: Typology.lote, areaM2: 300, priceFromUsd: 14000, available: 37, reserved: 2 }],
    },
    {
      slug: 'interiorismo-pe',
      name: 'Interiorismo PE',
      category: ProjectCategory.interiorismo,
      year: null,
      statusLabel: 'Terminado',
      location: 'Resistencia',
      facts: ['Rediseño interior'],
      description: 'Estilo clásico, lujo y modernidad en un rediseño interior minimalista con el sello MARQ.',
      imageUrl: `${MARQ_IMG}/2024/07/interiorismo-peruchena-proyecto.webp`,
      imageAlt: 'Living luminoso con interiorismo MARQ',
      forSale: false,
      targetProfiles: [],
      stage: ProjectStage.portfolio,
      livingHint: null,
      sortOrder: 16,
      team: [ALEJANDRA, MARQ_TEAM],
      news: [],
      unitTypes: [],
    },
    {
      slug: 'ax-sarmiento',
      name: 'AX Sarmiento',
      category: ProjectCategory.locales_comerciales,
      year: null,
      statusLabel: 'Terminado',
      location: 'Av. Sarmiento 1510',
      facts: ['AXION Energy'],
      description: 'Estación de servicio para la cadena AXION Energy, una de las cuatro que el estudio proyectó en la región.',
      imageUrl: `${MARQ_IMG}/2024/07/axion-proyecto.webp`,
      imageAlt: 'Estación de servicio AXION en Av. Sarmiento',
      forSale: false,
      targetProfiles: [],
      stage: ProjectStage.portfolio,
      livingHint: null,
      sortOrder: 17,
      team: [
        ALEJANDRA,
        MARQ_TEAM,
        { name: 'AXION Energy', role: 'Cliente', description: 'Cadena para la que MARQ proyectó estaciones de servicio en Resistencia y Puerto Tirol.', imageUrl: null },
      ],
      news: [],
      unitTypes: [],
    },
    {
      slug: 'cet',
      name: 'C.E.T.',
      category: ProjectCategory.edificios_especiales,
      year: null,
      statusLabel: 'Terminado',
      location: 'Resistencia',
      facts: ['Gran escala'],
      description: 'Centro Educativo Terapéutico: arquitectura de gran escala y vanguardia con el estilo MARQ.',
      imageUrl: `${MARQ_IMG}/2024/07/C.E.T-proyecto.webp`,
      imageAlt: 'Fachada del Centro Educativo Terapéutico',
      forSale: false,
      targetProfiles: [],
      stage: ProjectStage.portfolio,
      livingHint: null,
      sortOrder: 18,
      team: [ALEJANDRA, MARQ_TEAM],
      news: [],
      unitTypes: [],
    },
  ];

  const projectRecordMap: Record<string, string> = {};

  for (const p of projectSeedData) {
    const project = await prisma.project.upsert({
      where: { slug: p.slug },
      update: {
        name: p.name,
        category: p.category,
        year: p.year,
        statusLabel: p.statusLabel,
        location: p.location,
        facts: p.facts,
        description: p.description,
        imageUrl: p.imageUrl,
        imageAlt: p.imageAlt,
        forSale: p.forSale,
        targetProfiles: p.targetProfiles,
        stage: p.stage,
        livingHint: p.livingHint,
        totalUnits: p.totalUnits,
        salesPerMonth: p.salesPerMonth,
        sortOrder: p.sortOrder,
      },
      create: {
        slug: p.slug,
        name: p.name,
        category: p.category,
        year: p.year,
        statusLabel: p.statusLabel,
        location: p.location,
        facts: p.facts,
        description: p.description,
        imageUrl: p.imageUrl,
        imageAlt: p.imageAlt,
        forSale: p.forSale,
        targetProfiles: p.targetProfiles,
        stage: p.stage,
        livingHint: p.livingHint,
        totalUnits: p.totalUnits,
        salesPerMonth: p.salesPerMonth,
        sortOrder: p.sortOrder,
      },
    });
    projectRecordMap[p.slug] = project.id;

    // Team
    await prisma.projectTeamMember.deleteMany({ where: { projectId: project.id } });
    for (let i = 0; i < p.team.length; i++) {
      const tm = p.team[i];
      await prisma.projectTeamMember.create({
        data: {
          projectId: project.id,
          name: tm.name,
          role: tm.role,
          description: tm.description,
          imageUrl: tm.imageUrl,
          sortOrder: i,
        },
      });
    }

    // News
    await prisma.projectNews.deleteMany({ where: { projectId: project.id } });
    for (const nw of p.news) {
      const publishedOn = new Date();
      publishedOn.setDate(publishedOn.getDate() - nw.publishedDaysAgo);
      await prisma.projectNews.create({
        data: {
          projectId: project.id,
          publishedOn,
          type: nw.type,
          title: nw.title,
          body: nw.body,
        },
      });
    }

    // Stock / UnitTypes
    await prisma.unitType.deleteMany({ where: { projectId: project.id } });
    for (const ut of p.unitTypes) {
      await prisma.unitType.create({
        data: {
          projectId: project.id,
          typology: ut.typology,
          areaM2: ut.areaM2,
          priceFromUsd: ut.priceFromUsd,
          available: ut.available,
          reserved: ut.reserved,
        },
      });
    }
  }
  console.log('✔ 18 proyectos creados con equipo, novedades y stock');

  // 5. Placements en mapa 3D (legacy/map3d.js)
  const mapPlacementsSeed = [
    { slug: 'torre-natalini', kind: MapKind.building, coords: [-58.98859, -27.44192], floors: 26, size: 24, address: 'Formosa 485 y Av. Rivadavia', phase: MapPhase.reality, sequence: 0, isFuture: false },
    { slug: 'torre-vista', kind: MapKind.building, coords: [-58.99264, -27.45066], floors: 18, size: 20, address: 'Salta 389 y General Dónovan', phase: MapPhase.reality, sequence: 1, isFuture: false },
    { slug: 'uno-boulevard', kind: MapKind.building, coords: [-58.98098, -27.44598], floors: 9, size: 14, address: 'Av. Sarmiento 645', phase: MapPhase.reality, sequence: 2, isFuture: false },
    { slug: 'torre-nbch', kind: MapKind.building, coords: [-58.97821, -27.44671], floors: 16, size: 20, address: 'Pellegrini 761', phase: MapPhase.reality, sequence: 3, isFuture: false },
    { slug: 'torre-panorama', kind: MapKind.building, coords: [-58.97298, -27.43918], floors: 30, size: 30, address: 'Av. Sarmiento 1502', phase: MapPhase.future, sequence: 4, isFuture: true },
    {
      slug: 'ax-sarmiento',
      kind: MapKind.building,
      coords: [-58.97233, -27.43896],
      rotation: 90,
      address: 'Av. Sarmiento 1510',
      phase: MapPhase.reality,
      sequence: 5,
      isFuture: false,
      volumes: [
        { offset: [3, -10], size: [24, 20], floors: 1, solid: 'slab', base: 4.8, height: 0.35 },
        { offset: [3, -10], size: [24, 20], floors: 1, solid: 'glass', base: 5.15, height: 1.45 },
        { offset: [3, -10], size: [24, 20], floors: 1, solid: 'slab', base: 6.6, height: 0.15 },
        { offset: [3, -10], size: [3.2, 16], floors: 1, solid: 'slab', base: 0, height: 0.25 },
        { offset: [3, -16], size: [1.8, 2.6], floors: 1, solid: 'slab', base: 0, height: 4.8 },
        { offset: [3, -4], size: [1.8, 2.6], floors: 1, solid: 'slab', base: 0, height: 4.8 },
        { offset: [3, -10], size: [1.4, 3.2], floors: 1, solid: 'glass', base: 0, height: 1.8 },
        { offset: [-5, 10], size: [28, 11], floors: 1 },
        { offset: [-5, 10], size: [28.6, 11.6], floors: 1, solid: 'glass', base: 3.2, height: 0.8 },
        { offset: [21, -22], size: [1.4, 3], floors: 1, solid: 'glass', base: 0, height: 8 },
        { offset: [21, -22], size: [1.6, 3.2], floors: 1, solid: 'slab', base: 8, height: 0.4 },
      ],
    },
    { slug: 'marq-collection', kind: MapKind.building, coords: [-58.96737, -27.44197], floors: 7, size: 18, address: 'Av. Italia 1640 y Rissione', phase: MapPhase.future, sequence: 6, isFuture: true },
    { slug: 'gaba', kind: MapKind.building, coords: [-58.98696, -27.44674], floors: 5, size: 14, address: 'Remedios de Escalada 259 · acá está el estudio', phase: MapPhase.reality, sequence: 7, isFuture: false },
    {
      slug: 'distrito-horizonte',
      kind: MapKind.building,
      coords: [-58.988684, -27.438998],
      rotation: 45,
      isFuture: true,
      phase: MapPhase.future,
      sequence: 8,
      lotWidth: 82,
      lotHeight: 195,
      address: 'Av. Ávalos, entre el Pasaje Rioja y el Carrefour · volumetría aproximada',
      volumes: [
        { offset: [-22, -58], floors: 20, size: [24, 24] },
        { offset: [22, -48], floors: 17, size: [22, 22] },
        { offset: [-24, -52], floors: 2, size: [30, 52] },
        { offset: [24, -52], floors: 2, size: [30, 52] },
      ],
      boulevard: { offset: [0, 0], size: [14, 195] },
    },
    // Áreas / Loteos
    { slug: 'casa-bdn', kind: MapKind.area, coords: [-58.9478, -27.3452], radius: 200, address: 'Barrio Brisas del Norte · ubicación aproximada', phase: MapPhase.reality, sequence: 9, isFuture: false },
    { slug: 'gran-arboledas', kind: MapKind.area, coords: [-58.9455, -27.4155], radius: 420, address: 'Av. Sarmiento 4500 · ubicación aproximada', phase: MapPhase.reality, sequence: 10, isFuture: false },
    { slug: 'parque-arboledas', kind: MapKind.area, coords: [-58.9965, -27.4205], radius: 260, address: 'Av. Ávalos, a 1.000 m de la Ruta 16 · ubicación aproximada', phase: MapPhase.reality, sequence: 11, isFuture: false },
    { slug: 'brisas-del-norte', kind: MapKind.area, coords: [-58.953, -27.342], radius: 480, address: 'Av. Juan Manuel de Rosas 3700 · ubicación aproximada', phase: MapPhase.reality, sequence: 12, isFuture: false },
    { slug: 'pueblo-mio', kind: MapKind.area, coords: [-59.058, -27.383], radius: 900, address: 'Ruta 11, km 1016, Puerto Tirol · ubicación aproximada', phase: MapPhase.reality, sequence: 13, isFuture: false },
  ];

  for (const mp of mapPlacementsSeed) {
    const projectId = projectRecordMap[mp.slug];
    if (projectId) {
      await prisma.projectMapPlacement.upsert({
        where: { projectId },
        update: {
          kind: mp.kind,
          lng: mp.coords[0],
          lat: mp.coords[1],
          address: mp.address,
          phase: mp.phase,
          sequence: mp.sequence,
          isFuture: mp.isFuture,
          floors: mp.floors,
          size: mp.size,
          rotation: mp.rotation,
          radius: mp.radius,
          lotWidth: mp.lotWidth,
          lotHeight: mp.lotHeight,
          volumes: mp.volumes ? JSON.stringify(mp.volumes) : undefined,
          boulevard: mp.boulevard ? JSON.stringify(mp.boulevard) : undefined,
        },
        create: {
          projectId,
          kind: mp.kind,
          lng: mp.coords[0],
          lat: mp.coords[1],
          address: mp.address,
          phase: mp.phase,
          sequence: mp.sequence,
          isFuture: mp.isFuture,
          floors: mp.floors,
          size: mp.size,
          rotation: mp.rotation,
          radius: mp.radius,
          lotWidth: mp.lotWidth,
          lotHeight: mp.lotHeight,
          volumes: mp.volumes ? JSON.stringify(mp.volumes) : undefined,
          boulevard: mp.boulevard ? JSON.stringify(mp.boulevard) : undefined,
        },
      });
    }
  }
  console.log('✔ Ubicaciones y volumetría 3D integradas');

  // 6. Campañas publicitarias (CAMPAIGNS)
  const campaignSeed = [
    { code: 'c1', name: 'Preventa MARQ Collection', platform: CampaignPlatform.meta_ads, projectSlug: 'marq-collection', status: CampaignStatus.activa, daysAgo: 24, spend: 180000, platformLeads: 14 },
    { code: 'c2', name: 'Últimas unidades Natalini', platform: CampaignPlatform.meta_ads, projectSlug: 'torre-natalini', status: CampaignStatus.activa, daysAgo: 18, spend: 90000, platformLeads: 5 },
    { code: 'c3', name: 'Casas BDN en cuotas', platform: CampaignPlatform.google_ads, projectSlug: 'casa-bdn', status: CampaignStatus.activa, daysAgo: 30, spend: 60000, platformLeads: 3 },
    { code: 'c4', name: 'Lotes con laguna', platform: CampaignPlatform.instagram, projectSlug: 'pueblo-mio', status: CampaignStatus.pausada, daysAgo: 40, spend: 45000, platformLeads: 4 },
  ];

  const campaignRecordMap: Record<string, string> = {};
  for (const c of campaignSeed) {
    const startedOn = new Date();
    startedOn.setDate(startedOn.getDate() - c.daysAgo);
    const campaign = await prisma.campaign.create({
      data: {
        name: c.name,
        platform: c.platform,
        status: c.status,
        projectId: projectRecordMap[c.projectSlug] || null,
        startedOn,
        spendArs: c.spend,
        platformLeads: c.platformLeads,
      },
    });
    campaignRecordMap[c.code] = campaign.id;
  }
  console.log('✔ Campañas creadas');

  // 7. Contactos / Clientes de MARQ Contigo (initialPeople)
  const asesor1Id = userRecordMap['asesor1@estudiomarq.com.ar'];
  const asesor2Id = userRecordMap['asesor2@estudiomarq.com.ar'];

  const peopleSeed = [
    {
      code: 'p1', name: 'Ana Martínez', phone: '5493624000001', email: 'ana.martinez@correo.com', source: Channel.whatsapp,
      projects: ['torre-panorama'], interest: ClientSegment.particular, status: PipelineStatus.en_conversacion,
      profile: { typology: Typology.dos_dormitorios, budget: 100000, financing: Financing.cuotas_estudio },
      journey: ['Tótem de Torre Natalini', 'mapa 3D', 'WhatsApp'],
      notes: 'Busca su primer hogar. Le gusta Torre Panorama y quiere entrar en preventa para mudarse cuando se entregue.',
      assignedUserId: asesor1Id,
      showroom: { picks: ['torre-panorama', 'casa-bdn', 'torre-natalini'], daysAgo: 9 },
      nextAction: { source: TaskSource.showroom, text: 'Coordinar la visita al estudio que pidió desde su showroom (Torre Panorama)', daysDue: 0 },
      history: [
        { daysAgo: 9, channel: Channel.whatsapp, note: 'Preguntó el precio de Torre Panorama. Se le envió su showroom personal.' },
        { daysAgo: 4, channel: Channel.llamada, note: 'Busca su primer departamento. Pidió valores y formas de pago en preventa.' },
      ],
      signals: [
        { hoursAgo: 27, type: ShowroomEventType.open, label: 'Abrió su showroom' },
        { hoursAgo: 27, type: ShowroomEventType.profile, label: 'Eligió “Busco mi próxima vivienda”' },
        { hoursAgo: 26, type: ShowroomEventType.team, projectSlug: 'torre-panorama', label: 'Conoció al equipo de Torre Panorama' },
        { hoursAgo: 21, type: ShowroomEventType.visit, projectSlug: 'torre-panorama', label: 'Pidió agendar una visita por Torre Panorama' },
      ],
    },
    {
      code: 'p2', name: 'Diego Fernández', phone: '5493624000002', email: null, source: Channel.whatsapp,
      projects: ['torre-natalini', 'marq-collection'], interest: ClientSegment.inversor, status: PipelineStatus.visita_agendada,
      profile: { typology: Typology.dos_dormitorios, budget: 100000, goal: InvestGoal.renta, modality: Modality.indistinto, units: 1 },
      journey: ['Sitio web', 'mapa 3D', 'WhatsApp'],
      notes: 'Inversor. Compara ingresar en pozo en MARQ Collection con comprar terminado en Torre Natalini.',
      assignedUserId: asesor1Id,
      showroom: { picks: ['marq-collection', 'torre-natalini'], daysAgo: 7 },
      nextAction: { kind: TaskKind.meeting, text: 'Reunión en la obra · Torre Natalini', daysDue: 0, time: '17:30', place: MeetingPlace.obra, projectSlug: 'torre-natalini' },
      history: [
        { daysAgo: 12, channel: Channel.whatsapp, note: 'Pidió información para invertir en pozo.' },
        { daysAgo: 7, channel: Channel.email, note: 'Se le envió el brochure con precios y plazos de entrega de ambos proyectos.' },
        { daysAgo: 2, channel: Channel.llamada, note: 'Quiere ver una unidad terminada de 2 dormitorios antes de decidir.' },
      ],
      signals: [
        { hoursAgo: 3, type: ShowroomEventType.open, label: 'Abrió su showroom' },
        { hoursAgo: 3, type: ShowroomEventType.profile, label: 'Eligió “Busco oportunidades de inversión”' },
        { hoursAgo: 2, type: ShowroomEventType.team, projectSlug: 'marq-collection', label: 'Conoció al equipo de MARQ Collection' },
        { hoursAgo: 2, type: ShowroomEventType.team, projectSlug: 'torre-natalini', label: 'Conoció al equipo de Torre Natalini' },
      ],
    },
    {
      code: 'p3', name: 'Paula Gómez', phone: '5493624000003', email: 'paula.gomez@correo.com', source: Channel.facebook,
      projects: ['marq-collection'], interest: ClientSegment.particular, status: PipelineStatus.visita_agendada,
      profile: { typology: Typology.dos_dormitorios, budget: 120000, financing: Financing.credito_hipotecario },
      journey: ['Publicación de MARQ Collection', 'mensaje privado'],
      notes: 'Viene con su pareja. Tienen un perro: contarle sobre los espacios comunes.',
      assignedUserId: asesor2Id,
      nextAction: { kind: TaskKind.meeting, text: 'Reunión en el showroom · MARQ Collection', daysDue: 0, time: '11:00', place: MeetingPlace.showroom, projectSlug: 'marq-collection' },
      history: [
        { daysAgo: 15, channel: Channel.facebook, note: 'Comentó una publicación de MARQ Collection y se la contactó por privado.' },
        { daysAgo: 5, channel: Channel.whatsapp, note: 'Coordinamos una visita al showroom.' },
      ],
      signals: [],
    },
    {
      code: 'p4', name: 'Julián Benítez', phone: '5493624000004', email: null, source: Channel.visita,
      projects: ['casa-bdn'], interest: ClientSegment.particular, status: PipelineStatus.en_conversacion,
      profile: { typology: Typology.tres_dormitorios, budget: 95000, financing: Financing.vende_propiedad },
      journey: ['Visita directa'],
      notes: 'Necesita vender su casa actual para poder comprar.',
      assignedUserId: asesor2Id,
      nextAction: { text: 'Llamar para saber si ya tasó su casa actual', daysDue: 0 },
      history: [
        { daysAgo: 20, channel: Channel.visita, note: 'Recorrió Brisas del Norte un sábado. Le gustó la casa modelo.', visitOutcome: VisitOutcome.done, projectSlug: 'casa-bdn' },
        { daysAgo: 8, channel: Channel.llamada, note: 'Está esperando la tasación de su casa para definir.' },
      ],
      signals: [],
    },
    {
      code: 'p5', name: 'Carla Ruiz', phone: '5493624000005', email: 'carla.ruiz@correo.com', source: Channel.instagram, campaignCode: 'c4',
      projects: ['pueblo-mio', 'parque-arboledas'], interest: ClientSegment.inversor, status: PipelineStatus.en_negociacion,
      profile: { typology: Typology.lote, budget: 40000, goal: InvestGoal.revalorizacion, modality: Modality.indistinto, units: 2 },
      journey: ['Anuncio Instagram', 'Direct'],
      notes: 'Quiere dos lotes contiguos. Pide condiciones para pagar en 12 cuotas.',
      assignedUserId: asesor1Id,
      nextAction: { text: 'Enviar propuesta de pago por dos lotes', daysDue: -1 },
      history: [
        { daysAgo: 25, channel: Channel.instagram, note: 'Consultó por lotes con vista a la laguna.' },
        { daysAgo: 10, channel: Channel.visita, note: 'Visitó Pueblo Mío y Parque Arboledas. Prefiere lotes contiguos.', visitOutcome: VisitOutcome.done, projectSlug: 'pueblo-mio' },
        { daysAgo: 3, channel: Channel.whatsapp, note: 'Pidió una propuesta por dos lotes en 12 cuotas.' },
      ],
      signals: [],
    },
    {
      code: 'p6', name: 'Marcos Vera', phone: '5493624000006', email: null, source: Channel.whatsapp,
      projects: ['parque-arboledas'], interest: ClientSegment.particular, status: PipelineStatus.nuevo_contacto,
      profile: { typology: Typology.lote },
      journey: ['WhatsApp'],
      notes: 'Quiere un lote para construir su casa.',
      assignedUserId: asesor2Id,
      showroom: { picks: ['parque-arboledas', 'gran-arboledas'], daysAgo: 2 },
      nextAction: null,
      history: [{ daysAgo: 2, channel: Channel.whatsapp, note: 'Preguntó precios de lotes para construir su casa.' }],
      signals: [{ hoursAgo: 40, type: ShowroomEventType.open, label: 'Abrió su showroom' }],
    },
    {
      code: 'p7', name: 'Lucía Sosa', phone: '5493624000007', email: 'lucia.sosa@correo.com', source: Channel.llamada,
      projects: ['torre-natalini'], interest: ClientSegment.inversor, status: PipelineStatus.nuevo_contacto,
      profile: { typology: Typology.un_dormitorio, budget: 75000, goal: InvestGoal.renta, modality: Modality.terminado, units: 1 },
      journey: ['Cartel de obra de Torre Natalini', 'llamada a la oficina'],
      notes: 'Busca una unidad de un dormitorio para alquilar.',
      assignedUserId: asesor1Id,
      nextAction: { text: 'Enviar tipologías de un dormitorio disponibles', daysDue: 3 },
      history: [{ daysAgo: 1, channel: Channel.llamada, note: 'Llamó a la oficina por unidades de un dormitorio.' }],
      signals: [],
    },
    {
      code: 'p8', name: 'Roberto Díaz', phone: '5493624000008', email: null, source: Channel.presencial,
      projects: ['casa-bdn'], interest: ClientSegment.particular, status: PipelineStatus.cerro_operacion,
      profile: { typology: Typology.dos_dormitorios, budget: 70000, financing: Financing.cuotas_estudio },
      journey: ['Oficina'],
      notes: 'Firmó boleto. Mantener el vínculo: puede recomendarnos.',
      assignedUserId: asesor1Id,
      nextAction: null,
      history: [
        { daysAgo: 40, channel: Channel.presencial, note: 'Se acercó a la oficina por Casas BDN.' },
        { daysAgo: 6, channel: Channel.reunion, note: 'Firmó el boleto de compraventa en el estudio.', visitOutcome: VisitOutcome.done, projectSlug: 'casa-bdn' },
      ],
      signals: [],
    },
    {
      code: 'p9', name: 'Martín Acosta', phone: '5493624000009', email: 'martin.acosta@correo.com', source: Channel.instagram, campaignCode: 'c1',
      projects: ['marq-collection'], interest: ClientSegment.inversor, status: PipelineStatus.visita_agendada,
      profile: { typology: Typology.un_dormitorio, budget: 160000, goal: InvestGoal.revalorizacion, modality: Modality.en_pozo, units: 2 },
      journey: ['Instagram Ad'],
      notes: 'Quiere dos unidades de un dormitorio en pozo para vender al terminar la obra.',
      assignedUserId: asesor2Id,
      nextAction: { kind: TaskKind.meeting, text: 'Reunión en el showroom · MARQ Collection', daysDue: 1, time: '10:00', place: MeetingPlace.showroom, projectSlug: 'marq-collection' },
      history: [
        { daysAgo: 6, channel: Channel.instagram, note: 'Respondió el anuncio de la preventa de MARQ Collection.' },
        { daysAgo: 3, channel: Channel.reunion, note: 'Reunión en el estudio: le presentamos tipologías y el plan de pagos en pozo.', visitOutcome: VisitOutcome.done, projectSlug: 'marq-collection' },
      ],
      signals: [],
    },
    {
      code: 'p10', name: 'Sofía Romero', phone: '5493624000010', email: 'sofia.romero@correo.com', source: Channel.sitio_web, campaignCode: 'c3',
      projects: ['casa-bdn'], interest: ClientSegment.particular, status: PipelineStatus.visita_agendada,
      profile: { typology: Typology.dos_dormitorios, budget: 70000, financing: Financing.cuotas_estudio },
      journey: ['Formulario web'],
      notes: 'Quiere mudarse con su pareja antes de fin del año que viene.',
      assignedUserId: asesor1Id,
      nextAction: { kind: TaskKind.meeting, text: 'Reunión en la obra · Casas BDN + Terreno', daysDue: 2, time: '18:00', place: MeetingPlace.obra, projectSlug: 'casa-bdn' },
      history: [
        { daysAgo: 11, channel: Channel.sitio_web, note: 'Completó el formulario de Casas BDN en cuotas.' },
        { daysAgo: 2, channel: Channel.visita, note: 'Recorrió la casa modelo de 2 dormitorios. Vuelve con su pareja.', visitOutcome: VisitOutcome.done, projectSlug: 'casa-bdn' },
      ],
      signals: [],
    },
    {
      code: 'p11', name: 'Gustavo Molina', phone: '5493624000011', email: null, source: Channel.facebook, campaignCode: 'c2',
      projects: ['torre-natalini'], interest: ClientSegment.particular, status: PipelineStatus.en_conversacion,
      profile: { typology: Typology.dos_dormitorios, budget: 105000, financing: Financing.credito_hipotecario },
      journey: ['Facebook Ad'],
      notes: 'Busca un 2 dormitorios terminado para mudarse ya.',
      assignedUserId: asesor2Id,
      nextAction: { text: 'Reprogramar la visita a la que no pudo venir', daysDue: 0 },
      history: [
        { daysAgo: 8, channel: Channel.facebook, note: 'Escribió por el anuncio de últimas unidades.' },
        { daysAgo: 2, channel: Channel.reunion, note: 'No vino a la visita de la unidad 14B. Avisó tarde que tuvo un imprevisto.', visitOutcome: VisitOutcome.noshow, projectSlug: 'torre-natalini' },
      ],
      signals: [],
    },
    {
      code: 'p12', name: 'Elena Quiroga', phone: '5493624000012', email: 'elena.quiroga@correo.com', source: Channel.presencial,
      projects: ['pueblo-mio'], interest: ClientSegment.inversor, status: PipelineStatus.en_negociacion,
      profile: { typology: Typology.lote, budget: 60000, goal: InvestGoal.revalorizacion, modality: Modality.indistinto, units: 3 },
      journey: ['Recomendación'],
      notes: 'Busca tres lotes para revender cuando se termine la segunda etapa.',
      assignedUserId: asesor1Id,
      nextAction: { text: 'Enviar el plano del loteo con los lotes elegidos', daysDue: 2 },
      history: [
        { daysAgo: 15, channel: Channel.presencial, note: 'Se acercó al estudio por recomendación de un cliente.' },
        { daysAgo: 1, channel: Channel.visita, note: 'Recorrió Pueblo Mío. Eligió tres lotes de la etapa 2.', visitOutcome: VisitOutcome.done, projectSlug: 'pueblo-mio' },
      ],
      signals: [],
    },
    {
      code: 'p13', name: 'Valentina Ríos', phone: '5493624000013', email: null, source: Channel.facebook, campaignCode: 'c1',
      projects: ['marq-collection'], interest: ClientSegment.inversor, status: PipelineStatus.nuevo_contacto,
      profile: { typology: Typology.un_dormitorio, goal: InvestGoal.renta, modality: Modality.en_pozo },
      journey: ['Facebook Lead'],
      notes: 'Quiere saber si conviene comprar en pozo para alquilar.',
      assignedUserId: asesor2Id,
      showroom: { picks: ['marq-collection', 'torre-panorama'], daysAgo: 1 },
      nextAction: null,
      history: [{ daysAgo: 1, channel: Channel.facebook, note: 'Completó el formulario de la preventa. Preguntó si las unidades se pueden alquilar.' }],
      signals: [
        { hoursAgo: 20, type: ShowroomEventType.open, label: 'Abrió su showroom' },
        { hoursAgo: 19, type: ShowroomEventType.team, projectSlug: 'marq-collection', label: 'Conoció al equipo de MARQ Collection' },
      ],
    },
    {
      code: 'p14', name: 'Federico Paz', phone: '5493624000014', email: null, source: Channel.instagram,
      projects: ['casa-bdn'], interest: ClientSegment.particular, status: PipelineStatus.nuevo_contacto,
      profile: { typology: Typology.dos_dormitorios },
      journey: ['Instagram'],
      notes: 'Quiere mudarse el año que viene.',
      assignedUserId: asesor1Id,
      nextAction: { text: 'Responder por las casas de 2 dormitorios', daysDue: 1 },
      history: [{ daysAgo: 4, channel: Channel.instagram, note: 'Preguntó si hay casas de 2 dormitorios para mudarse el año que viene.' }],
      signals: [],
    },
  ];

  for (const person of peopleSeed) {
    const client = await prisma.client.create({
      data: {
        fullName: person.name,
        phone: person.phone,
        email: person.email,
        segment: person.interest,
        status: person.status,
        source: person.source,
        campaignId: person.campaignCode ? campaignRecordMap[person.campaignCode] : null,
        assignedUserId: person.assignedUserId || null,
        notes: person.notes,
        prefTypology: person.profile.typology || null,
        budgetUsd: person.profile.budget || null,
        financing: (person.profile as any).financing || null,
        goal: (person.profile as any).goal || null,
        modality: (person.profile as any).modality || null,
        units: (person.profile as any).units || 1,
        journey: person.journey,
      },
    });

    // Proyectos de interés
    for (const pSlug of person.projects) {
      const pId = projectRecordMap[pSlug];
      if (pId) {
        await prisma.clientProject.create({ data: { clientId: client.id, projectId: pId } });
      }
    }

    // Historial
    for (const hist of person.history) {
      const occurredAt = new Date();
      occurredAt.setDate(occurredAt.getDate() - hist.daysAgo);
      await prisma.interaction.create({
        data: {
          clientId: client.id,
          occurredAt,
          channel: hist.channel,
          note: hist.note,
          visitOutcome: hist.visitOutcome || null,
          projectId: hist.projectSlug ? projectRecordMap[hist.projectSlug] : null,
          createdById: person.assignedUserId || null,
        },
      });
    }

    // Next Action / Task
    if (person.nextAction) {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + person.nextAction.daysDue);
      await prisma.task.create({
        data: {
          clientId: client.id,
          kind: person.nextAction.kind || TaskKind.task,
          text: person.nextAction.text,
          dueDate,
          dueTime: (person.nextAction as any).time || null,
          place: (person.nextAction as any).place || null,
          projectId: (person.nextAction as any).projectSlug ? projectRecordMap[(person.nextAction as any).projectSlug] : null,
          source: (person.nextAction as any).source || TaskSource.manual,
        },
      });
    }

    // Showroom si tiene
    if (person.showroom) {
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      const link = await prisma.showroomLink.create({
        data: {
          clientId: client.id,
          tokenHash,
          expiresAt,
          createdById: person.assignedUserId || null,
        },
      });

      for (const pickSlug of person.showroom.picks) {
        const pId = projectRecordMap[pickSlug];
        if (pId) {
          await prisma.showroomLinkProject.create({
            data: { linkId: link.id, projectId: pId },
          });
        }
      }

      // Señales del showroom
      for (const sig of person.signals) {
        const occurredAt = new Date();
        occurredAt.setHours(occurredAt.getHours() - sig.hoursAgo);
        await prisma.showroomEvent.create({
          data: {
            linkId: link.id,
            occurredAt,
            type: sig.type,
            projectId: (sig as any).projectSlug ? projectRecordMap[(sig as any).projectSlug] : null,
            label: sig.label,
          },
        });
      }
    }
  }
  console.log('✔ 14 contactos creados con historial, tareas y actividad de showroom');

  console.log('--- Seed completado exitosamente ---');
}

main()
  .catch((e) => {
    console.error('Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
