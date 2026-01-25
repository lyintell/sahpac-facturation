export interface Client {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  createdAt: Date;
}

export interface InterventionType {
  id: string;
  name: string;
  description: string;
}

export interface ZoneIntervention {
  id: string;
  name: string;
}

export type InvoiceStatus = 'pending' | 'paid';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: Date;
  clientId: string;
  clientName: string;
  workDescription: string;
  interventionTypeId: string;
  interventionTypeName: string;
  interventionDescription: string;
  zones: ZoneIntervention[];
  frequency: string;
  findings: string;
  observations?: string;
  amountHT: number;
  tvaRate: number;
  tvaAmount: number;
  totalAmount: number;
  isProForma: boolean;
  status: InvoiceStatus;
  paidAt?: Date;
  createdAt: Date;
}

export const INTERVENTION_TYPES: InterventionType[] = [
  {
    id: 'desinsectisation',
    name: 'Désinsectisation',
    description: 'Traitement contre les insectes nuisibles (cafards, moustiques, mouches, punaises, etc.)'
  },
  {
    id: 'deratisation',
    name: 'Dératisation',
    description: 'Cette opération consiste en la pose de Raticide à support multiple (riz pain arachide etc.); pour lutter contre la famille des MURIDEES (Rat toto: RATTUS RATTUS; Rat d\'égout ou Surmulot: RATTUS NORVEGICUS; Souris: MUS MUSCULUS.'
  },
  {
    id: 'serpents',
    name: 'Lutte contre les serpents',
    description: 'Traitement préventif et curatif contre les serpents et reptiles nuisibles.'
  },
  {
    id: 'termites',
    name: 'Lutte contre les termites',
    description: 'Traitement anti-termites pour la protection des structures en bois et des bâtiments.'
  }
];

export const DEFAULT_TVA_RATE = 18;
