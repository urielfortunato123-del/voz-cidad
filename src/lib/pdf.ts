import jsPDF from 'jspdf';
import { CATEGORIES, APP_NAME } from './constants';
import type { CategoryKey } from './constants';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ReportData {
  protocol: string;
  uf: string;
  city: string;
  category: CategoryKey;
  title?: string;
  description: string;
  occurred_at: string;
  address_text?: string;
  lat?: number;
  lng?: number;
  is_anonymous: boolean;
  author_name?: string;
  author_contact?: string;
  created_at: string;
  evidences?: Array<{ file_name: string; created_at: string }>;
}

export function generateReportPDF(report: ReportData): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  let y = margin;

  // Header
  doc.setFillColor(40, 100, 60);
  doc.rect(0, 0, pageWidth, 35, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('RELATÓRIO DE DENÚNCIA CIDADÃ', pageWidth / 2, 15, { align: 'center' });
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(APP_NAME, pageWidth / 2, 25, { align: 'center' });

  y = 50;

  // Protocol box
  doc.setFillColor(245, 245, 245);
  doc.roundedRect(margin, y - 8, contentWidth, 20, 3, 3, 'F');
  doc.setTextColor(40, 40, 40);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('PROTOCOLO:', margin + 5, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(14);
  doc.text(report.protocol, margin + 50, y);

  y += 25;

  // Section helper
  const addSection = (title: string, content: string) => {
    if (!content) return;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(80, 80, 80);
    doc.text(title.toUpperCase(), margin, y);
    y += 5;
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(11);
    
    const lines = doc.splitTextToSize(content, contentWidth);
    doc.text(lines, margin, y);
    y += lines.length * 5 + 8;
  };

  // Info grid
  addSection('Local', `${report.city}/${report.uf}`);
  addSection('Categoria', CATEGORIES[report.category]?.label || report.category);
  addSection('Data do Ocorrido', format(new Date(report.occurred_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }));
  addSection('Data/Hora do Registro', format(new Date(report.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }));
  
  // Identification
  if (report.is_anonymous) {
    addSection('Identificação', 'Denúncia Anônima');
  } else {
    addSection('Identificação', 'Denúncia Identificada');
    if (report.author_name) {
      addSection('Nome', report.author_name);
    }
    if (report.author_contact) {
      addSection('Contato', report.author_contact);
    }
  }

  // Location
  if (report.address_text) {
    addSection('Endereço Aproximado', report.address_text);
  }
  if (report.lat && report.lng) {
    addSection('Coordenadas', `${report.lat.toFixed(6)}, ${report.lng.toFixed(6)}`);
  }

  // Title
  if (report.title) {
    addSection('Título', report.title);
  }

  // Check if we need a new page for description
  if (y > 200) {
    doc.addPage();
    y = margin;
  }

  // Description
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(80, 80, 80);
  doc.text('DESCRIÇÃO', margin, y);
  y += 5;
  
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;
  
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(40, 40, 40);
  doc.setFontSize(11);
  
  const descLines = doc.splitTextToSize(report.description, contentWidth);
  doc.text(descLines, margin, y);
  y += descLines.length * 5 + 10;

  // Evidences
  if (report.evidences && report.evidences.length > 0) {
    if (y > 240) {
      doc.addPage();
      y = margin;
    }
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(80, 80, 80);
    doc.text('EVIDÊNCIAS ANEXADAS', margin, y);
    y += 7;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    
    report.evidences.forEach((evidence, index) => {
      doc.text(`${index + 1}. ${evidence.file_name}`, margin + 5, y);
      y += 5;
    });
    y += 5;
  }

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 15;
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
  
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text(`Gerado pelo aplicativo ${APP_NAME}`, pageWidth / 2, footerY, { align: 'center' });

  return doc;
}

export function downloadPDF(doc: jsPDF, filename: string): void {
  doc.save(filename);
}

export function sharePDF(doc: jsPDF, filename: string): void {
  const blob = doc.output('blob');
  const file = new File([blob], filename, { type: 'application/pdf' });
  
  if (navigator.share && navigator.canShare({ files: [file] })) {
    navigator.share({
      files: [file],
      title: 'Relatório de Denúncia',
    }).catch(console.error);
  } else {
    // Fallback to download
    downloadPDF(doc, filename);
  }
}
