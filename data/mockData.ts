import { User, Factory, ProductionLine, CameraDevice, InspectionRecord, AlertNotification } from '../types';

export const DEMO_USERS: User[] = [];

export const INITIAL_FACTORIES: Factory[] = [
  {
    id: 'fac-1',
    name: 'Apex Precision Works',
    location: 'Berlin, Germany',
    linesCount: 6,
    activeCameras: 24,
    totalInspected: 0,
    passRate: 0,
    status: 'Optimal',
  },
  {
    id: 'fac-2',
    name: 'Quantum Tech Assembly',
    location: 'Tokyo, Japan',
    linesCount: 8,
    activeCameras: 32,
    totalInspected: 0,
    passRate: 0,
    status: 'Optimal',
  },
  {
    id: 'fac-3',
    name: 'AeroJet Fabrication Hub',
    location: 'Detroit, USA',
    linesCount: 4,
    activeCameras: 16,
    totalInspected: 0,
    passRate: 0,
    status: 'Optimal',
  },
  {
    id: 'fac-4',
    name: 'Nordic Microelectronics',
    location: 'Stockholm, Sweden',
    linesCount: 5,
    activeCameras: 20,
    totalInspected: 0,
    passRate: 0,
    status: 'Optimal',
  },
];

export const INITIAL_PRODUCTION_LINES: ProductionLine[] = [
  {
    id: 'line-1',
    factoryId: 'fac-1',
    name: 'Line Alpha - Heavy Gear Assembly',
    category: 'Automotive Powertrain',
    status: 'Running',
    currentSpeed: '140 units/min',
    activeInspector: 'Line Lead',
  },
  {
    id: 'line-2',
    factoryId: 'fac-1',
    name: 'Line Beta - Precision Hydraulics',
    category: 'Fluid Mechanics',
    status: 'Running',
    currentSpeed: '95 units/min',
    activeInspector: 'Shift Specialist',
  },
  {
    id: 'line-3',
    factoryId: 'fac-2',
    name: 'Line PCB-1 - High Density SMT',
    category: 'Avionics Electronics',
    status: 'Running',
    currentSpeed: '320 units/min',
    activeInspector: 'Optical QA Specialist',
  },
  {
    id: 'line-4',
    factoryId: 'fac-3',
    name: 'Line Aero-4 - Turbine Rotor Milling',
    category: 'Aerospace Propulsion',
    status: 'Maintenance',
    currentSpeed: '0 units/min',
    activeInspector: 'Tech Maintenance',
  },
];

export const INITIAL_CAMERAS: CameraDevice[] = [
  {
    id: 'cam-01',
    name: 'Reticle Camera Node Alpha (Line 1)',
    model: 'Basler acA3800-14um Micro-Matrix',
    resolution: '4K UHD (3840x2160)',
    fps: 60,
    status: 'Online',
    ipAddress: '192.168.1.101',
    lineId: 'line-1',
    lineName: 'Line 1 - SMT Board',
    lensType: '25mm C-Mount Low Distortion Telecentric',
    exposure: 'Auto Micro-Sec'
  },
  {
    id: 'cam-02',
    name: 'Reticle Camera Node Beta (Line 2)',
    model: 'Sony Pregius S Polarized Matrix',
    resolution: '4K UHD (3840x2160)',
    fps: 90,
    status: 'Online',
    ipAddress: '192.168.1.102',
    lineId: 'line-2',
    lineName: 'Line 2 - Battery Enclosure',
    lensType: '16mm Ultra-Wide Macro Industrial',
    exposure: '2.4ms Synchronized'
  },
  {
    id: 'cam-03',
    name: 'Reticle Camera Node Gamma (Line 3)',
    model: 'Teledyne Dalsa Genie Nano 5K',
    resolution: '5K High-Res (5120x2880)',
    fps: 45,
    status: 'Online',
    ipAddress: '192.168.1.103',
    lineId: 'line-3',
    lineName: 'Line 3 - Quality Check',
    lensType: '35mm Telephoto Laser Profiler',
    exposure: '1.8ms Strobe Synced'
  }
];

export const SAMPLE_INSPECTIONS: InspectionRecord[] = [];



export const INITIAL_ALERTS: AlertNotification[] = [];
