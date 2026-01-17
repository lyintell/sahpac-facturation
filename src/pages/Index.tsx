import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import Header from '@/components/Header';
import ClientManager from '@/components/ClientManager';
import InvoiceForm from '@/components/InvoiceForm';
import InvoiceList from '@/components/InvoiceList';
import InvoicePreview from '@/components/InvoicePreview';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Client, Invoice, ZoneIntervention } from '@/types';

const Index = () => {
  const [activeTab, setActiveTab] = useState<'invoices' | 'clients' | 'new'>('invoices');
  const [clients, setClients] = useLocalStorage<Client[]>('sahpac-clients', []);
  const [invoices, setInvoices] = useLocalStorage<Invoice[]>('sahpac-invoices', []);
  const [zones, setZones] = useLocalStorage<ZoneIntervention[]>('sahpac-zones', [
    { id: '1', name: 'Premier local' },
    { id: '2', name: 'Petit magasin' },
    { id: '3', name: 'Entrepôt' },
    { id: '4', name: 'La cour' },
  ]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

  const handleEditInvoice = useCallback((invoice: Invoice) => {
    setEditingInvoice(invoice);
    setActiveTab('new');
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingInvoice(null);
    setActiveTab('invoices');
  }, []);

  const generateInvoiceNumber = useCallback((isProForma: boolean) => {
    const year = new Date().getFullYear();
    const prefix = isProForma ? 'PF' : 'FAC';
    const count = invoices.filter(inv => {
      const invYear = new Date(inv.date).getFullYear();
      const invIsProForma = inv.isProForma !== false;
      return invYear === year && invIsProForma === isProForma;
    }).length + 1;
    return `${prefix}-${year}-${String(count).padStart(4, '0')}`;
  }, [invoices]);

  const handleAddClient = useCallback((clientData: Omit<Client, 'id' | 'createdAt'>) => {
    const newClient: Client = {
      ...clientData,
      id: Date.now().toString(),
      createdAt: new Date(),
    };
    setClients(prev => [...prev, newClient]);
    toast.success(`Client "${clientData.name}" ajouté avec succès`);
  }, [setClients]);

  const handleDeleteClient = useCallback((id: string) => {
    setClients(prev => prev.filter(c => c.id !== id));
    toast.success('Client supprimé');
  }, [setClients]);

  const handleUpdateClient = useCallback((id: string, data: Partial<Client>) => {
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
    toast.success('Client mis à jour');
  }, [setClients]);

  const handleAddZone = useCallback((zone: Omit<ZoneIntervention, 'id'>) => {
    const newZone: ZoneIntervention = {
      ...zone,
      id: Date.now().toString(),
    };
    setZones(prev => [...prev, newZone]);
  }, [setZones]);

  const handleCreateInvoice = useCallback((invoiceData: Omit<Invoice, 'id' | 'createdAt' | 'invoiceNumber'>) => {
    const isProForma = invoiceData.isProForma !== false;
    const newInvoice: Invoice = {
      ...invoiceData,
      id: Date.now().toString(),
      invoiceNumber: generateInvoiceNumber(isProForma),
      createdAt: new Date(),
    };
    setInvoices(prev => [newInvoice, ...prev]);
    toast.success(`${isProForma ? 'Pro Forma' : 'Facture'} ${newInvoice.invoiceNumber} créée avec succès`);
    setActiveTab('invoices');
    setSelectedInvoice(newInvoice);
  }, [generateInvoiceNumber, setInvoices]);

  const handleDeleteInvoice = useCallback((id: string) => {
    setInvoices(prev => prev.filter(inv => inv.id !== id));
    toast.success('Facture supprimée');
  }, [setInvoices]);

  const handleCopyInvoice = useCallback((invoice: Invoice) => {
    const isProForma = invoice.isProForma !== false;
    const newInvoice: Invoice = {
      ...invoice,
      id: Date.now().toString(),
      invoiceNumber: generateInvoiceNumber(isProForma),
      date: new Date(),
      createdAt: new Date(),
    };
    setInvoices(prev => [newInvoice, ...prev]);
    toast.success(`Copie ${newInvoice.invoiceNumber} créée`);
    setSelectedInvoice(newInvoice);
  }, [generateInvoiceNumber, setInvoices]);

  const handleUpdateInvoice = useCallback((id: string, data: Partial<Invoice>) => {
    setInvoices(prev => prev.map(inv => {
      if (inv.id !== id) return inv;
      // If converting from proforma to definitive, generate new number
      if (data.isProForma === false && inv.isProForma !== false) {
        const newNumber = generateInvoiceNumber(false);
        return { ...inv, ...data, invoiceNumber: newNumber };
      }
      return { ...inv, ...data };
    }));
    toast.success('Facture mise à jour');
  }, [setInvoices, generateInvoiceNumber]);

  return (
    <div className="min-h-screen bg-background">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      
      <main className="container mx-auto px-4 py-8">
        {activeTab === 'invoices' && (
          <InvoiceList
            invoices={invoices}
            clients={clients}
            onViewInvoice={setSelectedInvoice}
            onEditInvoice={handleEditInvoice}
            onDeleteInvoice={handleDeleteInvoice}
            onUpdateInvoice={handleUpdateInvoice}
            onCopyInvoice={handleCopyInvoice}
          />
        )}
        
        {activeTab === 'clients' && (
          <ClientManager
            clients={clients}
            onAddClient={handleAddClient}
            onDeleteClient={handleDeleteClient}
            onUpdateClient={handleUpdateClient}
          />
        )}
        
        {activeTab === 'new' && (
          <InvoiceForm
            clients={clients}
            zones={zones}
            editingInvoice={editingInvoice}
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
