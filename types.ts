export type UserRole = 'Admin' | 'Inspector';

export type UserApprovalStatus = 'Pending Approval' | 'Approved' | 'Rejected' | 'Disabled' | 'Active' | 'Offline' | 'On Shift';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  avatar: string;
  factoryId: string;
  factoryName?: string;
  employeeId?: string;
  status: UserApprovalStatus;
  lastActive: string;
  createdAt?: string;
}

export type DefectType = 
  | 'Crack' 
  | 'Scratch' 
  | 'Dent' 
  | 'Rust' 
  | 'Burn Mark'
  | 'Thermal Damage'
  | 'Missing Part' 
  | 'Discoloration'
  | 'Dimensional Deformity'
  | 'Solder Bridge'
  | 'Cold Joint'
  | 'Corrosion'
  | 'Contamination'
  | 'Alignment Deviation'
  | 'Porosity'
  | 'Surface Damage';

export type SeverityLevel = 'Critical' | 'Major' | 'Minor';

export interface BoundingBox {
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  width: number; // percentage 0-100
  height: number; // percentage 0-100
  label: string;
}

export interface DefectItem {
  id: string;
  type: DefectType;
  severity: SeverityLevel;
  confidence: number; // 0-100
  bbox: BoundingBox;
  explanation: string;
  reason: string;
}

export type QualityDecision = 'Excellent' | 'Acceptable' | 'Rework Required' | 'Reject';
export type PassFailStatus = 'PASS' | 'FAIL';

export interface ImageQualityMetrics {
  status: 'PASSED' | 'WARNING' | 'FAILED';
  width: number;
  height: number;
  brightness: number; // 0-255 (mean pixel intensity)
  brightnessStatus: 'Optimal' | 'Underexposed' | 'Overexposed';
  blurScore: number; // Laplacian variance (sharpness threshold: 55)
  clarityStatus: 'Sharp' | 'Marginal' | 'Blurry';
  contrastScore: number; // Standard deviation of luminance
  contrastStatus: 'Optimal' | 'Low Contrast' | 'High Dynamic';
  rejectionReason?: string;
  recommendation?: string;
  preprocessedImageUrl?: string;
  edgeMapImageUrl?: string;
  opencvProcessingTimeMs: number;
}

export interface ValidationInfo {
  imageQualityStatus: 'PASSED' | 'WARNING' | 'FAILED';
  dimensions: string;
  preprocessingStatus: string;
  aiProcessingStatus: string;
  inspectionStatus: string;
  opencvTimeMs: number;
  aiInferenceTimeMs: number;
  totalPipelineTimeMs: number;
  aiConfidence?: number;
}

export interface InspectionRecord {
  id: string;
  componentName: string;
  componentCode: string;
  batchNumber: string;
  factoryId: string;
  factoryName: string;
  lineId: string;
  lineName: string;
  cameraId: string;
  inspectorName: string;
  inspectorId?: string;
  imageOriginal: string;
  imageProcessed?: string;
  heatmapImage?: string;
  defects: DefectItem[];
  qualityScore: number; // 0-100
  decision: QualityDecision;
  status: PassFailStatus;
  confidence: number; // 0-100
  processingTimeMs: number;
  timestamp: string;
  defectType?: DefectType;
  workingCondition?: string;
  notes?: string;
  isRecheck?: boolean;
  replacesInspectionId?: string;

  // Features 1, 2, 3: OpenCV & Structured AI Results
  imageQuality?: ImageQualityMetrics;
  detectedDefectName?: string;
  defectCategory?: string;
  severityLevel?: 'Low' | 'Medium' | 'High' | 'Critical' | 'Major' | 'Minor';
  visualEvidence?: string;
  explanationText?: string;
  recommendedAction?: string;
  validationInfo?: ValidationInfo;
}

export interface AlertNotification {
  id: string;
  inspectionId: string;
  defectType: DefectType;
  severity: SeverityLevel;
  message: string;
  timestamp: string;
  status: 'New' | 'Acknowledged' | 'Resolved';
  channels: ('dashboard' | 'email' | 'sms')[];
  factoryName: string;
  lineName: string;
}

export interface Factory {
  id: string;
  name: string;
  location: string;
  linesCount: number;
  activeCameras: number;
  totalInspected: number;
  passRate: number; // 0-100
  status: 'Optimal' | 'Warning' | 'Maintenance';
}

export interface ProductionLine {
  id: string;
  factoryId: string;
  name: string;
  category: string;
  status: 'Running' | 'Paused' | 'Maintenance';
  currentSpeed: string; // e.g., '120 units/min'
  activeInspector: string;
}

export interface CameraDevice {
  id: string;
  lineId: string;
  lineName: string;
  name: string;
  model: string;
  resolution: string;
  ipAddress: string;
  status: 'Online' | 'Offline' | 'Calibrating';
  fps: number;
  lensType?: string;
  exposure?: string;
}

export type ActiveTab = 
  | 'landing'
  | 'dashboard'
  | 'inspection'
  | 'explainable'
  | 'quality-score'
  | 'alerts'
  | 'reports'
  | 'users'
  | 'history'
  | 'analytics'
  | 'camera-setup'
  | 'settings'
  | 'admin-dashboard'
  | 'messages'
  | 'evaluation';

export interface DirectMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  senderAvatar?: string;
  recipientId: string;
  recipientName: string;
  recipientRole: UserRole;
  factoryName: string;
  inspectionId?: string;
  componentName?: string;
  defectType?: string;
  imageUrl?: string;
  audioUrl?: string;
  audioDuration?: number;
  content: string;
  timestamp: string;
  createdAt?: string;
  read: boolean;
}

export interface LoginLog {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: UserRole;
  factoryName?: string;
  status: 'Successful Login' | 'Failed Login';
  loginTimestamp: string;
  device?: string;
  ipAddress?: string;
}

export interface TestCaseRecord {
  id: string;
  testCaseId: string;
  title: string;
  inputType: string;
  sampleImageUrl?: string;
  imageQualityStatus: 'PASSED' | 'WARNING' | 'FAILED';
  blurScore: number;
  brightness: number;
  aiResult: 'PASS' | 'FAIL';
  expectedResult: 'PASS' | 'FAIL';
  observedResult: string;
  defectName?: string;
  defectCategory?: string;
  severity?: 'Low' | 'Medium' | 'High' | 'Critical';
  processingTimeMs: number;
  verdict: 'PASS' | 'FAIL';
  notes: string;
  timestamp: string;
}

