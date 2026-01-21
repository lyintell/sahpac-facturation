import { useState, useMemo } from 'react';
import { Plus, Trash2, Edit2, Save, X, Search, FileText, FilePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Client, Invoice } from '@/types';

interface ClientManagerProps {
  clients: Client[];
  invoices: Invoice[];
  onAddClient: (client: Omit<Client, 'id' | 'createdAt'>) => void;
  onDeleteClient: (id: string) => void;
  onUpdateClient: (id: string, client: Partial<Client>) => void;
  onViewInvoice: (invoice: Invoice) => void;
  onCreateInvoiceForClient?: (clientId: string) => void;
}

const ClientManager = ({ clients, invoices, onAddClient, onDeleteClient, onUpdateClient, onViewInvoice, onCreateInvoiceForClient }: ClientManagerProps) => {
  const [newClientName, setNewClientName] = useState('');
  const [newClientAddress, setNewClientAddress] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [deleteClient, setDeleteClient] = useState<Client | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClientForInvoices, setSelectedClientForInvoices] = useState<Client | null>(null);
  const [invoiceTypeFilter, setInvoiceTypeFilter] = useState<'all' | 'proforma' | 'definitive'>('all');

  const clientInvoices = useMemo(() => {
    if (!selectedClientForInvoices) return [];
    let filtered = invoices.filter(inv => inv.clientId === selectedClientForInvoices.id);
    
    if (invoiceTypeFilter === 'proforma') {
      filtered = filtered.filter(inv => inv.isProForma !== false);
    } else if (invoiceTypeFilter === 'definitive') {
      filtered = filtered.filter(inv => inv.isProForma === false);
    }
    
    return filtered;
  }, [invoices, selectedClientForInvoices, invoiceTypeFilter]);

  const getClientInvoiceCount = (clientId: string) => {
    return invoices.filter(inv => inv.clientId === clientId).length;
  };

  const filteredClients = useMemo(() => {
    if (!searchQuery.trim()) return clients;
    const query = searchQuery.toLowerCase();
    return clients.filter(client => 
      client.name.toLowerCase().includes(query) ||
      (client.phone && client.phone.toLowerCase().includes(query))
    );
  }, [clients, searchQuery]);

  const handleAddClient = () => {
    if (newClientName.trim()) {
      onAddClient({
        name: newClientName.trim(),
        address: newClientAddress.trim() || undefined,
        phone: newClientPhone.trim() || undefined,
      });
      setNewClientName('');
      setNewClientAddress('');
      setNewClientPhone('');
    }
  };

  const startEdit = (client: Client) => {
    setEditingId(client.id);
    setEditName(client.name);
    setEditAddress(client.address || '');
    setEditPhone(client.phone || '');
  };

  const saveEdit = () => {
    if (editingId && editName.trim()) {
      onUpdateClient(editingId, {
        name: editName.trim(),
        address: editAddress.trim() || undefined,
        phone: editPhone.trim() || undefined,
      });
      setEditingId(null);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleConfirmDelete = () => {
    if (deleteClient) {
      onDeleteClient(deleteClient.id);
      setDeleteClient(null);
    }
  };

  return (
    <>
      <div className="space-y-6 animate-fade-in">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Ajouter un Client
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <Input
                placeholder="Nom du client"
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                className="flex-1"
              />
              <Input
                placeholder="Adresse (optionnel)"
                value={newClientAddress}
                onChange={(e) => setNewClientAddress(e.target.value)}
                className="flex-1"
              />
              <Input
                placeholder="Téléphone (optionnel)"
                value={newClientPhone}
                onChange={(e) => setNewClientPhone(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleAddClient} disabled={!newClientName.trim()}>
                <Plus className="w-4 h-4 mr-2" />
                Ajouter
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Liste des Clients ({clients.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom ou téléphone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            {filteredClients.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                {clients.length === 0 
                  ? "Aucun client enregistré. Ajoutez votre premier client ci-dessus."
                  : "Aucun client trouvé pour cette recherche."}
              </p>
            ) : (
              <div className="space-y-2">
                {filteredClients.map((client) => (
                  <div
                    key={client.id}
                    className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors"
                  >
                    {editingId === client.id ? (
                      <div className="flex-1 flex flex-col md:flex-row gap-2 mr-4">
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder="Nom"
                          className="flex-1"
                        />
                        <Input
                          value={editAddress}
                          onChange={(e) => setEditAddress(e.target.value)}
                          placeholder="Adresse"
                          className="flex-1"
                        />
                        <Input
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                          placeholder="Téléphone"
                          className="flex-1"
                        />
                      </div>
                    ) : (
                      <div className="flex-1">
                        <p className="font-medium">{client.name}</p>
                        {client.address && (
                          <p className="text-sm text-muted-foreground">{client.address}</p>
                        )}
                        {client.phone && (
                          <p className="text-sm text-muted-foreground">Tél: {client.phone}</p>
                        )}
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      {editingId === client.id ? (
                        <>
                          <Button size="sm" variant="ghost" onClick={saveEdit}>
                            <Save className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={cancelEdit}>
                            <X className="w-4 h-4" />
                          </Button>
                        </>
                      ) : (
                      <>
                          {onCreateInvoiceForClient && (
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => onCreateInvoiceForClient(client.id)}
                              className="text-success hover:text-success/80"
                              title="Créer une facture"
                            >
                              <FilePlus className="w-4 h-4" />
                            </Button>
                          )}
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => setSelectedClientForInvoices(client)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <FileText className="w-4 h-4" />
                            <span className="ml-1 text-xs">({getClientInvoiceCount(client.id)})</span>
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => startEdit(client)}>
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeleteClient(client)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={!!deleteClient} onOpenChange={(open) => !open && setDeleteClient(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le client <strong>{deleteClient?.name}</strong> ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Sheet open={!!selectedClientForInvoices} onOpenChange={(open) => !open && setSelectedClientForInvoices(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Factures - {selectedClientForInvoices?.name}</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-3">
            {onCreateInvoiceForClient && selectedClientForInvoices && (
              <Button 
                onClick={() => {
                  onCreateInvoiceForClient(selectedClientForInvoices.id);
                  setSelectedClientForInvoices(null);
                }}
                className="w-full"
              >
                <FilePlus className="w-4 h-4 mr-2" />
                Nouvelle facture pour ce client
              </Button>
            )}
            
            <div className="flex gap-2">
              <Badge
                variant={invoiceTypeFilter === 'proforma' ? 'default' : 'outline'}
                className={`cursor-pointer ${invoiceTypeFilter === 'proforma' ? 'bg-gray-700 hover:bg-gray-600' : 'hover:bg-secondary'}`}
                onClick={() => setInvoiceTypeFilter(invoiceTypeFilter === 'proforma' ? 'all' : 'proforma')}
              >
                Pro Forma
              </Badge>
              <Badge
                variant={invoiceTypeFilter === 'definitive' ? 'default' : 'outline'}
                className={`cursor-pointer ${invoiceTypeFilter === 'definitive' ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : 'hover:bg-secondary'}`}
                onClick={() => setInvoiceTypeFilter(invoiceTypeFilter === 'definitive' ? 'all' : 'definitive')}
              >
                Definitive
              </Badge>
            </div>
            
            {clientInvoices.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                {invoiceTypeFilter === 'all' 
                  ? "Aucune facture pour ce client."
                  : `Aucune facture ${invoiceTypeFilter === 'proforma' ? 'Pro Forma' : 'Définitive'} pour ce client.`}
              </p>
            ) : (
              clientInvoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="p-4 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors cursor-pointer"
                  onClick={() => {
                    setSelectedClientForInvoices(null);
                    onViewInvoice(invoice);
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{invoice.invoiceNumber}</span>
                    <Badge 
                      variant={invoice.isProForma ? 'secondary' : 'default'}
                      className={invoice.isProForma ? '' : 'bg-blue-100 text-blue-700'}
                    >
                      {invoice.isProForma ? 'Pro Forma' : 'Definitive'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {new Date(invoice.date).toLocaleDateString('fr-FR')}
                  </p>
                  <p className="text-sm">{invoice.interventionTypeName}</p>
                  <p className="font-semibold mt-1">
                    {invoice.totalAmount.toLocaleString('fr-FR')} FCFA
                  </p>
                </div>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default ClientManager;
