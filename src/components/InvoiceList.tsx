import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Eye, Trash2, FileText, FileCheck, Search, Edit2 } from 'lucide-react';
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
import { Invoice } from '@/types';

interface InvoiceListProps {
  invoices: Invoice[];
  clients: { id: string; phone?: string }[];
  onViewInvoice: (invoice: Invoice) => void;
  onEditInvoice: (invoice: Invoice) => void;
  onDeleteInvoice: (id: string) => void;
  onUpdateInvoice: (id: string, data: Partial<Invoice>) => void;
}

const InvoiceList = ({ invoices, clients, onViewInvoice, onEditInvoice, onDeleteInvoice, onUpdateInvoice }: InvoiceListProps) => {
  const [deleteInvoice, setDeleteInvoice] = useState<Invoice | null>(null);
  const [convertInvoice, setConvertInvoice] = useState<Invoice | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'proforma' | 'definitive'>('all');

  const filteredInvoices = useMemo(() => {
    let filtered = invoices;
    
    // Filter by type
    if (typeFilter === 'proforma') {
      filtered = filtered.filter(inv => inv.isProForma !== false);
    } else if (typeFilter === 'definitive') {
      filtered = filtered.filter(inv => inv.isProForma === false);
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(invoice => {
        const client = clients.find(c => c.id === invoice.clientId);
        return invoice.clientName.toLowerCase().includes(query) ||
          (client?.phone && client.phone.toLowerCase().includes(query));
      });
    }
    
    return filtered;
  }, [invoices, clients, searchQuery, typeFilter]);

  const proFormaCount = useMemo(() => invoices.filter(inv => inv.isProForma !== false).length, [invoices]);
  const definitiveCount = useMemo(() => invoices.filter(inv => inv.isProForma === false).length, [invoices]);

  const toggleTypeFilter = (type: 'proforma' | 'definitive') => {
    setTypeFilter(prev => prev === type ? 'all' : type);
  };

  const handleConfirmDelete = () => {
    if (deleteInvoice) {
      onDeleteInvoice(deleteInvoice.id);
      setDeleteInvoice(null);
    }
  };

  const handleConfirmConvert = () => {
    if (convertInvoice) {
      onUpdateInvoice(convertInvoice.id, { isProForma: false });
      setConvertInvoice(null);
    }
  };

  if (invoices.length === 0) {
    return (
      <Card className="animate-fade-in">
        <CardContent className="py-12 text-center">
          <FileText className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">
            Aucune facture enregistrée. Créez votre première facture.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4 animate-fade-in">
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <CardTitle>Factures ({invoices.length})</CardTitle>
              <div className="flex gap-2">
                <Badge 
                  variant={typeFilter === 'proforma' ? 'default' : 'secondary'} 
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => toggleTypeFilter('proforma')}
                >
                  {proFormaCount} Pro Forma
                </Badge>
                <Badge 
                  variant={typeFilter === 'definitive' ? 'default' : 'outline'} 
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => toggleTypeFilter('definitive')}
                >
                  {definitiveCount} Définitives
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom de client ou téléphone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            {filteredInvoices.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                {invoices.length === 0 
                  ? "Aucune facture enregistrée. Créez votre première facture."
                  : "Aucune facture trouvée pour cette recherche."}
              </p>
            ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">N°</th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Statut</th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Date</th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Client</th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Type</th>
                    <th className="text-right py-3 px-2 font-medium text-muted-foreground">Total</th>
                    <th className="text-right py-3 px-2 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b hover:bg-secondary/50 transition-colors">
                      <td className="py-3 px-2 font-medium">{invoice.invoiceNumber}</td>
                      <td className="py-3 px-2">
                        <Badge variant={invoice.isProForma !== false ? 'secondary' : 'default'}>
                          {invoice.isProForma !== false ? 'Pro Forma' : 'Facture'}
                        </Badge>
                      </td>
                      <td className="py-3 px-2">
                        {format(new Date(invoice.date), 'dd/MM/yyyy', { locale: fr })}
                      </td>
                      <td className="py-3 px-2">{invoice.clientName}</td>
                      <td className="py-3 px-2">
                        <span className="inline-block px-2 py-1 text-xs rounded-full bg-primary/10 text-primary">
                          {invoice.interventionTypeName}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right font-medium">
                        {invoice.totalAmount.toLocaleString('fr-FR')} F
                      </td>
                      <td className="py-3 px-2 text-right">
                        <div className="flex justify-end gap-1">
                          {invoice.isProForma !== false && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setConvertInvoice(invoice)}
                              title="Convertir en facture définitive"
                            >
                              <FileCheck className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onEditInvoice(invoice)}
                            title="Modifier"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onViewInvoice(invoice)}
                            title="Aperçu"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeleteInvoice(invoice)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={!!deleteInvoice} onOpenChange={(open) => !open && setDeleteInvoice(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer la facture <strong>{deleteInvoice?.invoiceNumber}</strong> ?
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

      <AlertDialog open={!!convertInvoice} onOpenChange={(open) => !open && setConvertInvoice(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Convertir en facture définitive</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir convertir la facture pro forma <strong>{convertInvoice?.invoiceNumber}</strong> en facture définitive ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmConvert}>
              Convertir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default InvoiceList;
