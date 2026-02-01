// Categories
export const CATEGORIES = {
  SAUDE: { label: 'Saúde Pública', icon: 'Heart', color: 'category-saude' },
  OBRAS: { label: 'Obras & Infraestrutura', icon: 'Construction', color: 'category-obras' },
  EDUCACAO: { label: 'Educação', icon: 'GraduationCap', color: 'category-educacao' },
  SERVICOS_URBANOS: { label: 'Serviços Urbanos', icon: 'Building', color: 'category-servicos' },
  MEIO_AMBIENTE: { label: 'Meio Ambiente', icon: 'TreePine', color: 'category-ambiente' },
  SEGURANCA: { label: 'Segurança', icon: 'Shield', color: 'category-seguranca' },
  CORRUPCAO: { label: 'Corrupção / Gasto Público', icon: 'AlertTriangle', color: 'category-corrupcao' },
} as const;

export type CategoryKey = keyof typeof CATEGORIES;

// Subcategories for each category
export const SUBCATEGORIES: Record<CategoryKey, string[]> = {
  SAUDE: [
    'Conservação do prédio/hospital',
    'Atendimento médico inadequado',
    'Falta de medicamentos',
    'Falta de profissionais de saúde',
    'Demora no atendimento',
    'Equipamentos quebrados/faltando',
    'Segurança no local',
    'Falta de leitos',
    'Ambulâncias/SAMU',
    'UBS/Postos de saúde',
    'Outros',
  ],
  OBRAS: [
    'Buracos nas ruas',
    'Calçadas danificadas',
    'Obras paradas/abandonadas',
    'Falta de sinalização',
    'Pontes/viadutos com problemas',
    'Alagamentos/drenagem',
    'Asfalto danificado',
    'Construção irregular',
    'Outros',
  ],
  EDUCACAO: [
    'Conservação da escola',
    'Falta de professores',
    'Falta de material escolar',
    'Merenda escolar inadequada',
    'Transporte escolar',
    'Segurança na escola',
    'Vagas insuficientes',
    'Infraestrutura precária',
    'Falta de acessibilidade',
    'Outros',
  ],
  SERVICOS_URBANOS: [
    'Coleta de lixo',
    'Iluminação pública',
    'Limpeza de ruas/praças',
    'Manutenção de praças/parques',
    'Transporte público',
    'Poda de árvores',
    'Bueiros/bocas de lobo',
    'Calçamento/pavimentação',
    'Sinalização de trânsito',
    'Outros',
  ],
  MEIO_AMBIENTE: [
    'Desmatamento ilegal',
    'Poluição de rios/córregos',
    'Queimadas',
    'Descarte irregular de lixo',
    'Animais abandonados/maus-tratos',
    'Poluição do ar',
    'Poluição sonora',
    'Ocupação de áreas protegidas',
    'Crimes ambientais',
    'Outros',
  ],
  SEGURANCA: [
    'Falta de policiamento',
    'Áreas de risco',
    'Tráfico de drogas',
    'Violência urbana',
    'Vandalismo',
    'Iluminação precária',
    'Pontos de prostituição',
    'Invasões/ocupações irregulares',
    'Outros',
  ],
  CORRUPCAO: [
    'Desvio de verbas públicas',
    'Licitações irregulares',
    'Nepotismo',
    'Obras superfaturadas',
    'Gastos suspeitos',
    'Funcionário fantasma',
    'Fraude em contratos',
    'Enriquecimento ilícito',
    'Outros',
  ],
};

// Statuses
export const STATUSES = {
  RECEBIDA: { label: 'Recebida', color: 'status-recebida' },
  EM_ANALISE: { label: 'Em Análise', color: 'status-analise' },
  ENCAMINHADA: { label: 'Encaminhada', color: 'status-encaminhada' },
  RESPONDIDA: { label: 'Respondida', color: 'status-respondida' },
  RESOLVIDA: { label: 'Resolvida', color: 'status-resolvida' },
  ARQUIVADA: { label: 'Arquivada', color: 'status-arquivada' },
  SOB_REVISAO: { label: 'Sob Revisão', color: 'status-revisao' },
} as const;

export type StatusKey = keyof typeof STATUSES;

// Agency Scopes
export const AGENCY_SCOPES = {
  MUNICIPAL: 'Municipal',
  ESTADUAL: 'Estadual',
  FEDERAL: 'Federal',
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  SELECTED_UF: 'voz_cidade_uf',
  SELECTED_CITY: 'voz_cidade_city',
  DEVICE_ID: 'voz_cidade_device_id',
  ONBOARDING_COMPLETE: 'voz_cidade_onboarding',
} as const;

// App Info
export const APP_NAME = 'Fiscaliza Brasil';
export const APP_DESCRIPTION = 'Sua voz, sua cidade, seu País';

// Validation
export const VALIDATION = {
  DESCRIPTION_MAX: 1000,
  TITLE_MAX: 80,
  MAX_FILES: 5,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: ['image/*', 'video/*', 'application/pdf'],
} as const;
