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
  evidences?: Array<{ file_name: string; file_url: string; file_type: string; created_at: string }>;
}

// Helper to load image as base64
async function loadImageAsBase64(url: string): Promise<{ data: string; format: string } | null> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        const format = blob.type.includes('png') ? 'PNG' : 'JPEG';
        resolve({ data: base64, format });
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function generateReportPDF(report: ReportData): Promise<jsPDF> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
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

  // Evidences with images
  if (report.evidences && report.evidences.length > 0) {
    // Filter only image evidences
    const imageEvidences = report.evidences.filter(e => 
      e.file_type.startsWith('image/')
    );
    const otherEvidences = report.evidences.filter(e => 
      !e.file_type.startsWith('image/')
    );

    if (imageEvidences.length > 0) {
      // Add new page for images
      doc.addPage();
      y = margin;
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(40, 40, 40);
      doc.text('EVIDÊNCIAS FOTOGRÁFICAS', margin, y);
      y += 10;

      const maxImageWidth = contentWidth;
      const maxImageHeight = 100;

      for (let i = 0; i < imageEvidences.length; i++) {
        const evidence = imageEvidences[i];
        
        // Check if we need a new page
        if (y + maxImageHeight + 20 > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }

        // Load and add image
        const imageData = await loadImageAsBase64(evidence.file_url);
        
        if (imageData) {
          try {
            // Create temporary image to get dimensions
            const img = new Image();
            await new Promise<void>((resolve) => {
              img.onload = () => resolve();
              img.onerror = () => resolve();
              img.src = imageData.data;
            });

            // Calculate dimensions maintaining aspect ratio
            let imgWidth = img.width;
            let imgHeight = img.height;
            
            if (imgWidth > maxImageWidth) {
              const ratio = maxImageWidth / imgWidth;
              imgWidth = maxImageWidth;
              imgHeight = imgHeight * ratio;
            }
            
            if (imgHeight > maxImageHeight) {
              const ratio = maxImageHeight / imgHeight;
              imgHeight = maxImageHeight;
              imgWidth = imgWidth * ratio;
            }

            // Add image
            doc.addImage(imageData.data, imageData.format, margin, y, imgWidth, imgHeight);
            y += imgHeight + 5;
            
            // Add caption
            doc.setFontSize(9);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(100, 100, 100);
            doc.text(`${i + 1}. ${evidence.file_name}`, margin, y);
            y += 15;
          } catch (e) {
            // If image fails, just list the filename
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(60, 60, 60);
            doc.text(`${i + 1}. ${evidence.file_name} (não foi possível carregar)`, margin, y);
            y += 10;
          }
        } else {
          // If image fails to load, just list the filename
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(60, 60, 60);
          doc.text(`${i + 1}. ${evidence.file_name} (não foi possível carregar)`, margin, y);
          y += 10;
        }
      }
    }

    // List other (non-image) evidences
    if (otherEvidences.length > 0) {
      if (y + 40 > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(80, 80, 80);
      doc.text('OUTROS ANEXOS', margin, y);
      y += 7;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      
      otherEvidences.forEach((evidence, index) => {
        doc.text(`${index + 1}. ${evidence.file_name}`, margin + 5, y);
        y += 5;
      });
    }
  }

  // Footer on last page
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
