// Mock data for Masterpiece Tools — REAL products & images scraped from masterpiece-tools.com/precision-gauges
// Will be replaced by backend API in Phase 2

const WIX_BASE = 'https://static.wixstatic.com/media';
// Hero / background imagery (real from masterpiece-tools.com)
export const SITE_IMAGES = {
  heroBg: `${WIX_BASE}/969172_8a678c4d2dc3441aa32a5abadc5c4a75~mv2.jpg/v1/fill/w_1920,h_1080,al_c,q_85,enc_auto/ai-generated-IMAGE.jpg`,
  precisionGaugeCloseup: `${WIX_BASE}/969172_7703292b5d0d44c3ab6943aa3a091949~mv2.png/v1/fill/w_1200,h_1200,al_c,q_90,enc_auto/Precision%20Gauge%20Closeup.png`,
  calibrationBg: `${WIX_BASE}/969172_17748e30c2fb45e99f3a4a21a3340224~mv2.jpg/v1/fill/w_1600,h_896,al_c,q_85,enc_auto/ai-generated-IMAGE.jpg`,
  gaugeKit: `${WIX_BASE}/969172_b63d1504a68a4615b0855238a670858f~mv2.jpg/v1/fill/w_1200,h_900,al_c,q_85,enc_auto/ai-generated-IMAGE.jpg`,
  precisionPageBg: `${WIX_BASE}/969172_f69e1d5b621e42959bf57599aab46114~mv2.jpg/v1/fill/w_1920,h_1080,al_c,q_85,enc_auto/ai-generated-IMAGE.jpg`,
};

export const CATEGORIES = [
  {
    id: 'precision-gauges',
    slug: 'precision-gauges',
    nameKey: 'cat.precisionGauges',
    descKey: 'cat.precisionGaugesDesc',
    image: SITE_IMAGES.precisionGaugeCloseup,
  },
  {
    id: 'custom-cutting-tools',
    slug: 'custom-cutting-tools',
    nameKey: 'cat.cuttingTools',
    descKey: 'cat.cuttingToolsDesc',
    image: 'https://images.unsplash.com/photo-1666634157070-6fd830fb5672?crop=entropy&cs=srgb&fm=jpg&w=1200&q=85',
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

// REAL products from https://www.masterpiece-tools.com/precision-gauges
const img = (id) => `${WIX_BASE}/${id}/v1/fill/w_1200,h_900,al_c,q_90,enc_auto/file.png`;

export const PRODUCTS = [
  {
    id: 'p1', slug: 'metric-size-plug', nameKey: 'p.metricPlug',
    category: 'precision-gauges', subcategory: 'plain',
    image: img('969172_0be0095e67a14b4086ce944742417a91~mv2.png'),
    descKey: 'p.metricPlugDesc',
    specs: { tolerance: 'IT6 / IT7', material: 'Tool Steel (HRC 60+)', standard: 'ISO 1938-1 / DIN 2245', range: 'Ø1.0 – 200.0 mm', finish: 'Lapped & polished', certificate: 'ISO 17025 / DAkkS optional' },
    features: ['Hardened tool steel construction', 'Sub-micron lapping finish', 'Traceable calibration certificate', 'GO / NO-GO pair available'],
    leadTime: '2-4 weeks',
    badge: 'aerospace',
    specSheet: '/specs/metric-size-plug.pdf'
  },
  {
    id: 'p2', slug: 'metric-size-ring', nameKey: 'p.metricRing',
    category: 'precision-gauges', subcategory: 'plain',
    image: img('969172_797c5c1e6ce246ae9a1163592319f1f7~mv2.png'),
    descKey: 'p.metricRingDesc',
    specs: { tolerance: 'IT6 / IT7', material: 'Tool Steel (HRC 60+)', standard: 'ISO 1938-1 / DIN 2250', range: 'Ø3.0 – 300.0 mm', finish: 'Internal precision-ground', certificate: 'ISO 17025 / DAkkS optional' },
    features: ['Hardened ring with knurled exterior', 'Internal mirror finish', 'GO / NO-GO available', 'Traceable to NMI standards'],
    leadTime: '2-4 weeks',
    badge: 'aerospace',
    specSheet: '/specs/metric-size-ring.pdf'
  },
  {
    id: 'p3', slug: 'thread-plug', nameKey: 'p.threadPlug',
    category: 'precision-gauges', subcategory: 'thread',
    image: img('969172_06f98c373d89475fa86cb8a9d65105d7~mv2.png'),
    descKey: 'p.threadPlugDesc',
    specs: { tolerance: '6H / 6G / 4H5H', material: 'Tool Steel HRC 60-62', standard: 'ISO 1502 / DIN 13', range: 'M1 – M200', pitch: '0.25 – 6 mm', certificate: 'Calibration cert included' },
    features: ['Metric ISO thread system', 'GO + NO-GO configuration', 'Hardened & ground threads', 'Multiple tolerance classes'],
    leadTime: '2-4 weeks',
    badge: 'iso',
    specSheet: '/specs/thread-plug.pdf'
  },
  {
    id: 'p4', slug: 'inch-size-ring', nameKey: 'p.inchRing',
    category: 'precision-gauges', subcategory: 'plain',
    image: img('969172_7b64125e9de94d3eab09c6dd31eeaf2c~mv2.png'),
    descKey: 'p.inchRingDesc',
    specs: { tolerance: 'XX / X / Y / Z', material: 'Tool Steel HRC 60+', standard: 'ASME B89.1.6', range: '0.040" – 12.000"', finish: 'Internal lapped', certificate: 'NIST traceable' },
    features: ['Inch system master ring', 'Class XX through Z', 'Lifetime stability', 'Custom sizes available'],
    leadTime: '2-4 weeks',
    badge: 'aerospace',
    specSheet: '/specs/inch-size-ring.pdf'
  },
  {
    id: 'p5', slug: 'inch-size-plug', nameKey: 'p.inchPlug',
    category: 'precision-gauges', subcategory: 'plain',
    image: img('969172_62120a891e0342a395f5e95d047ed33b~mv2.png'),
    descKey: 'p.inchPlugDesc',
    specs: { tolerance: 'XX / X / Y / Z', material: 'Tool Steel HRC 60+', standard: 'ASME B89.1.5', range: '0.0100" – 8.0000"', finish: 'Lapped sub-micron', certificate: 'NIST traceable' },
    features: ['Inch system master plug', 'Class XX (±0.00002")', 'Carbide tip option', 'Custom step plug available'],
    leadTime: '2-4 weeks',
    badge: 'aerospace',
    specSheet: '/specs/inch-size-plug.pdf'
  },
  {
    id: 'p6', slug: 'thread-ring', nameKey: 'p.threadRing',
    category: 'precision-gauges', subcategory: 'thread',
    image: img('969172_6a7d598deba84ea3b38372a32518c3db~mv2.png'),
    descKey: 'p.threadRingDesc',
    specs: { tolerance: '6g / 6e / 4g6g', material: 'Hardened Steel', standard: 'ISO 1502 / DIN 13', range: 'M1 – M200', type: 'Adjustable / Solid', certificate: 'Calibration cert included' },
    features: ['Adjustable or solid ring', 'External thread verification', 'GO / NO-GO sets', 'Knurled grip surface'],
    leadTime: '2-4 weeks',
    badge: 'iso',
    specSheet: '/specs/thread-ring.pdf'
  },
  {
    id: 'p7', slug: 'thread-plug-basic-npt', nameKey: 'p.threadPlugNPT',
    category: 'precision-gauges', subcategory: 'taper',
    image: img('969172_3a9fd96ceac348daba50351602345a12~mv2.png'),
    descKey: 'p.threadPlugNPTDesc',
    specs: { tolerance: 'L1 / L2 / L3', material: 'Tool Steel HRC 60+', standard: 'ANSI B1.20.1 / ISO 7-2', range: 'NPT 1/16" – 4"', taper: '1:16 (¾"/ft)', certificate: 'Traceable certificate' },
    features: ['American National Standard taper', 'L1 step gauge included', 'NPTF dryseal available', 'Pipe thread inspection'],
    leadTime: '3-5 weeks',
    badge: 'precision',
    specSheet: '/specs/thread-plug-basic-npt.pdf'
  },
  {
    id: 'p8', slug: 'thread-ring-basic-npt', nameKey: 'p.threadRingNPT',
    category: 'precision-gauges', subcategory: 'taper',
    image: img('969172_14b0552100104748b8ba8b46e2e4f83b~mv2.png'),
    descKey: 'p.threadRingNPTDesc',
    specs: { tolerance: 'L1 Basic', material: 'Hardened Steel', standard: 'ANSI B1.20.1', range: 'NPT/NPTF 1/16" – 4"', taper: '1:16', certificate: 'Calibration cert included' },
    features: ['Basic L1 reference ring', 'NPT/NPTF compatible', 'External taper thread', 'Hand-tight verification'],
    leadTime: '3-5 weeks',
    badge: 'precision',
    specSheet: '/specs/thread-ring-basic-npt.pdf'
  },
  {
    id: 'p9', slug: 'thread-plug-basic', nameKey: 'p.threadPlugBasic',
    category: 'precision-gauges', subcategory: 'thread',
    image: img('969172_3a9fd96ceac348daba50351602345a12~mv2.png'),
    descKey: 'p.threadPlugBasicDesc',
    specs: { tolerance: 'Basic / Class X', material: 'Hardened Steel', standard: 'ISO 1502', range: 'Custom on request', certificate: 'Calibration cert included' },
    features: ['Reference master plug', 'High-accuracy basic class', 'Suitable for setting gauges', 'Custom specifications'],
    leadTime: '2-4 weeks',
    badge: 'iso',
    specSheet: '/specs/thread-plug-basic-npt.pdf'
  },
  {
    id: 'p10', slug: 'taper-thread-ring', nameKey: 'p.taperThreadRing',
    category: 'precision-gauges', subcategory: 'taper',
    image: img('969172_159c58dc01934eeba1604a5c0ec2ccd9~mv2.png'),
    descKey: 'p.taperThreadRingDesc',
    specs: { tolerance: 'L1 / L2', material: 'Tool Steel', standard: 'ANSI B1.20.1 / ISO 7-2', range: 'NPT/BSPT 1/16" – 4"', taper: '1:16', certificate: 'Traceable certificate' },
    features: ['Tapered external thread ring', 'BSPT & NPT versions', 'L1 dryseal available', 'Heat-treated for stability'],
    leadTime: '3-5 weeks',
    badge: 'precision',
    specSheet: '/specs/thread-ring-basic-npt.pdf'
  },
  {
    id: 'p11', slug: 'plug-ring-smooth-gauges', nameKey: 'p.smoothGauges',
    category: 'precision-gauges', subcategory: 'plain',
    image: img('969172_07fa2fcee48740a3b1f99983de31b203~mv2.png'),
    descKey: 'p.smoothGaugesDesc',
    specs: { tolerance: 'IT5 / IT6 / IT7', material: 'Tool Steel / Carbide', standard: 'ISO 1938 / ASME B89.1', range: 'Custom Ø0.5 – 500 mm', finish: 'Lapped mirror', certificate: 'ISO 17025 optional' },
    features: ['Bore + shaft inspection', 'Pair sets (plug + ring)', 'Carbide option for wear life', 'GO / NO-GO marking'],
    leadTime: '2-4 weeks',
    badge: 'aerospace',
    specSheet: '/specs/metric-size-plug.pdf'
  },
  {
    id: 'p12', slug: 'buttress-gauge', nameKey: 'p.buttressGauge',
    category: 'precision-gauges', subcategory: 'special',
    image: img('969172_d7339128f9d245e697391be0b4f13190~mv2.png'),
    descKey: 'p.buttressGaugeDesc',
    specs: { tolerance: 'Custom per drawing', material: 'Tool Steel HRC 60+', standard: 'DIN 513 / ANSI B1.9', range: 'Custom on request', angle: '7° / 45°', certificate: 'Full inspection report' },
    features: ['Buttress thread (load-bearing)', 'Oil-industry applications', 'Custom asymmetric profiles', 'Drawing-based manufacture'],
    leadTime: '4-6 weeks',
    badge: 'precision',
    specSheet: '/specs/thread-plug.pdf'
  },
  // Additional products from the home page list (also from masterpiece-tools.com)
  {
    id: 'p13', slug: 'taper-thread-plug', nameKey: 'p.taperThreadPlug',
    category: 'precision-gauges', subcategory: 'taper',
    image: img('969172_3a9fd96ceac348daba50351602345a12~mv2.png'),
    descKey: 'p.taperThreadPlugDesc',
    specs: { tolerance: 'L1 / L2 / L3', material: 'Tool Steel', standard: 'ANSI B1.20.1 / ISO 7-2', range: 'NPT 1/16" – 4"', taper: '1:16', certificate: 'Calibration cert included' },
    features: ['Tapered pipe thread plug', 'L1 hand-tight reference', 'L2 wrench-tight option', 'NPTF dryseal capable'],
    leadTime: '3-5 weeks',
    badge: 'precision',
    specSheet: '/specs/thread-plug-basic-npt.pdf'
  },
  {
    id: 'p14', slug: 'helicoil-metric-plug', nameKey: 'p.helicoilMetric',
    category: 'precision-gauges', subcategory: 'helicoil',
    image: img('969172_06f98c373d89475fa86cb8a9d65105d7~mv2.png'),
    descKey: 'p.helicoilMetricDesc',
    specs: { tolerance: '6H (STI)', material: 'Hardened Steel HRC 60+', standard: 'ISO 1502 (STI)', range: 'M2 – M48', certificate: 'Calibration cert included' },
    features: ['Screw Thread Insert (STI) plug', 'For Helicoil tapped holes', 'Pre-insert tap verification', 'GO + NO-GO pair'],
    leadTime: '2-4 weeks',
    badge: 'iso',
    specSheet: '/specs/thread-plug.pdf'
  },
  {
    id: 'p15', slug: 'helicoil-inch-plug', nameKey: 'p.helicoilInch',
    category: 'precision-gauges', subcategory: 'helicoil',
    image: img('969172_62120a891e0342a395f5e95d047ed33b~mv2.png'),
    descKey: 'p.helicoilInchDesc',
    specs: { tolerance: '2B / 3B (STI)', material: 'Hardened Steel', standard: 'ANSI B1.1 (STI)', range: '#2 – 1-1/2"', certificate: 'Calibration cert included' },
    features: ['STI Helicoil inch plug', 'Class 2B / 3B fit', 'For inserted threads', 'GO / NO-GO available'],
    leadTime: '2-4 weeks',
    badge: 'iso',
    specSheet: '/specs/inch-size-plug.pdf'
  },
  // Custom Cutting Tools
  {
    id: 'p16', slug: 'solid-carbide-endmill', nameKey: 'p.endmill',
    category: 'custom-cutting-tools', subcategory: 'endmills',
    image: 'https://images.unsplash.com/photo-1666634157070-6fd830fb5672?crop=entropy&cs=srgb&fm=jpg&w=1200&q=85',
    descKey: 'p.endmillDesc',
    specs: { grade: 'Sub-micron Carbide', coating: 'TiAlN / AlTiN / nACo', flutes: '2 / 3 / 4 / 6', range: 'Ø0.3 – 25 mm', helixAngle: '30° / 38° / 45°', certificate: 'Geometry inspection' },
    features: ['Sub-micron solid carbide', 'Advanced PVD coatings', 'Variable helix option', 'Custom geometry available'],
    leadTime: '2-3 weeks',
    badge: 'carbide'
  },
  {
    id: 'p17', slug: 'solid-carbide-drill', nameKey: 'p.drill',
    category: 'custom-cutting-tools', subcategory: 'drills',
    image: 'https://images.pexels.com/photos/46240/drill-milling-milling-machine-cutting-tools-46240.jpeg?auto=compress&cs=tinysrgb&w=1200',
    descKey: 'p.drillDesc',
    specs: { grade: 'Sub-micron Carbide', coating: 'TiAlN multi-layer', pointAngle: '140°', range: 'Ø0.5 – 20 mm', cooling: 'Through-coolant option', certificate: 'Geometry inspection' },
    features: ['Through-coolant 3D printed', 'Self-centering point', 'Multi-layer PVD coating', 'High-feed CNC optimized'],
    leadTime: '2-3 weeks',
    badge: 'carbide'
  },
  {
    id: 'p18', slug: 'precision-reamer', nameKey: 'p.reamer',
    category: 'custom-cutting-tools', subcategory: 'reamers',
    image: 'https://images.unsplash.com/photo-1613206485381-b028e578e791?crop=entropy&cs=srgb&fm=jpg&w=1200&q=85',
    descKey: 'p.reamerDesc',
    specs: { tolerance: 'H7 / G6 / F7 / H6', material: 'Solid Carbide / HSS-Co', coating: 'TiN / TiAlN', range: 'Ø1.0 – 50 mm', flutes: '6 / 8 straight or helical', certificate: 'Bore-size verified' },
    features: ['Tight-tolerance bore finishing', 'Straight or spiral flutes', 'Custom step reamers', 'Replaceable head option'],
    leadTime: '3-4 weeks',
    badge: 'precision'
  }
];

export const PILLARS = [
  { icon: 'Crosshair', titleKey: 'pillar.subMicron', descKey: 'pillar.subMicronDesc', stat: '±0.001', statLabel: 'mm tolerance' },
  { icon: 'BadgeCheck', titleKey: 'pillar.certified', descKey: 'pillar.certifiedDesc', stat: 'ISO 17025', statLabel: 'traceable' },
  { icon: 'Settings2', titleKey: 'pillar.custom', descKey: 'pillar.customDesc', stat: '24-48h', statLabel: 'RFQ response' },
  { icon: 'Truck', titleKey: 'pillar.logistics', descKey: 'pillar.logisticsDesc', stat: 'EU', statLabel: 'gateway' }
];

export const PROCESS_STEPS = [
  { num: '01', titleKey: 'proc.review', descKey: 'proc.reviewDesc', icon: 'FileSearch' },
  { num: '02', titleKey: 'proc.analysis', descKey: 'proc.analysisDesc', icon: 'Microscope' },
  { num: '03', titleKey: 'proc.design', descKey: 'proc.designDesc', icon: 'Pencil' },
  { num: '04', titleKey: 'proc.manufacture', descKey: 'proc.manufactureDesc', icon: 'Cog' },
  { num: '05', titleKey: 'proc.inspect', descKey: 'proc.inspectDesc', icon: 'ScanSearch' },
  { num: '06', titleKey: 'proc.deliver', descKey: 'proc.deliverDesc', icon: 'PackageCheck' }
];

export const INDUSTRIES = [
  { icon: 'Plane', nameKey: 'ind.aerospace' },
  { icon: 'Shield', nameKey: 'ind.defense' },
  { icon: 'Stethoscope', nameKey: 'ind.medical' },
  { icon: 'Cpu', nameKey: 'ind.semiconductor' },
  { icon: 'Car', nameKey: 'ind.automotive' },
  { icon: 'Factory', nameKey: 'ind.industrial' }
];

export const STATS = [
  { value: 15, suffix: '+', labelKey: 'stats.years', icon: 'CalendarClock' },
  { value: 0.001, prefix: '±', suffix: 'mm', labelKey: 'stats.tolerance', decimals: 3, icon: 'Crosshair' },
  { value: 500, suffix: '+', labelKey: 'stats.clients', icon: 'Users' },
  { value: 24, suffix: 'h', labelKey: 'stats.rfq', icon: 'Zap' }
];

export const CLIENT_LOGOS = [
  'AEROSPACE CO.', 'DEFENSE SYS.', 'PRECISION MFG.', 'AERO IND.',
  'CNC SOLUTIONS', 'MED DEVICES', 'TECHJET', 'IND. GROUP',
  'AEROSPACE OEM', 'EU MFG', 'DEFENSE INC.', 'PRECISION GMBH'
];

// Owner panel mock data
export const MOCK_QUOTES = [
  {
    id: 'Q-2025-001', date: '2025-07-08T10:30:00Z',
    customer: { name: 'John Schmidt', company: 'Aero Precision GmbH', email: 'j.schmidt@aero-precision.de', country: 'Germany' },
    items: [{ productId: 'p1', name: 'Metric Size Plug', qty: 5, notes: 'M12x1.5 6H' }, { productId: 'p3', name: 'Thread Plug', qty: 3, notes: 'M20x2.5 6H' }],
    notes: 'Need aerospace certification with each unit.',
    status: 'new', total: null
  },
  {
    id: 'Q-2025-002', date: '2025-07-07T14:15:00Z',
    customer: { name: 'Marie Dubois', company: 'Airbus Helicopters', email: 'marie.dubois@airbus.fr', country: 'France' },
    items: [{ productId: 'p12', name: 'Buttress Gauge', qty: 2, notes: 'Custom buttress thread per drawing' }],
    notes: 'Custom drawing attached. ITAR-compliant required.',
    status: 'replied', total: 2840
  },
  {
    id: 'Q-2025-003', date: '2025-07-05T09:45:00Z',
    customer: { name: 'Pieter de Jong', company: 'NLR Aerospace', email: 'pieter@nlr.nl', country: 'Netherlands' },
    items: [{ productId: 'p16', name: 'Solid Carbide Endmill', qty: 50, notes: 'Ø8mm 4 flute TiAlN' }],
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
