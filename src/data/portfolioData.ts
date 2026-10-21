import { ProductOrProject, UserProfile, ShowcaseCategory } from '../types';

export const initialProfile: UserProfile = {
  name: 'Raul Eduardo Rodriguez',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  title: 'Analista de Soporte TI · Desarrollo Web, Sistemas & Redes',
  tagline: 'Soluciones integrales de TI: desarrollo de sistemas a medida, soporte técnico empresarial, aplicaciones web e infraestructura de redes seguras.',
  bio: 'Especialista en análisis de soporte TI y desarrollo tecnológico bajo la firma Educom-Tec - Soluciones Informáticas. Cuento con experiencia en resolución de incidencias técnicas L1/L2/L3, mantenimiento de infraestructura, desarrollo de software y sistemas de gestión (ERP, POS, Helpdesk), así como configuración de redes LAN/WAN, switches, routers MikroTik/Cisco y servidores.',
  location: 'Disponible para Proyectos Presenciales & Remotos',
  email: 'rodriguezraul.pro@gmail.com',
  whatsapp: 'https://wa.me/?text=Hola%20Raul,%20deseo%20consultar%20por%20servicios%20de%20Educom-Tec',
  whatsappNumber: '',
  availability: 'Disponible para Soporte TI, Desarrollo & Consultoría de Redes 2026',
  stats: [
    { label: 'Años de Experiencia TI', value: '6+', helper: 'Soporte, Sistemas & Redes' },
    { label: 'Sistemas & Soluciones', value: '45+', helper: 'Desplegados y operativos' },
    { label: 'Uptime & Disponibilidad', value: '99.8%', helper: 'En redes y servidores administrados' },
    { label: 'Incidencias Resueltas', value: '1,500+', helper: 'SLA promedio < 2 horas' },
  ],
  socials: [
    { name: 'Email Directo', url: 'mailto:rodriguezraul.pro@gmail.com', icon: 'Mail' },
    { name: 'LinkedIn', url: 'https://linkedin.com', icon: 'Linkedin' },
    { name: 'GitHub', url: 'https://github.com', icon: 'Github' },
    { name: 'WhatsApp / Teléfono', url: 'https://wa.me/?text=Hola%20Raul,%20deseo%20consultar%20por%20servicios%20de%20Educom-Tec', icon: 'Phone' },
  ],
  experience: [
    {
      role: 'Analista de Soporte TI & Desarrollador Principal',
      company: 'Educom-Tec — Soluciones Informáticas',
      period: '2022 — Presente',
      description: 'Liderazgo en soporte técnico integral para empresas, diseño e implementación de sistemas de gestión (ERP/POS), desarrollo de aplicaciones web a medida y administración de redes corporativas seguras.',
    },
    {
      role: 'Especialista en Soporte Técnico & Redes',
      company: 'Servicios Corporativos & Conectividad',
      period: '2020 — 2022',
      description: 'Mantenimiento preventivo y correctivo de infraestructura tecnológica, administración de routers MikroTik, segmentación VLAN, atención de tickets de soporte y gestión de servidores Windows/Linux.',
    },
    {
      role: 'Desarrollador Web & Sistemas',
      company: 'Soluciones Tecnológicas Digitales',
      period: '2018 — 2020',
      description: 'Creación y mantenimiento de aplicaciones web interactivas, dashboards para monitoreo de operaciones, bases de datos SQL y optimización de flujos de trabajo.',
    },
  ],
  skills: [
    {
      category: 'Soporte Técnico TI & Mesa de Ayuda',
      items: [
        'Diagnóstico Hardware & Software',
        'Helpdesk L1 / L2 / L3 (SLA)',
        'Mantenimiento Preventivo & Correctivo',
        'Windows Server / Active Directory',
        'Linux (Ubuntu Server, Debian)',
        'Políticas de Respaldo & Backup (NAS/Cloud)',
        'Gestión de Activos TI (CMDB)',
      ],
    },
    {
      category: 'Desarrollo Web & Aplicaciones',
      items: [
        'React 19 & TypeScript',
        'Tailwind CSS & Componentes UI',
        'Node.js & Express / Python / PHP',
        'APIs RESTful & Webhooks',
        'Bases de Datos PostgreSQL & MySQL',
        'Aplicaciones Web Progresivas (PWA)',
        'Arquitectura de Software Limpia',
      ],
    },
    {
      category: 'Sistemas Empresariales & Gestión',
      items: [
        'Sistemas ERP & Control de Stock',
        'Puntos de Venta (POS) & Facturación',
        'Sistemas de Tickets & Mesa de Ayuda',
        'Control de Asistencia & Personal',
        'Generación de Reportes PDF / Excel',
        'Control de Roles & Permisos (RBAC)',
      ],
    },
    {
      category: 'Redes, Conectividad & Seguridad',
      items: [
        'Configuración MikroTik RouterOS',
        'Switches Cisco & Ubiquiti UniFi',
        'Segmentación VLAN & Subnetting',
        'VPNs Seguras (WireGuard / IPsec / OpenVPN)',
        'Firewall Perimetral & Reglas NAT',
        'Cableado Estructurado & Racks',
        'Calidad de Servicio (QoS) & Failover',
      ],
    },
  ],
  workflow: [
    {
      step: '01',
      title: 'Diagnóstico & Requerimientos TI',
      description: 'Evaluamos el estado de su infraestructura, red, sistema o requerimiento de software para diseñar una solución técnica precisa y rentable.',
    },
    {
      step: '02',
      title: 'Diseño & Plan de Implementación',
      description: 'Estructuración de la arquitectura del sistema, topología de red o protocolo de soporte, con cronogramas y especificaciones claras.',
    },
    {
      step: '03',
      title: 'Desarrollo & Configuración Rigurosa',
      description: 'Programación limpia de aplicaciones, ensamblaje y configuración de equipos de red y servidores con rigurosas pruebas de seguridad.',
    },
    {
      step: '04',
      title: 'Puesta en Marcha & Soporte Continuo',
      description: 'Despliegue en producción con sello de garantía Educom-Tec, capacitación de usuarios y soporte técnico con SLA garantizado.',
    },
  ],
  clientLogos: [
    { name: 'EDUCOM-TEC', industry: 'Soluciones Informáticas' },
    { name: 'REDES & SERVIDORES', industry: 'Infraestructura TI' },
    { name: 'SISTEMAS ERP/POS', industry: 'Software Empresarial' },
    { name: 'SOPORTE 24/7', industry: 'Mesa de Ayuda' },
  ],
  credentials: [
    { label: 'Firma Digital Registrada', code: 'EDUCOM-TEC-2026-AUTH' },
    { label: 'Especialidad Principal', code: 'Soporte TI · Web · Sistemas · Redes' },
  ],
};

export const initialProducts: ProductOrProject[] = [
  {
    id: 'prod-1',
    title: 'Educom ERP & Inventario Pro',
    subtitle: 'Sistema web de gestión integral de stock, ventas, compras y facturación',
    category: 'systems',
    categoryLabel: 'Sistemas Empresariales',
    slideNumber: '01',
    themeColor: 'teal',
    deckMetrics: [
      { label: 'Módulos Integrados', value: '8 Módulos' },
      { label: 'Control de Stock', value: 'Tiempo Real' },
      { label: 'Exportación', value: 'Excel / PDF' },
    ],
    description: 'Solución completa de software empresarial diseñada para pymes y comercios que necesitan control total sobre su inventario, ventas, compras, clientes y reportes.',
    longDescription: 'Educom ERP & Inventario Pro centraliza la operativa de su empresa: catálogo de artículos con alertas de stock mínimo, gestión de proveedores, emisión de tickets y comprobantes, caja diaria, múltiples depósitos y perfiles de usuario con permisos personalizados.',
    imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
    ],
    tags: ['ERP', 'Inventario', 'Punto de Venta', 'Facturación', 'React', 'Node.js', 'PostgreSQL'],
    price: 'A Medida / Demo Disponible',
    status: 'Disponible',
    demoUrl: 'https://example.com/demo-erp',
    features: [
      'Control de existencias multi-almacén con alertas de stock crítico',
      'Punto de venta (POS) ágil compatible con lectores de código de barras',
      'Cierre de caja diario, arqueos y reportes financieros detallados',
      'Control de acceso basado en roles (Administrador, Cajero, Vendedor, Almacén)',
      'Diseño 100% responsivo para computadoras, tablets y smartphones',
    ],
    technologies: ['React 19', 'TypeScript', 'Node.js', 'PostgreSQL', 'Tailwind CSS'],
    year: '2025',
    deliverables: ['Código fuente completo o despliegue Cloud', 'Base de datos configurada', 'Manual de usuario y capacitación'],
  },
  {
    id: 'prod-2',
    title: 'Educom Desk — Mesa de Ayuda TI & Tickets',
    subtitle: 'Plataforma para gestión de incidencias técnicas, SLA y activos tecnológicos',
    category: 'it-support',
    categoryLabel: 'Soporte TI & Mesa de Ayuda',
    slideNumber: '02',
    themeColor: 'teal',
    deckMetrics: [
      { label: 'Tiempo de Respuesta', value: '-60% SLA' },
      { label: 'Control de Equipos', value: 'CMDB Activos' },
      { label: 'Canales', value: 'Web / Email' },
    ],
    description: 'Sistema diseñado para departamentos de TI y prestadores de servicios que requieren organizar y medir el soporte a usuarios e infraestructura.',
    longDescription: 'Educom Desk automatiza el ciclo de vida de los incidentes técnicos: recepción de solicitudes, priorización según matriz de impacto, asignación automática a técnicos, control de tiempos de resolución (SLA), inventario de equipos asignados a usuarios y base de conocimiento con soluciones frecuentes.',
    imageUrl: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80',
    ],
    tags: ['Helpdesk', 'Soporte TI', 'Tickets', 'SLA', 'Gestión de Equipos', 'CMDB'],
    price: 'Implementación Inmediata',
    status: 'Disponible',
    demoUrl: 'https://example.com/demo-helpdesk',
    features: [
      'Tablero de incidencias en tiempo real con estados (Nuevo, En Proceso, Espera, Resuelto)',
      'Medición de SLA y alertas visuales de tickets próximos a vencer',
      'Módulo CMDB para inventario de computadoras, impresoras, servidores y licencias',
      'Historial técnico completo por usuario y por equipo para auditorías',
      'Base de conocimiento interna para autoservicio de usuarios',
    ],
    technologies: ['TypeScript', 'React', 'Express', 'Tailwind CSS', 'MySQL'],
    year: '2025',
    deliverables: ['Instalación en servidor local o VPS', 'Configuración de correos automáticos', 'Soporte técnico y mantenimiento'],
  },
  {
    id: 'prod-3',
    title: 'NetPulse — Monitor de Redes & Servidores',
    subtitle: 'Dashboard en tiempo real para supervisión de conectividad, uptime y enlaces',
    category: 'networks',
    categoryLabel: 'Redes & Infraestructura',
    slideNumber: '03',
    themeColor: 'teal',
    deckMetrics: [
      { label: 'Monitoreo', value: '24/7 ICMP/SNMP' },
      { label: 'Alertas', value: 'Instantáneas' },
      { label: 'Dispositivos', value: 'MikroTik/Cisco' },
    ],
    description: 'Panel de control para monitoreo continuo de routers, switches, servidores y enlaces a internet con alertas tempranas ante caídas de servicio.',
    longDescription: 'Monitoree la salud de su red corporativa sin software complejo ni costosas licencias. NetPulse verifica periódicamente la respuesta de hosts críticos, mide latencia y pérdida de paquetes, monitorea el consumo de ancho de banda y envía notificaciones automáticas inmediatas para anticiparse a los problemas de los usuarios.',
    imageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=1200&q=80',
    ],
    tags: ['Redes', 'MikroTik', 'SNMP', 'Ping', 'Servidores', 'Uptime', 'NOC'],
    price: 'Consultar Presupuesto',
    status: 'Disponible',
    demoUrl: 'https://example.com/demo-netpulse',
    features: [
      'Supervisión 24/7 de disponibilidad de hosts críticos y puertas de enlace',
      'Gráficos históricos de latencia, jitter y saturación de tráfico',
      'Integración con bots de Telegram y correo electrónico para alertas críticas',
      'Mapa de topología de red visual con estado de cada nodo',
      'Panel accesible desde cualquier navegador o smartphone sin necesidad de software cliente',
    ],
    technologies: ['Node.js', 'React', 'SNMP', 'WebSockets', 'Chart.js'],
    year: '2024',
    deliverables: ['Applet o agente de monitoreo', 'Dashboard web centralizado', 'Ajuste de umbrales de alerta'],
  },
  {
    id: 'prod-4',
    title: 'Educom WebPortal — Plataforma Web Corporativa',
    subtitle: 'Aplicación web moderna y veloz para presencia digital y operaciones en línea',
    category: 'web-apps',
    categoryLabel: 'Desarrollo Web & Apps',
    slideNumber: '04',
    themeColor: 'teal',
    deckMetrics: [
      { label: 'Velocidad Carga', value: '< 0.8s' },
      { label: 'Puntuación SEO', value: '100 / 100' },
      { label: 'Seguridad', value: 'HTTPS / CSP' },
    ],
    description: 'Desarrollo de sitios y aplicaciones web a medida con arquitectura optimizada, diseño contemporáneo de alto impacto y panel de administración.',
    longDescription: 'Construimos su presencia web empresarial con estándares de ingeniería de software modernos. Incluye catálogo interactivo de servicios o productos, integración con WhatsApp y formularios protegidos contra spam, panel para actualizar contenidos y optimización exhaustiva para motores de búsqueda (SEO local y técnico).',
    imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
    tags: ['Desarrollo Web', 'React', 'TypeScript', 'Tailwind CSS', 'SEO', 'PWA'],
    price: 'A Medida',
    status: 'Disponible',
    demoUrl: 'https://example.com/demo-portal',
    features: [
      'Arquitectura modular en React con tiempos de carga instantáneos',
      'Optimización completa para dispositivos móviles y tablets',
      'Panel de autogestión de contenidos sin necesidad de conocimientos de programación',
      'Certificados de seguridad SSL/TLS y buenas prácticas de protección contra ataques web',
    ],
    technologies: ['React 19', 'TypeScript', 'Tailwind CSS', 'Vite', 'Node.js'],
    year: '2025',
    deliverables: ['Código fuente completo', 'Dominio y hosting configurados', 'Garantía técnica de 12 meses'],
  },
  {
    id: 'prod-5',
    title: 'Educom Access — Control de Asistencia & Personal',
    subtitle: 'Software para registro de entradas/salidas, turnos, descansos y reportes',
    category: 'systems',
    categoryLabel: 'Sistemas Empresariales',
    slideNumber: '05',
    themeColor: 'teal',
    deckMetrics: [
      { label: 'Precisión', value: '100% Digital' },
      { label: 'Turnos', value: 'Flexibles' },
      { label: 'Exportación', value: 'Excel / CSV' },
    ],
    description: 'Sistema empresarial para control de asistencia de empleados, compatible con marcación web, dispositivos biométricos o códigos QR seguros.',
    longDescription: 'Automatice el cálculo de horas regulares, horas extra, tardanzas e inasistencias de su personal. Educom Access genera reportes consolidados por departamento o empleado listos para la liquidación de nómina, con justificaciones y control de permisos laborales.',
    imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
    tags: ['Sistemas', 'Control de Personal', 'Asistencia', 'Biométrico', 'RRHH'],
    price: 'Consultar Demo',
    status: 'Disponible',
    demoUrl: 'https://example.com/demo-access',
    features: [
      'Registro de marcaciones con fecha, hora y dispositivo de origen',
      'Configuración de turnos fijos, rotativos y días no laborables',
      'Cálculo automatizado de tardanzas, horas trabajadas y horas extras',
      'Módulo de solicitud de permisos y justificación médica con adjuntos',
      'Exportación directa a hojas de cálculo para el área contable/RRHH',
    ],
    technologies: ['React', 'TypeScript', 'Express', 'SQLite/PostgreSQL'],
    year: '2024',
    deliverables: ['Aplicación web desplegada', 'Documentación de uso', 'Configuración inicial de turnos y empleados'],
  },
  {
    id: 'prod-6',
    title: 'Kit de Redes Corporativas & Seguridad MikroTik',
    subtitle: 'Solución de ingeniería de redes: VLANs, VPNs, Firewall y QoS para empresas',
    category: 'networks',
    categoryLabel: 'Redes & Infraestructura',
    slideNumber: '06',
    themeColor: 'teal',
    deckMetrics: [
      { label: 'Segmentación', value: 'VLANs Seguras' },
      { label: 'VPN', value: 'WireGuard/IPsec' },
      { label: 'Protección', value: 'Firewall SPI' },
    ],
    description: 'Diseño, configuración e implementación de redes locales de alto rendimiento con equipos MikroTik, switches administrables y puntos de acceso inalámbricos.',
    longDescription: 'Asegure la infraestructura de comunicación de su oficina: segmentación en VLANs independientes (Administración, Datos, Cámaras IP de Seguridad y WiFi de Invitados aislada), balanceo de carga con dos proveedores de internet (Failover automático) y túneles VPN cifrados para teletrabajo seguro.',
    imageUrl: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=1200&q=80',
    tags: ['MikroTik', 'RouterOS', 'VLAN', 'VPN', 'Firewall', 'WiFi Corporativo', 'Cableado'],
    price: 'Servicio / Proyecto',
    status: 'Disponible',
    demoUrl: 'https://example.com/demo-redes',
    features: [
      'Segmentación de red por VLANs para aislar tráfico crítico y evitar accesos no autorizados',
      'Implementación de túneles VPN (WireGuard / OpenVPN) para conexión remota cifrada',
      'Políticas de Firewall perimetral para bloqueo de intrusiones y puertos innecesarios',
      'Control de ancho de banda y priorización de tráfico (QoS) para llamadas y videoconferencias',
      'Diagrama topológico detallado y entrega de archivo de respaldo de configuración',
    ],
    technologies: ['MikroTik RouterOS', 'Cisco IOS', 'Ubiquiti UniFi', 'WireGuard', 'VLAN 802.1Q'],
    year: '2025',
    deliverables: ['Script de configuración documentado', 'Diagrama de red en PDF', 'Soporte post-implementación'],
  },
];

export const initialCategories: ShowcaseCategory[] = [
  { id: 'all', label: 'Todos los Sistemas' },
  { id: 'systems', label: 'Sistemas ERP & Gestión' },
  { id: 'web-apps', label: 'Desarrollo Web & Apps' },
  { id: 'it-support', label: 'Soporte TI & Helpdesk' },
  { id: 'networks', label: 'Redes & Infraestructura' },
];

const STORAGE_KEY = 'portfolio_products_v4_educom';
const PROFILE_KEY = 'portfolio_user_profile_v4_educom';
const CATEGORIES_KEY = 'portfolio_categories_v4_educom';
const PASSWORD_KEY = 'portfolio_admin_password_v4_educom';
const DEFAULT_ADMIN_PASSWORD = 'educom2026';

export function getStoredProducts(): ProductOrProject[] {
  if (typeof window === 'undefined') return initialProducts;
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialProducts));
      return initialProducts;
    }
    return JSON.parse(data);
  } catch {
    return initialProducts;
  }
}

export function saveProducts(products: ProductOrProject[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  } catch (err) {
    console.error('Error saving products:', err);
  }
}

export function getStoredCategories(): ShowcaseCategory[] {
  if (typeof window === 'undefined') return initialCategories;
  try {
    const data = localStorage.getItem(CATEGORIES_KEY);
    if (!data) {
      localStorage.setItem(CATEGORIES_KEY, JSON.stringify(initialCategories));
      return initialCategories;
    }
    return JSON.parse(data);
  } catch {
    return initialCategories;
  }
}

export function saveCategories(categories: ShowcaseCategory[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
  } catch (err) {
    console.error('Error saving categories:', err);
  }
}

export function getStoredProfile(): UserProfile {
  if (typeof window === 'undefined') return initialProfile;
  try {
    const data = localStorage.getItem(PROFILE_KEY);
    if (!data) {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(initialProfile));
      return initialProfile;
    }
    return JSON.parse(data);
  } catch {
    return initialProfile;
  }
}

export function saveProfile(profile: UserProfile): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch (err) {
    console.error('Error saving profile:', err);
  }
}

export function getAdminPassword(): string {
  if (typeof window === 'undefined') return DEFAULT_ADMIN_PASSWORD;
  return localStorage.getItem(PASSWORD_KEY) || DEFAULT_ADMIN_PASSWORD;
}

export function setAdminPassword(password: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PASSWORD_KEY, password);
}

export function resetPortfolioData(): {
  profile: UserProfile;
  products: ProductOrProject[];
  categories: ShowcaseCategory[];
} {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(PROFILE_KEY);
    localStorage.removeItem(CATEGORIES_KEY);
    localStorage.removeItem(PASSWORD_KEY);
  }
  return {
    profile: initialProfile,
    products: initialProducts,
    categories: initialCategories,
  };
}

