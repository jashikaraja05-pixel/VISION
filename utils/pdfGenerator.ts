import jsPDF from 'jspdf';
import { InspectionRecord } from '../types';

export function generateInspectionPDF(inspection: InspectionRecord) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Theme Colors
  const darkBg = [15, 23, 42]; // Slate 900
  const metallicHeader = [30, 41, 59]; // Slate 800
  const neonCyan = [6, 182, 212]; // Cyan 500
  const passColor = [16, 185, 129]; // Emerald 500
  const failColor = [239, 68, 68]; // Red 500
  const textWhite = [248, 250, 252];

  // Top Banner
  doc.setFillColor(darkBg[0], darkBg[1], darkBg[2]);
  doc.rect(0, 0, 210, 38, 'F');

  // Title & Subtitle
  doc.setTextColor(neonCyan[0], neonCyan[1], neonCyan[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('VISIONINSPECT AI', 14, 16);

  doc.setFontSize(10);
  doc.setTextColor(203, 213, 225);
  doc.text('AUTOMATED INDUSTRIAL QUALITY AUDIT & INSPECTION REPORT', 14, 24);

  // Status Badge right aligned
  const isPass = inspection.status === 'PASS';
  const badgeColor = isPass ? passColor : failColor;
  doc.setFillColor(badgeColor[0], badgeColor[1], badgeColor[2]);
  doc.roundedRect(148, 10, 48, 18, 3, 3, 'F');
  doc.setTextColor(textWhite[0], textWhite[1], textWhite[2]);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(inspection.status === 'PASS' ? 'AUDIT: PASS' : 'AUDIT: REJECT', 154, 22);

  // Header Line
  doc.setDrawColor(neonCyan[0], neonCyan[1], neonCyan[2]);
  doc.setLineWidth(1);
  doc.line(0, 38, 210, 38);

  // Section 1: Component Metadata Card
  doc.setFillColor(metallicHeader[0], metallicHeader[1], metallicHeader[2]);
  doc.roundedRect(14, 45, 182, 44, 2, 2, 'F');

  doc.setFontSize(11);
  doc.setTextColor(neonCyan[0], neonCyan[1], neonCyan[2]);
  doc.text('1. INSPECTION & COMPONENT METADATA', 20, 54);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(241, 245, 249);

  doc.text(`Report ID: ${inspection.id.toUpperCase()}`, 20, 63);
  doc.text(`Component: ${inspection.componentName}`, 20, 70);
  doc.text(`Component Code: ${inspection.componentCode}`, 20, 77);

  doc.text(`Batch Number: ${inspection.batchNumber}`, 110, 63);
  doc.text(`Factory Facility: ${inspection.factoryName}`, 110, 70);
  doc.text(`Production Line: ${inspection.lineName}`, 110, 77);
  doc.text(`Timestamp: ${inspection.timestamp}`, 110, 84);

  // Section 2: Quality Score & Decision Summary
  doc.setFillColor(metallicHeader[0], metallicHeader[1], metallicHeader[2]);
  doc.roundedRect(14, 95, 182, 38, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(neonCyan[0], neonCyan[1], neonCyan[2]);
  doc.text('2. AI QUALITY SCORE & DECISION MATRIX', 20, 104);

  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text(`Smart Quality Score: ${inspection.qualityScore} / 100`, 20, 114);
  doc.text(`AI Decision Rating: ${inspection.decision.toUpperCase()}`, 20, 122);

  doc.text(`AI Detection Confidence: ${inspection.confidence}%`, 110, 114);
  doc.text(`Processing Latency: ${inspection.processingTimeMs} ms`, 110, 122);

  // Section 3: Defect Anomalies Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('3. DETECTED DEFECT ANOMALIES', 14, 142);

  let yPos = 148;
  if (inspection.defects.length === 0) {
    doc.setFillColor(240, 253, 244);
    doc.roundedRect(14, yPos, 182, 16, 2, 2, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(22, 101, 52);
    doc.text('No physical or sub-surface defect anomalies detected. Surface micro-geometry 100% compliant.', 20, yPos + 10);
    yPos += 24;
  } else {
    // Table Header
    doc.setFillColor(51, 65, 85);
    doc.rect(14, yPos, 182, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);

    doc.text('DEFECT TYPE', 18, yPos + 5.5);
    doc.text('SEVERITY', 60, yPos + 5.5);
    doc.text('CONFIDENCE', 95, yPos + 5.5);
    doc.text('LOCATION (BBOX)', 130, yPos + 5.5);

    yPos += 8;

    inspection.defects.forEach((def, index) => {
      const isEven = index % 2 === 0;
      doc.setFillColor(isEven ? 248 : 241, isEven ? 250 : 245, isEven ? 252 : 249);
      doc.rect(14, yPos, 182, 18, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text(def.type, 18, yPos + 6);

      // Severity tag
      const sevColor = def.severity === 'Critical' ? [220, 38, 38] : def.severity === 'Major' ? [217, 119, 6] : [71, 85, 105];
      doc.setTextColor(sevColor[0], sevColor[1], sevColor[2]);
      doc.text(def.severity, 60, yPos + 6);

      doc.setTextColor(30, 41, 59);
      doc.text(`${def.confidence}%`, 95, yPos + 6);
      doc.setFont('helvetica', 'normal');
      const bboxStr = def.bbox ? `[X:${def.bbox.x}%, Y:${def.bbox.y}%, W:${def.bbox.width}%, H:${def.bbox.height}%]` : '[Region: Active]';
      doc.text(bboxStr, 130, yPos + 6);

      // Reason underneath
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      const explanationStr = def.explanation ? `${def.explanation.substring(0, 85)}...` : 'Optical anomaly detected by AI vision system.';
      doc.text(`Explanation: ${explanationStr}`, 18, yPos + 13);

      yPos += 18;
    });

    yPos += 6;
  }

  // Section 4: Explainable AI & Inspector Sign-off
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('4. EXPLAINABLE AI AUDIT SUMMARY & VERIFICATION', 14, yPos);

  yPos += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  const auditNote = inspection.notes || 'Component underwent 8K optical scanning and deep neural gradient spatial inspection.';
  const splitNotes = doc.splitTextToSize(auditNote, 182);
  doc.text(splitNotes, 14, yPos);

  yPos += splitNotes.length * 5 + 15;

  // Signature Block
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.5);
  doc.line(14, yPos, 85, yPos);
  doc.line(110, yPos, 182, yPos);

  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Certified Inspector: ${inspection.inspectorName}`, 14, yPos + 5);
  doc.text('Quality Assurance Supervisor Sign-Off', 110, yPos + 5);

  // Footer
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('VisionInspect AI System - ISO 9001 / IATF 16949 Compliant Visual Inspection Artifact', 14, 285);
  doc.text(`Generated: ${new Date().toLocaleString()} | Confidential Enterprise Document`, 110, 285);

  // Save PDF file
  doc.save(`VisionInspect_Report_${inspection.id}_${inspection.componentCode}.pdf`);
}
