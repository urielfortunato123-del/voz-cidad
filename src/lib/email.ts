import { CATEGORIES } from './constants';
import type { CategoryKey } from './constants';

interface EmailData {
  protocol: string;
  uf: string;
  city: string;
  category: CategoryKey;
  description: string;
  address_text?: string;
  lat?: number;
  lng?: number;
  author_name?: string;
  is_anonymous: boolean;
}

export function generateEmailContent(data: EmailData, agencyEmail: string): { subject: string; body: string } {
  const categoryLabel = CATEGORIES[data.category]?.label || data.category;
  
  const subject = `Denúncia cidadã – ${categoryLabel} – ${data.city}/${data.uf} – Protocolo ${data.protocol}`;
  
  const location = data.address_text 
    ? data.address_text 
    : (data.lat && data.lng ? `Coordenadas: ${data.lat.toFixed(6)}, ${data.lng.toFixed(6)}` : 'Não informado');
  
  const descriptionPreview = data.description.length > 400 
    ? data.description.substring(0, 400) + '...' 
    : data.description;
  
  const authorSignature = data.is_anonymous 
    ? 'Cidadão (Anônimo)' 
    : (data.author_name || 'Cidadão');
  
  const body = `Prezados,

Encaminho denúncia cidadã para apuração.

Protocolo: ${data.protocol}
Local: ${data.city}/${data.uf} – ${location}
Categoria: ${categoryLabel}

Resumo:
${descriptionPreview}

Segue em anexo o relatório PDF completo e evidências, quando houver.

Solicito protocolo de recebimento/encaminhamento.

Atenciosamente,
${authorSignature}

---
Denúncia registrada pelo aplicativo Fiscaliza Brasil`;

  return { subject, body };
}

export function openMailto(email: string, subject: string, body: string): void {
  const encodedSubject = encodeURIComponent(subject);
  const encodedBody = encodeURIComponent(body);
  const mailtoUrl = `mailto:${email}?subject=${encodedSubject}&body=${encodedBody}`;
  
  window.location.href = mailtoUrl;
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}
