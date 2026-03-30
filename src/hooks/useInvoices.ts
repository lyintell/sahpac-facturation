import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { DEFAULT_TVA_RATE, Invoice, InvoiceIntervention, InvoiceItem, ZoneIntervention } from '@/types';
import { TablesInsert } from '@/integrations/supabase/types';

type SerializedInterventionsPayload = {
  version: 1;
  interventions: InvoiceIntervention[];
  separateTotalsByInterventionType?: boolean;
};

type DbInvoiceRow = {
  id: string;
  user_id: string;
  invoice_number: string;
  proforma_id: string | null;
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

const serializeInterventions = (
  interventions: InvoiceIntervention[],
  separateTotalsByInterventionType = false
) => {
  const payload: SerializedInterventionsPayload = {
    version: 1,
    interventions,
    separateTotalsByInterventionType,
  };

  return JSON.stringify(payload);
};

const getInterventionSummary = (interventions: InvoiceIntervention[], fallback = '') => {
  if (interventions.length === 0) {
    return fallback;
  }

  return interventions.map((intervention) => intervention.name).join(' + ');
};

const getInterventionDescriptionSummary = (interventions: InvoiceIntervention[], fallback = '') => {
  if (interventions.length === 0) {
    return fallback;
  }

  if (interventions.length === 1) {
    return interventions[0].description;
  }

  return interventions
    .map((intervention) => `${intervention.name}: ${intervention.description}`)
    .join('\n');
};

const parseInterventions = (db: DbInvoiceRow) => {
  if (db.intervention_description) {
    try {
      const payload = JSON.parse(db.intervention_description) as Partial<SerializedInterventionsPayload>;

      if (Array.isArray(payload.interventions)) {
        return {
          interventions: payload.interventions
            .filter((intervention) => intervention && typeof intervention.id === 'string')
            .map((intervention) => ({
              id: intervention.id,
              name: intervention.name || db.intervention_type_name,
              description: intervention.description || '',
              standardPrice: Number(intervention.standardPrice) || 0,
              amountHT: intervention.amountHT !== undefined ? Number(intervention.amountHT) || 0 : undefined,
            })),
          separateTotalsByInterventionType: payload.separateTotalsByInterventionType === true,
        };
      }
    } catch {
      // Older invoices store plain text descriptions, which are handled below.
    }
  }

  if (!db.intervention_type_id && !db.intervention_type_name && !db.intervention_description) {
    return {
      interventions: [],
      separateTotalsByInterventionType: false,
    };
  }

  return {
    interventions: [
      {
        id: db.intervention_type_id,
        name: db.intervention_type_name,
        description: db.intervention_description || '',
        standardPrice: Number(db.subtotal) || 0,
      },
    ],
    separateTotalsByInterventionType: false,
  };
};

const normalizeInterventions = (
  invoiceData: Partial<Invoice> | Omit<Invoice, 'id' | 'createdAt' | 'invoiceNumber'>
) => {
  if (invoiceData.interventions && invoiceData.interventions.length > 0) {
    return invoiceData.interventions.map((intervention) => ({
      id: intervention.id,
      name: intervention.name,
      description: intervention.description,
      standardPrice: Number(intervention.standardPrice) || 0,
      amountHT: intervention.amountHT !== undefined ? Number(intervention.amountHT) || 0 : undefined,
    }));
  }

  if (!invoiceData.interventionTypeId && !invoiceData.interventionTypeName && !invoiceData.interventionDescription) {
    return [];
  }

  return [
    {
      id: invoiceData.interventionTypeId || '',
      name: invoiceData.interventionTypeName || '',
      description: invoiceData.interventionDescription || '',
      standardPrice: Number(invoiceData.amountHT ?? invoiceData.subtotal) || 0,
      amountHT: invoiceData.amountHT !== undefined ? Number(invoiceData.amountHT) || 0 : undefined,
    },
  ];
};

const mapDbToInvoice = (db: DbInvoiceRow): Invoice => {
  const zones: ZoneIntervention[] = (db.zone_ids || []).map((id, i) => ({
    id,
    name: db.zone_names?.[i] || '',
  }));
  const { interventions, separateTotalsByInterventionType } = parseInterventions(db);
  const primaryIntervention = interventions[0];
  
  return {
    id: db.id,
    invoiceNumber: db.invoice_number,
    proformaId: db.proforma_id || undefined,
    clientId: db.client_id,
    clientName: db.client_name,
    clientAddress: db.client_address || undefined,
    date: new Date(db.date),
    interventionTypeId: primaryIntervention?.id || db.intervention_type_id,
    interventionTypeName: getInterventionSummary(interventions, db.intervention_type_name),
    interventionDescription: getInterventionDescriptionSummary(interventions, db.intervention_description || ''),
    interventions,
    separateTotalsByInterventionType,
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
    const interventions = normalizeInterventions(invoiceData);
    
    const zoneIds = invoiceData.zoneIds || invoiceData.zones?.map(z => z.id) || [];
    const zoneNames = invoiceData.zoneNames || invoiceData.zones?.map(z => z.name) || [];
    
    const dbData: TablesInsert<'invoices'> & { work_description?: string | null; intervention_description?: string | null; frequency?: string | null; findings?: string | null } = {
      user_id: user.id,
      invoice_number: invoiceNumber,
      client_id: invoiceData.clientId,
      client_name: invoiceData.clientName,
      client_address: invoiceData.clientAddress || null,
      date: invoiceData.date instanceof Date ? invoiceData.date.toISOString() : String(invoiceData.date),
      intervention_type_id: interventions[0]?.id || invoiceData.interventionTypeId,
      intervention_type_name: getInterventionSummary(interventions, invoiceData.interventionTypeName),
      work_description: invoiceData.workDescription || null,
      intervention_description: interventions.length > 0
        ? serializeInterventions(interventions, invoiceData.separateTotalsByInterventionType === true)
        : invoiceData.interventionDescription || null,
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
      proforma_id: invoiceData.proformaId || null,
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
    const dbData: Record<string, unknown> = {};
    const interventions = invoiceData.interventions !== undefined ? normalizeInterventions(invoiceData) : [];
    if (invoiceData.clientId !== undefined) dbData.client_id = invoiceData.clientId;
    if (invoiceData.clientName !== undefined) dbData.client_name = invoiceData.clientName;
    if (invoiceData.clientAddress !== undefined) dbData.client_address = invoiceData.clientAddress;
    if (invoiceData.date !== undefined) dbData.date = invoiceData.date instanceof Date ? invoiceData.date.toISOString() : invoiceData.date;
    if (invoiceData.interventionTypeId !== undefined) dbData.intervention_type_id = invoiceData.interventionTypeId;
    if (invoiceData.interventionTypeName !== undefined) dbData.intervention_type_name = invoiceData.interventionTypeName;
    if (invoiceData.workDescription !== undefined) dbData.work_description = invoiceData.workDescription;
    if (invoiceData.interventionDescription !== undefined) dbData.intervention_description = invoiceData.interventionDescription;
    if (invoiceData.interventions !== undefined) {
      dbData.intervention_type_id = interventions[0]?.id || '';
      dbData.intervention_type_name = getInterventionSummary(interventions);
      dbData.intervention_description = interventions.length > 0
        ? serializeInterventions(interventions, invoiceData.separateTotalsByInterventionType === true)
        : null;
    }
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
    if (invoiceData.proformaId !== undefined) dbData.proforma_id = invoiceData.proformaId;
    if (invoiceData.status !== undefined) dbData.status = invoiceData.status;
    if (invoiceData.paidAmount !== undefined) dbData.paid_amount = invoiceData.paidAmount;
    if (invoiceData.paidAt !== undefined) dbData.paid_at = invoiceData.paidAt instanceof Date ? invoiceData.paidAt.toISOString() : invoiceData.paidAt;
    
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

      if (invoiceData.interventions !== undefined) {
        return {
          ...inv,
          ...invoiceData,
          interventions,
          separateTotalsByInterventionType: invoiceData.separateTotalsByInterventionType ?? inv.separateTotalsByInterventionType,
          interventionTypeId: interventions[0]?.id || '',
          interventionTypeName: getInterventionSummary(interventions),
          interventionDescription: getInterventionDescriptionSummary(interventions),
        };
      }

      return {
        ...inv,
        ...invoiceData,
      };
    }));
    toast.success('Facture mise à jour');
  }, [invoices]);

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
    
    const interventions = normalizeInterventions(invoice);
    
    const zoneIds = invoice.zoneIds || invoice.zones?.map(z => z.id) || [];
    const zoneNames = invoice.zoneNames || invoice.zones?.map(z => z.name) || [];
    
    const dbData: TablesInsert<'invoices'> & { work_description?: string | null; intervention_description?: string | null; frequency?: string | null; findings?: string | null } = {
      user_id: user.id,
      invoice_number: invoiceNumber,
      client_id: invoice.clientId,
      client_name: invoice.clientName,
      client_address: invoice.clientAddress || null,
      date: new Date().toISOString(),
      intervention_type_id: interventions[0]?.id || invoice.interventionTypeId,
      intervention_type_name: getInterventionSummary(interventions, invoice.interventionTypeName),
      work_description: invoice.workDescription || null,
      intervention_description: interventions.length > 0
        ? serializeInterventions(interventions, invoice.separateTotalsByInterventionType === true)
        : invoice.interventionDescription || null,
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

  const convertProformaToDefinitive = useCallback(async (proforma: Invoice, includeTva = true) => {
    if (!user) return null;
    if (proforma.isProForma === false) return proforma;

    const definitiveNumber = await generateInvoiceNumber(false);
    const interventions = normalizeInterventions(proforma);
    const subtotal = proforma.subtotal || proforma.amountHT || 0;
    const tvaRate = includeTva ? DEFAULT_TVA_RATE : 0;
    const tvaAmount = includeTva ? subtotal * (tvaRate / 100) : 0;
    const totalAmount = subtotal + tvaAmount;

    const zoneIds = proforma.zoneIds || proforma.zones?.map(z => z.id) || [];
    const zoneNames = proforma.zoneNames || proforma.zones?.map(z => z.name) || [];

    const dbData: TablesInsert<'invoices'> & { work_description?: string | null; intervention_description?: string | null; frequency?: string | null; findings?: string | null } = {
      user_id: user.id,
      invoice_number: definitiveNumber,
      proforma_id: proforma.id,
      client_id: proforma.clientId,
      client_name: proforma.clientName,
      client_address: proforma.clientAddress || null,
      date: new Date().toISOString(),
      intervention_type_id: interventions[0]?.id || proforma.interventionTypeId,
      intervention_type_name: getInterventionSummary(interventions, proforma.interventionTypeName),
      work_description: proforma.workDescription || null,
      intervention_description: interventions.length > 0
        ? serializeInterventions(interventions, proforma.separateTotalsByInterventionType === true)
        : proforma.interventionDescription || null,
      frequency: proforma.frequency || null,
      findings: proforma.findings || null,
      zone_ids: zoneIds,
      zone_names: zoneNames,
      items: (proforma.items || []) as unknown as TablesInsert<'invoices'>['items'],
      subtotal,
      tva_rate: tvaRate,
      tva_amount: tvaAmount,
      total_amount: totalAmount,
      include_tva: includeTva,
      observations: proforma.observations || null,
      is_pro_forma: false,
      status: 'pending',
      paid_amount: 0,
      paid_at: null,
    };

    const { data, error } = await supabase
      .from('invoices')
      .insert(dbData)
      .select()
      .single();

    if (error) {
      console.error('Error converting invoice:', error);
      toast.error('Erreur lors de la conversion en définitive');
      return null;
    }

    const newInvoice = mapDbToInvoice(data as DbInvoiceRow);
    setInvoices(prev => [newInvoice, ...prev]);
    toast.success(`Facture définitive ${definitiveNumber} créée`);
    return newInvoice;
  }, [user, generateInvoiceNumber]);

  return { invoices, loading, createInvoice, updateInvoice, deleteInvoice, copyInvoice, convertProformaToDefinitive, refetch: fetchInvoices };
};
