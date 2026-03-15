import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Invoice, InvoiceItem, ZoneIntervention } from '@/types';
import { TablesInsert } from '@/integrations/supabase/types';

type DbInvoiceRow = {
  id: string;
  user_id: string;
  invoice_number: string;
  client_id: string;
  client_name: string;
  client_address: string | null;
  date: string;
  intervention_type_id: string;
  intervention_type_name: string;
  work_description: string | null;
  intervention_description: string | null;
  frequency: string | null;
  findings: string | null;
  zone_ids: string[] | null;
  zone_names: string[] | null;
  items: unknown;
  subtotal: number;
  tva_rate: number;
  tva_amount: number;
  total_amount: number;
  include_tva: boolean;
  observations: string | null;
  is_pro_forma: boolean;
  paid_amount: number;
  status: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
};

const mapDbToInvoice = (db: DbInvoiceRow): Invoice => {
  const zones: ZoneIntervention[] = (db.zone_ids || []).map((id, i) => ({
    id,
    name: db.zone_names?.[i] || '',
  }));
  
  return {
    id: db.id,
    invoiceNumber: db.invoice_number,
    clientId: db.client_id,
    clientName: db.client_name,
    clientAddress: db.client_address || undefined,
    date: new Date(db.date),
    interventionTypeId: db.intervention_type_id,
    interventionTypeName: db.intervention_type_name,
    interventionDescription: db.intervention_description || '',
    workDescription: db.work_description || '',
    frequency: db.frequency || '',
    findings: db.findings || '',
    zones,
    zoneIds: db.zone_ids || [],
    zoneNames: db.zone_names || [],
    items: db.items as InvoiceItem[],
    subtotal: Number(db.subtotal),
    amountHT: Number(db.subtotal),
    tvaRate: Number(db.tva_rate),
    tvaAmount: Number(db.tva_amount),
    totalAmount: Number(db.total_amount),
    includeTva: db.include_tva,
    observations: db.observations || undefined,
    isProForma: db.is_pro_forma,
    status: (db.status as 'pending' | 'paid') || 'pending',
    paidAmount: Number(db.paid_amount) || 0,
    paidAt: db.paid_at ? new Date(db.paid_at) : undefined,
    createdAt: new Date(db.created_at),
  };
};

export const useInvoices = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchInvoices = useCallback(async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching invoices:', error);
      toast.error('Erreur lors du chargement des factures');
    } else {
      setInvoices((data || []).map(d => mapDbToInvoice(d as DbInvoiceRow)));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const generateInvoiceNumber = useCallback(async (isProForma: boolean) => {
    const year = new Date().getFullYear();
    const shortYear = String(year).slice(-2);
    
    // Count existing invoices of this type for the year
    const { count } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('is_pro_forma', isProForma)
      .gte('date', `${year}-01-01`)
      .lte('date', `${year}-12-31`);
    
    const nextNum = (count || 0) + 1;
    return `${String(nextNum).padStart(3, '0')} / ${shortYear}`;
  }, []);

  const createInvoice = useCallback(async (invoiceData: Omit<Invoice, 'id' | 'createdAt' | 'invoiceNumber'>) => {
    if (!user) return null;
    
    const isProForma = invoiceData.isProForma !== false;
    const invoiceNumber = await generateInvoiceNumber(isProForma);
    
    const zoneIds = invoiceData.zoneIds || invoiceData.zones?.map(z => z.id) || [];
    const zoneNames = invoiceData.zoneNames || invoiceData.zones?.map(z => z.name) || [];
    
    const dbData: TablesInsert<'invoices'> & { work_description?: string | null; intervention_description?: string | null; frequency?: string | null; findings?: string | null } = {
      user_id: user.id,
      invoice_number: invoiceNumber,
      client_id: invoiceData.clientId,
      client_name: invoiceData.clientName,
      client_address: invoiceData.clientAddress || null,
      date: invoiceData.date instanceof Date ? invoiceData.date.toISOString() : String(invoiceData.date),
      intervention_type_id: invoiceData.interventionTypeId,
      intervention_type_name: invoiceData.interventionTypeName,
      work_description: invoiceData.workDescription || null,
      intervention_description: invoiceData.interventionDescription || null,
      frequency: invoiceData.frequency || null,
      findings: invoiceData.findings || null,
      zone_ids: zoneIds,
      zone_names: zoneNames,
      items: (invoiceData.items || []) as unknown as TablesInsert<'invoices'>['items'],
      subtotal: invoiceData.subtotal || invoiceData.amountHT || 0,
      tva_rate: invoiceData.tvaRate,
      tva_amount: invoiceData.tvaAmount,
      total_amount: invoiceData.totalAmount,
      include_tva: invoiceData.includeTva !== false,
      observations: invoiceData.observations || null,
      is_pro_forma: isProForma,
      status: invoiceData.status || 'pending',
      paid_at: invoiceData.paidAt ? (invoiceData.paidAt instanceof Date ? invoiceData.paidAt.toISOString() : String(invoiceData.paidAt)) : null,
    };
    
    const { data, error } = await supabase
      .from('invoices')
      .insert(dbData)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating invoice:', error);
      toast.error('Erreur lors de la création de la facture');
      return null;
    }
    
    const newInvoice = mapDbToInvoice(data as DbInvoiceRow);
    setInvoices(prev => [newInvoice, ...prev]);
    toast.success(`${isProForma ? 'Pro Forma' : 'Facture'} ${invoiceNumber} créée avec succès`);
    return newInvoice;
  }, [user, generateInvoiceNumber]);

  const updateInvoice = useCallback(async (id: string, invoiceData: Partial<Invoice>) => {
    // If converting from pro forma to definitive, generate new number
    let newInvoiceNumber: string | undefined;
    if (invoiceData.isProForma === false) {
      const existing = invoices.find(inv => inv.id === id);
      if (existing?.isProForma !== false) {
        newInvoiceNumber = await generateInvoiceNumber(false);
      }
    }
    
    const dbData: Record<string, unknown> = {};
    if (invoiceData.clientId !== undefined) dbData.client_id = invoiceData.clientId;
    if (invoiceData.clientName !== undefined) dbData.client_name = invoiceData.clientName;
    if (invoiceData.clientAddress !== undefined) dbData.client_address = invoiceData.clientAddress;
    if (invoiceData.date !== undefined) dbData.date = invoiceData.date instanceof Date ? invoiceData.date.toISOString() : invoiceData.date;
    if (invoiceData.interventionTypeId !== undefined) dbData.intervention_type_id = invoiceData.interventionTypeId;
    if (invoiceData.interventionTypeName !== undefined) dbData.intervention_type_name = invoiceData.interventionTypeName;
    if (invoiceData.workDescription !== undefined) dbData.work_description = invoiceData.workDescription;
    if (invoiceData.interventionDescription !== undefined) dbData.intervention_description = invoiceData.interventionDescription;
    if (invoiceData.frequency !== undefined) dbData.frequency = invoiceData.frequency;
    if (invoiceData.findings !== undefined) dbData.findings = invoiceData.findings;
    if (invoiceData.zoneIds !== undefined) dbData.zone_ids = invoiceData.zoneIds;
    if (invoiceData.zoneNames !== undefined) dbData.zone_names = invoiceData.zoneNames;
    if (invoiceData.zones !== undefined) {
      dbData.zone_ids = invoiceData.zones.map(z => z.id);
      dbData.zone_names = invoiceData.zones.map(z => z.name);
    }
    if (invoiceData.items !== undefined) dbData.items = invoiceData.items;
    if (invoiceData.subtotal !== undefined) dbData.subtotal = invoiceData.subtotal;
    if (invoiceData.amountHT !== undefined) dbData.subtotal = invoiceData.amountHT;
    if (invoiceData.tvaRate !== undefined) dbData.tva_rate = invoiceData.tvaRate;
    if (invoiceData.tvaAmount !== undefined) dbData.tva_amount = invoiceData.tvaAmount;
    if (invoiceData.totalAmount !== undefined) dbData.total_amount = invoiceData.totalAmount;
    if (invoiceData.includeTva !== undefined) dbData.include_tva = invoiceData.includeTva;
    if (invoiceData.observations !== undefined) dbData.observations = invoiceData.observations;
    if (invoiceData.isProForma !== undefined) dbData.is_pro_forma = invoiceData.isProForma;
    if (invoiceData.status !== undefined) dbData.status = invoiceData.status;
    if (invoiceData.paidAmount !== undefined) dbData.paid_amount = invoiceData.paidAmount;
    if (invoiceData.paidAt !== undefined) dbData.paid_at = invoiceData.paidAt instanceof Date ? invoiceData.paidAt.toISOString() : invoiceData.paidAt;
    if (newInvoiceNumber) dbData.invoice_number = newInvoiceNumber;
    
    const { error } = await supabase
      .from('invoices')
      .update(dbData)
      .eq('id', id);
    
    if (error) {
      console.error('Error updating invoice:', error);
      toast.error('Erreur lors de la mise à jour de la facture');
      return;
    }
    
    setInvoices(prev => prev.map(inv => {
      if (inv.id !== id) return inv;
      return {
        ...inv,
        ...invoiceData,
        ...(newInvoiceNumber ? { invoiceNumber: newInvoiceNumber } : {}),
      };
    }));
    toast.success('Facture mise à jour');
  }, [invoices, generateInvoiceNumber]);

  const deleteInvoice = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting invoice:', error);
      toast.error('Erreur lors de la suppression de la facture');
      return;
    }
    
    setInvoices(prev => prev.filter(inv => inv.id !== id));
    toast.success('Facture supprimée');
  }, []);

  const copyInvoice = useCallback(async (invoice: Invoice) => {
    const isProForma = invoice.isProForma !== false;
    const invoiceNumber = await generateInvoiceNumber(isProForma);
    
    if (!user) return null;
    
    const zoneIds = invoice.zoneIds || invoice.zones?.map(z => z.id) || [];
    const zoneNames = invoice.zoneNames || invoice.zones?.map(z => z.name) || [];
    
    const dbData: TablesInsert<'invoices'> & { work_description?: string | null; intervention_description?: string | null; frequency?: string | null; findings?: string | null } = {
      user_id: user.id,
      invoice_number: invoiceNumber,
      client_id: invoice.clientId,
      client_name: invoice.clientName,
      client_address: invoice.clientAddress || null,
      date: new Date().toISOString(),
      intervention_type_id: invoice.interventionTypeId,
      intervention_type_name: invoice.interventionTypeName,
      work_description: invoice.workDescription || null,
      intervention_description: invoice.interventionDescription || null,
      frequency: invoice.frequency || null,
      findings: invoice.findings || null,
      zone_ids: zoneIds,
      zone_names: zoneNames,
      items: (invoice.items || []) as unknown as TablesInsert<'invoices'>['items'],
      subtotal: invoice.subtotal || invoice.amountHT || 0,
      tva_rate: invoice.tvaRate,
      tva_amount: invoice.tvaAmount,
      total_amount: invoice.totalAmount,
      include_tva: invoice.includeTva !== false,
      observations: invoice.observations || null,
      is_pro_forma: isProForma,
      status: 'pending',
      paid_at: null,
    };
    
    const { data, error } = await supabase
      .from('invoices')
      .insert(dbData)
      .select()
      .single();
    
    if (error) {
      console.error('Error copying invoice:', error);
      toast.error('Erreur lors de la copie de la facture');
      return null;
    }
    
    const newInvoice = mapDbToInvoice(data as DbInvoiceRow);
    setInvoices(prev => [newInvoice, ...prev]);
    toast.success(`Copie ${invoiceNumber} créée`);
    return newInvoice;
  }, [user, generateInvoiceNumber]);

  return { invoices, loading, createInvoice, updateInvoice, deleteInvoice, copyInvoice, refetch: fetchInvoices };
};
