import { useState, useCallback } from 'react';
import Header from '@/components/Header';
import ClientManager from '@/components/ClientManager';
import InvoiceForm from '@/components/InvoiceForm';
import InvoiceList from '@/components/InvoiceList';
import InvoicePreview from '@/components/InvoicePreview';
import { useClients } from '@/hooks/useClients';
import { useInvoices } from '@/hooks/useInvoices';
import { useZones } from '@/hooks/useZones';
import { Invoice, ZoneIntervention, Client } from '@/types';

const Index = () => {
  const [activeTab, setActiveTab] = useState<'invoices' | 'clients' | 'new'>('invoices');
  const { clients, loading: clientsLoading, addClient, updateClient, deleteClient } = useClients();
  const { invoices, loading: invoicesLoading, createInvoice, updateInvoice, deleteInvoice, copyInvoice } = useInvoices();
  const { zones, loading: zonesLoading, addZone } = useZones();
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [preselectedClientId, setPreselectedClientId] = useState<string | null>(null);

  const handleEditInvoice = useCallback((invoice: Invoice) => {
    setEditingInvoice(invoice);
    setActiveTab('new');
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingInvoice(null);
    setPreselectedClientId(null);
    setActiveTab('invoices');
  }, []);

  const handleCreateInvoiceForClient = useCallback((clientId: string) => {
    setPreselectedClientId(clientId);
    setEditingInvoice(null);
    setActiveTab('new');
  }, []);

  const handleAddClient = useCallback(async (clientData: Omit<Client, 'id' | 'createdAt'>) => {
    await addClient(clientData);
  }, [addClient]);

  const handleDeleteClient = useCallback(async (id: string) => {
    await deleteClient(id);
  }, [deleteClient]);

  const handleUpdateClient = useCallback(async (id: string, data: Partial<Client>) => {
    await updateClient(id, data);
  }, [updateClient]);

  const handleAddZone = useCallback(async (zone: Omit<ZoneIntervention, 'id'>) => {
    await addZone(zone);
  }, [addZone]);

  const handleCreateInvoice = useCallback(async (invoiceData: Omit<Invoice, 'id' | 'createdAt' | 'invoiceNumber'>) => {
    const newInvoice = await createInvoice(invoiceData);
    if (newInvoice) {
      setActiveTab('invoices');
      setSelectedInvoice(newInvoice);
    }
  }, [createInvoice]);

  const handleDeleteInvoice = useCallback(async (id: string) => {
    await deleteInvoice(id);
  }, [deleteInvoice]);

  const handleCopyInvoice = useCallback(async (invoice: Invoice) => {
    const newInvoice = await copyInvoice(invoice);
    if (newInvoice) {
      setSelectedInvoice(newInvoice);
    }
  }, [copyInvoice]);

  const handleUpdateInvoice = useCallback(async (id: string, data: Partial<Invoice>) => {
    await updateInvoice(id, data);
  }, [updateInvoice]);

  // Map zones to the expected format
  const zonesData: ZoneIntervention[] = zones.map(z => ({ id: z.id, name: z.name }));
  
  // Map clients to the expected format with createdAt
  const clientsData: Client[] = clients.map(c => ({
    id: c.id,
    name: c.name,
    address: c.address,
    phone: c.phone,
    email: c.email,
    createdAt: c.created_at ? new Date(c.created_at) : new Date(),
  }));

  const isLoading = clientsLoading || invoicesLoading || zonesLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background print-scope">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      
      <main className="container mx-auto px-4 py-8">
        {activeTab === 'invoices' && (
          <InvoiceList
            invoices={invoices}
            clients={clientsData}
            onViewInvoice={setSelectedInvoice}
            onEditInvoice={handleEditInvoice}
            onDeleteInvoice={handleDeleteInvoice}
            onUpdateInvoice={handleUpdateInvoice}
            onCopyInvoice={handleCopyInvoice}
          />
        )}
        
        {activeTab === 'clients' && (
          <ClientManager
            clients={clientsData}
            invoices={invoices}
            onAddClient={handleAddClient}
            onDeleteClient={handleDeleteClient}
            onUpdateClient={handleUpdateClient}
            onViewInvoice={setSelectedInvoice}
            onCreateInvoiceForClient={handleCreateInvoiceForClient}
          />
        )}
        
        {activeTab === 'new' && (
          <InvoiceForm
            clients={clientsData}
            zones={zonesData}
            editingInvoice={editingInvoice}
            preselectedClientId={preselectedClientId}
            onAddClient={handleAddClient}
            onAddZone={handleAddZone}
            onCreateInvoice={handleCreateInvoice}
            onUpdateInvoice={handleUpdateInvoice}
            onCancelEdit={handleCancelEdit}
          />
        )}
      </main>

      {selectedInvoice && (
        <InvoicePreview
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      )}
    </div>
  );
};

export default Index;
