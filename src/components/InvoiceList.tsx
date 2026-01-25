import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Eye, Trash2, FileText, FileCheck, Search, Edit2, Copy, CalendarIcon, X, Banknote, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
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
  onCopyInvoice: (invoice: Invoice) => void;
  onNewInvoice: () => void;
}

const InvoiceList = ({ invoices, clients, onViewInvoice, onEditInvoice, onDeleteInvoice, onUpdateInvoice, onCopyInvoice, onNewInvoice }: InvoiceListProps) => {
  const [deleteInvoice, setDeleteInvoice] = useState<Invoice | null>(null);
  const [convertInvoice, setConvertInvoice] = useState<Invoice | null>(null);
  const [payInvoice, setPayInvoice] = useState<Invoice | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'proforma' | 'definitive'>('all');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'paid' | 'pending'>('all');
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);

  const filteredInvoices = useMemo(() => {
    let filtered = invoices;
    
    // Filter by type
    if (typeFilter === 'proforma') {
      filtered = filtered.filter(inv => inv.isProForma !== false);
    } else if (typeFilter === 'definitive') {
      filtered = filtered.filter(inv => inv.isProForma === false);
    }
    
    // Filter by payment status (only applies to definitive invoices)
    if (paymentFilter === 'paid') {
      filtered = filtered.filter(inv => inv.isProForma === false && inv.status === 'paid');
    } else if (paymentFilter === 'pending') {
      filtered = filtered.filter(inv => inv.isProForma === false && inv.status !== 'paid');
    }
    
    // Filter by date range
    if (dateFrom) {
      filtered = filtered.filter(inv => new Date(inv.date) >= dateFrom);
    }
    if (dateTo) {
      const endOfDay = new Date(dateTo);
      endOfDay.setHours(23, 59, 59, 999);
      filtered = filtered.filter(inv => new Date(inv.date) <= endOfDay);
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
  }, [invoices, clients, searchQuery, typeFilter, paymentFilter, dateFrom, dateTo]);

  const clearDateFilter = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  const proFormaCount = useMemo(() => invoices.filter(inv => inv.isProForma !== false).length, [invoices]);
  const definitiveCount = useMemo(() => invoices.filter(inv => inv.isProForma === false).length, [invoices]);
  const paidCount = useMemo(() => invoices.filter(inv => inv.isProForma === false && inv.status === 'paid').length, [invoices]);
  const pendingCount = useMemo(() => invoices.filter(inv => inv.isProForma === false && inv.status !== 'paid').length, [invoices]);

  const toggleTypeFilter = (type: 'proforma' | 'definitive') => {
    setTypeFilter(prev => prev === type ? 'all' : type);
    // Reset payment filter when changing type filter
    if (type === 'proforma') {
      setPaymentFilter('all');
    }
  };

  const togglePaymentFilter = (status: 'paid' | 'pending') => {
    setPaymentFilter(prev => prev === status ? 'all' : status);
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

  const handleConfirmPay = () => {
    if (payInvoice) {
      onUpdateInvoice(payInvoice.id, { status: 'paid', paidAt: new Date() });
      setPayInvoice(null);
    }
  };

  if (invoices.length === 0) {
    return (
      <Card className="animate-fade-in">
        <CardHeader>
          <div className="flex items-center gap-3">
            <CardTitle>Factures (0)</CardTitle>
            <Button onClick={onNewInvoice} size="sm" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Nouvelle Facture
            </Button>
          </div>
        </CardHeader>
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
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <CardTitle>Factures ({invoices.length})</CardTitle>
                <Button onClick={onNewInvoice} size="sm" className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Nouvelle Facture
                </Button>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="flex gap-2 flex-wrap justify-end">
                  <Badge 
                    variant={typeFilter === 'proforma' ? 'default' : 'secondary'} 
                    className={`cursor-pointer hover:opacity-80 transition-opacity ${typeFilter === 'proforma' ? 'bg-gray-700 hover:bg-gray-700' : ''}`}
                    onClick={() => toggleTypeFilter('proforma')}
                  >
                    {proFormaCount} Pro Forma
                  </Badge>
                  <Badge 
                    variant={typeFilter === 'definitive' ? 'default' : 'secondary'} 
                    className={`cursor-pointer hover:opacity-80 transition-opacity ${typeFilter === 'definitive' ? 'bg-gray-700 hover:bg-gray-700' : 'bg-blue-100 text-blue-700 hover:bg-blue-100'}`}
                    onClick={() => toggleTypeFilter('definitive')}
                  >
                    {definitiveCount} Définitives
                  </Badge>
                  <span className="text-muted-foreground">|</span>
                  <Badge 
                    variant={paymentFilter === 'paid' ? 'default' : 'outline'} 
                    className={`cursor-pointer hover:opacity-80 transition-opacity ${paymentFilter === 'paid' ? 'bg-green-600 hover:bg-green-600' : 'text-green-600 border-green-600'}`}
                    onClick={() => togglePaymentFilter('paid')}
                  >
                    {paidCount} Payées
                  </Badge>
                  <Badge 
                    variant={paymentFilter === 'pending' ? 'default' : 'outline'} 
                    className={`cursor-pointer hover:opacity-80 transition-opacity ${paymentFilter === 'pending' ? 'bg-orange-600 hover:bg-orange-600' : 'text-orange-600 border-orange-600'}`}
                    onClick={() => togglePaymentFilter('pending')}
                  >
                    {pendingCount} En attente
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                          "justify-start text-left font-normal",
                          !dateFrom && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateFrom ? format(dateFrom, "dd/MM/yyyy") : "Du"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 z-50 bg-background" align="end">
                      <Calendar
                        mode="single"
                        selected={dateFrom}
                        onSelect={setDateFrom}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                          "justify-start text-left font-normal",
                          !dateTo && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateTo ? format(dateTo, "dd/MM/yyyy") : "Au"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 z-50 bg-background" align="end">
                      <Calendar
                        mode="single"
                        selected={dateTo}
                        onSelect={setDateTo}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  {(dateFrom || dateTo) && (
                    <Button variant="ghost" size="sm" onClick={clearDateFilter}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
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
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Type facture</th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Date</th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Client</th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Type</th>
                    <th className="text-right py-3 px-2 font-medium text-muted-foreground">Total</th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Statut paiement</th>
                    <th className="text-right py-3 px-2 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b hover:bg-secondary/50 transition-colors">
                      <td className="py-3 px-2 font-medium">{invoice.invoiceNumber}</td>
                      <td className="py-3 px-2">
                        <Badge variant={invoice.isProForma !== false ? 'secondary' : 'default'}>
                          {invoice.isProForma !== false ? 'Pro Forma' : 'Définitive'}
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
                      <td className="py-3 px-2">
                        {invoice.isProForma === false ? (
                          <Badge 
                            variant={invoice.status === 'paid' ? 'default' : 'outline'}
                            className={invoice.status === 'paid' ? 'bg-green-600 hover:bg-green-600' : 'text-orange-600 border-orange-600'}
                          >
                            {invoice.status === 'paid' ? 'Payée' : 'En attente'}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
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
                          {invoice.isProForma === false && invoice.status !== 'paid' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setPayInvoice(invoice)}
                              title="Marquer comme payée"
                              className="text-green-600 hover:text-green-700"
                            >
                              <Banknote className="w-4 h-4" />
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
                            onClick={() => onCopyInvoice(invoice)}
                            title="Copier"
                          >
                            <Copy className="w-4 h-4" />
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

      <AlertDialog open={!!payInvoice} onOpenChange={(open) => !open && setPayInvoice(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Marquer comme payée</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir marquer la facture <strong>{payInvoice?.invoiceNumber}</strong> comme payée ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmPay} className="bg-green-600 hover:bg-green-700">
              Confirmer le paiement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default InvoiceList;
