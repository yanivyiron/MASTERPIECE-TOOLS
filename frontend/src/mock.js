// Mock data for Masterpiece Tools (1:1 clone with 10x enhancements)
// Will be replaced by backend API in Phase 2

export const CATEGORIES = [
  {
    id: 'precision-gauges',
    slug: 'precision-gauges',
    nameKey: 'cat.precisionGauges',
    descKey: 'cat.precisionGaugesDesc',
    image: 'https://images.pexels.com/photos/10290630/pexels-photo-10290630.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
  },
  {
    id: 'custom-cutting-tools',
    slug: 'custom-cutting-tools',
    nameKey: 'cat.cuttingTools',
    descKey: 'cat.cuttingToolsDesc',
    image: 'https://images.unsplash.com/photo-1666634157070-6fd830fb5672?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA2OTV8MHwxfHNlYXJjaHwxfHxDTkMlMjBtYWNoaW5pbmd8ZW58MHx8fHwxNzgyMDY2OTI1fDA&ixlib=rb-4.1.0&q=85',
  },
];

export const SUBCATEGORIES = [
  { id: 'thread', nameKey: 'sub.thread', parent: 'precision-gauges' },
  { id: 'plain', nameKey: 'sub.plain', parent: 'precision-gauges' },
  { id: 'taper', nameKey: 'sub.taper', parent: 'precision-gauges' },
  { id: 'helicoil', nameKey: 'sub.helicoil', parent: 'precision-gauges' },
  { id: 'special', nameKey: 'sub.special', parent: 'precision-gauges' },
  { id: 'endmills', nameKey: 'sub.endmills', parent: 'custom-cutting-tools' },
  { id: 'drills', nameKey: 'sub.drills', parent: 'custom-cutting-tools' },
  { id: 'reamers', nameKey: 'sub.reamers', parent: 'custom-cutting-tools' },
];

export const PRODUCTS = [
  {
    id: 'p1', slug: 'metric-size-plug', nameKey: 'p.metricPlug',
    category: 'precision-gauges', subcategory: 'plain',
    image: 'https://static.wixstatic.com/media/969172_8a678c4d2dc3441aa32a5abadc5c4a75~mv2.jpg/v1/fill/w_800,h_600,al_c,q_85/file.jpg',
    images: ['https://images.pexels.com/photos/10290630/pexels-photo-10290630.jpeg?auto=compress&cs=tinysrgb&w=940'],
    descKey: 'p.metricPlugDesc',
    specs: { tolerance: 'IT6 / IT7', material: 'Tool Steel', standard: 'ISO 1938-1', range: '1.0 - 200.0 mm' },
    leadTime: '2-4 weeks',
    badge: 'aerospace'
  },
  {
    id: 'p2', slug: 'thread-plug-gauge', nameKey: 'p.threadPlug',
    category: 'precision-gauges', subcategory: 'thread',
    image: 'https://images.unsplash.com/photo-1711418235334-8895331a6cf9?crop=entropy&cs=srgb&fm=jpg&w=940&q=85',
    descKey: 'p.threadPlugDesc',
    specs: { tolerance: '6H / 6G', material: 'Hardened Steel HRC 60+', standard: 'ISO 1502 / DIN 13', range: 'M1 - M200' },
    leadTime: '2-4 weeks',
    badge: 'iso'
  },
  {
    id: 'p3', slug: 'taper-thread-plug', nameKey: 'p.taperThreadPlug',
    category: 'precision-gauges', subcategory: 'taper',
    image: 'https://images.pexels.com/photos/8956445/pexels-photo-8956445.jpeg?auto=compress&cs=tinysrgb&w=940',
    descKey: 'p.taperThreadPlugDesc',
    specs: { tolerance: 'L1 / L2 / L3', material: 'Tool Steel', standard: 'ANSI B1.20.1 / ISO 7-2', range: 'NPT 1/16 - 4 inch' },
    leadTime: '3-5 weeks',
    badge: 'precision'
  },
  {
    id: 'p4', slug: 'helicoil-metric-plug', nameKey: 'p.helicoilMetric',
    category: 'precision-gauges', subcategory: 'helicoil',
    image: 'https://images.unsplash.com/photo-1666634157070-6fd830fb5672?crop=entropy&cs=srgb&fm=jpg&w=940&q=85',
    descKey: 'p.helicoilMetricDesc',
    specs: { tolerance: '6H', material: 'Hardened Steel', standard: 'ISO 1502 (STI)', range: 'M2 - M48' },
    leadTime: '2-4 weeks',
    badge: 'iso'
  },
  {
    id: 'p5', slug: 'metric-size-ring', nameKey: 'p.metricRing',
    category: 'precision-gauges', subcategory: 'plain',
    image: 'https://images.pexels.com/photos/46240/drill-milling-milling-machine-cutting-tools-46240.jpeg?auto=compress&cs=tinysrgb&w=940',
    descKey: 'p.metricRingDesc',
    specs: { tolerance: 'IT6 / IT7', material: 'Tool Steel', standard: 'ISO 1938-1', range: '3.0 - 300.0 mm' },
    leadTime: '2-4 weeks',
    badge: 'aerospace'
  },
  {
    id: 'p6', slug: 'thread-ring-gauge', nameKey: 'p.threadRing',
    category: 'precision-gauges', subcategory: 'thread',
    image: 'https://images.unsplash.com/photo-1689942007095-737d731806ad?crop=entropy&cs=srgb&fm=jpg&w=940&q=85',
    descKey: 'p.threadRingDesc',
    specs: { tolerance: '6g / 6e', material: 'Hardened Steel', standard: 'ISO 1502 / DIN 13', range: 'M1 - M200' },
    leadTime: '2-4 weeks',
    badge: 'iso'
  },
  {
    id: 'p7', slug: 'taper-thread-ring', nameKey: 'p.taperThreadRing',
    category: 'precision-gauges', subcategory: 'taper',
    image: 'https://images.pexels.com/photos/8865187/pexels-photo-8865187.jpeg?auto=compress&cs=tinysrgb&w=940',
    descKey: 'p.taperThreadRingDesc',
    specs: { tolerance: 'L1 / L2', material: 'Tool Steel', standard: 'ANSI B1.20.1', range: 'NPT 1/16 - 4 inch' },
    leadTime: '3-5 weeks',
    badge: 'precision'
  },
  {
    id: 'p8', slug: 'helicoil-inch-plug', nameKey: 'p.helicoilInch',
    category: 'precision-gauges', subcategory: 'helicoil',
    image: 'https://images.unsplash.com/photo-1564901523975-b18a3eb1d11f?crop=entropy&cs=srgb&fm=jpg&w=940&q=85',
    descKey: 'p.helicoilInchDesc',
    specs: { tolerance: '2B / 3B', material: 'Hardened Steel', standard: 'ANSI B1.1 (STI)', range: '#2 - 1-1/2 inch' },
    leadTime: '2-4 weeks',
    badge: 'iso'
  },
  {
    id: 'p9', slug: 'inch-size-plug', nameKey: 'p.inchPlug',
    category: 'precision-gauges', subcategory: 'plain',
    image: 'https://images.unsplash.com/photo-1613206485381-b028e578e791?crop=entropy&cs=srgb&fm=jpg&w=940&q=85',
    descKey: 'p.inchPlugDesc',
    specs: { tolerance: 'XX / X / Y / Z', material: 'Tool Steel', standard: 'ASME B89.1.5', range: '0.0100 - 8.0000 inch' },
    leadTime: '2-4 weeks',
    badge: 'aerospace'
  },
  {
    id: 'p10', slug: 'thread-plug-npt', nameKey: 'p.threadPlugNPT',
    category: 'precision-gauges', subcategory: 'thread',
    image: 'https://images.unsplash.com/photo-1666618090858-fbcee636bd3e?crop=entropy&cs=srgb&fm=jpg&w=940&q=85',
    descKey: 'p.threadPlugNPTDesc',
    specs: { tolerance: 'L1', material: 'Hardened Steel', standard: 'ANSI B1.20.1', range: 'NPT/NPTF 1/16 - 4"' },
    leadTime: '3-5 weeks',
    badge: 'precision'
  },
  {
    id: 'p11', slug: 'inch-size-ring', nameKey: 'p.inchRing',
    category: 'precision-gauges', subcategory: 'plain',
    image: 'https://images.pexels.com/photos/10290630/pexels-photo-10290630.jpeg?auto=compress&cs=tinysrgb&w=940',
    descKey: 'p.inchRingDesc',
    specs: { tolerance: 'XX / X / Y / Z', material: 'Tool Steel', standard: 'ASME B89.1.6', range: '0.040 - 12.0 inch' },
    leadTime: '2-4 weeks',
    badge: 'aerospace'
  },
  {
    id: 'p12', slug: 'thread-ring-npt', nameKey: 'p.threadRingNPT',
    category: 'precision-gauges', subcategory: 'thread',
    image: 'https://images.pexels.com/photos/8956445/pexels-photo-8956445.jpeg?auto=compress&cs=tinysrgb&w=940',
    descKey: 'p.threadRingNPTDesc',
    specs: { tolerance: 'L1', material: 'Hardened Steel', standard: 'ANSI B1.20.1', range: 'NPT/NPTF 1/16 - 4"' },
    leadTime: '3-5 weeks',
    badge: 'precision'
  },
  {
    id: 'p13', slug: 'buttress-gauge', nameKey: 'p.buttressGauge',
    category: 'precision-gauges', subcategory: 'special',
    image: 'https://images.unsplash.com/photo-1711418235334-8895331a6cf9?crop=entropy&cs=srgb&fm=jpg&w=940&q=85',
    descKey: 'p.buttressGaugeDesc',
    specs: { tolerance: 'Custom', material: 'Tool Steel', standard: 'DIN 513 / ANSI B1.9', range: 'Custom on request' },
    leadTime: '4-6 weeks',
    badge: 'precision'
  },
  {
    id: 'p14', slug: 'solid-carbide-endmill', nameKey: 'p.endmill',
    category: 'custom-cutting-tools', subcategory: 'endmills',
    image: 'https://images.unsplash.com/photo-1666634157070-6fd830fb5672?crop=entropy&cs=srgb&fm=jpg&w=940&q=85',
    descKey: 'p.endmillDesc',
    specs: { grade: 'Sub-micron Carbide', coating: 'TiAlN / AlTiN', flutes: '2/3/4/6', range: 'Ø0.3 - 25 mm' },
    leadTime: '2-3 weeks',
    badge: 'carbide'
  },
  {
    id: 'p15', slug: 'solid-carbide-drill', nameKey: 'p.drill',
    category: 'custom-cutting-tools', subcategory: 'drills',
    image: 'https://images.pexels.com/photos/46240/drill-milling-milling-machine-cutting-tools-46240.jpeg?auto=compress&cs=tinysrgb&w=940',
    descKey: 'p.drillDesc',
    specs: { grade: 'Sub-micron Carbide', coating: 'TiAlN', point: '140°', range: 'Ø0.5 - 20 mm' },
    leadTime: '2-3 weeks',
    badge: 'carbide'
  },
  {
    id: 'p16', slug: 'precision-reamer', nameKey: 'p.reamer',
    category: 'custom-cutting-tools', subcategory: 'reamers',
    image: 'https://images.unsplash.com/photo-1613206485381-b028e578e791?crop=entropy&cs=srgb&fm=jpg&w=940&q=85',
    descKey: 'p.reamerDesc',
    specs: { tolerance: 'H7 / G6 / F7', material: 'Solid Carbide / HSS', coating: 'TiN / TiAlN', range: 'Ø1.0 - 50 mm' },
    leadTime: '3-4 weeks',
    badge: 'precision'
  }
];

export const PILLARS = [
  { icon: 'Crosshair', titleKey: 'pillar.subMicron', descKey: 'pillar.subMicronDesc' },
  { icon: 'BadgeCheck', titleKey: 'pillar.certified', descKey: 'pillar.certifiedDesc' },
  { icon: 'Settings2', titleKey: 'pillar.custom', descKey: 'pillar.customDesc' },
  { icon: 'Truck', titleKey: 'pillar.logistics', descKey: 'pillar.logisticsDesc' }
];

export const PROCESS_STEPS = [
  { num: '01', titleKey: 'proc.review', descKey: 'proc.reviewDesc' },
  { num: '02', titleKey: 'proc.analysis', descKey: 'proc.analysisDesc' },
  { num: '03', titleKey: 'proc.design', descKey: 'proc.designDesc' },
  { num: '04', titleKey: 'proc.manufacture', descKey: 'proc.manufactureDesc' },
  { num: '05', titleKey: 'proc.inspect', descKey: 'proc.inspectDesc' },
  { num: '06', titleKey: 'proc.deliver', descKey: 'proc.deliverDesc' }
];

export const INDUSTRIES = [
  { icon: 'Plane', nameKey: 'ind.aerospace' },
  { icon: 'Shield', nameKey: 'ind.defense' },
  { icon: 'Stethoscope', nameKey: 'ind.medical' },
  { icon: 'Cpu', nameKey: 'ind.semiconductor' },
  { icon: 'Car', nameKey: 'ind.automotive' },
  { icon: 'Factory', nameKey: 'ind.industrial' }
];

export const CLIENT_LOGOS = [
  { name: 'Aerospace Co.', initials: 'AC' },
  { name: 'Defense Systems', initials: 'DS' },
  { name: 'Precision MFG', initials: 'PM' },
  { name: 'Aero Industries', initials: 'AI' },
  { name: 'CNC Solutions', initials: 'CS' },
  { name: 'Medical Devices', initials: 'MD' },
  { name: 'TechJet Industries', initials: 'TJ' },
  { name: 'Industrial Group', initials: 'IG' }
];

// Owner panel mock data
export const MOCK_QUOTES = [
  {
    id: 'Q-2025-001', date: '2025-07-08T10:30:00Z',
    customer: { name: 'John Schmidt', company: 'Aero Precision GmbH', email: 'j.schmidt@aero-precision.de', country: 'Germany' },
    items: [{ productId: 'p1', name: 'Metric Size Plug', qty: 5, notes: 'M12x1.5 6H' }, { productId: 'p2', name: 'Thread Plug', qty: 3, notes: 'M20x2.5 6H' }],
    notes: 'Need aerospace certification with each unit.',
    status: 'new', total: null
  },
  {
    id: 'Q-2025-002', date: '2025-07-07T14:15:00Z',
    customer: { name: 'Marie Dubois', company: 'Airbus Helicopters', email: 'marie.dubois@airbus.fr', country: 'France' },
    items: [{ productId: 'p13', name: 'Buttress Gauge', qty: 2, notes: 'Custom buttress thread per drawing' }],
    notes: 'Custom drawing attached. ITAR-compliant required.',
    status: 'replied', total: 2840
  },
  {
    id: 'Q-2025-003', date: '2025-07-05T09:45:00Z',
    customer: { name: 'Pieter de Jong', company: 'NLR Aerospace', email: 'pieter@nlr.nl', country: 'Netherlands' },
    items: [{ productId: 'p14', name: 'Solid Carbide Endmill', qty: 50, notes: 'Ø8mm 4 flute TiAlN' }],
    notes: 'Bulk order - need pricing for repeat batches.',
    status: 'in-progress', total: 4250
  }
];

export const MOCK_CUSTOMERS = [
  { id: 'c1', name: 'John Schmidt', company: 'Aero Precision GmbH', email: 'j.schmidt@aero-precision.de', country: 'Germany', quotesCount: 3, totalValue: 12400 },
  { id: 'c2', name: 'Marie Dubois', company: 'Airbus Helicopters', email: 'marie.dubois@airbus.fr', country: 'France', quotesCount: 5, totalValue: 28600 },
  { id: 'c3', name: 'Pieter de Jong', company: 'NLR Aerospace', email: 'pieter@nlr.nl', country: 'Netherlands', quotesCount: 2, totalValue: 4250 },
  { id: 'c4', name: 'Carlos Silva', company: 'Embraer Portugal', email: 'c.silva@embraer.pt', country: 'Portugal', quotesCount: 1, totalValue: 1820 }
];

// Default admin credentials (will be replaced by backend auth)
export const MOCK_ADMIN = { email: 'admin@masterpiece-tools.com', password: 'Master2025!' };
