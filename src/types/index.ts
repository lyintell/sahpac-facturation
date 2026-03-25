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
  standardPrice: number;
}

export interface ZoneIntervention {
  id: string;
  name: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export type InvoiceStatus = 'pending' | 'paid';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  proformaId?: string;
  date: Date;
  clientId: string;
  clientName: string;
  clientAddress?: string;
  workDescription: string;
  interventionTypeId: string;
  interventionTypeName: string;
  interventionDescription: string;
  zones: ZoneIntervention[];
  zoneIds?: string[];
  zoneNames?: string[];
  frequency: string;
  findings: string;
  observations?: string;
  items?: InvoiceItem[];
  subtotal?: number;
  amountHT: number;
  tvaRate: number;
  tvaAmount: number;
  totalAmount: number;
  includeTva?: boolean;
  isProForma: boolean;
  status: InvoiceStatus;
  paidAmount: number;
  paidAt?: Date;
  createdAt: Date;
}

export const DEFAULT_TVA_RATE = 18;
