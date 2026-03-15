import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Eye, Trash2, FileText, FileCheck, Search, Edit2, Copy, CalendarIcon, X, Banknote, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  const [paymentAmount, setPaymentAmount] = useState('');
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

  const financialStats = useMemo(() => {
    const definitiveInvoices = invoices.filter(inv => inv.isProForma === false);
    const totalAmount = definitiveInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const totalPaid = definitiveInvoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);
    const totalRemaining = totalAmount - totalPaid;
    return { totalAmount, totalPaid, totalRemaining };
  }, [invoices]);

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
      const amount = parseFloat(paymentAmount) || 0;
      if (amount <= 0) return;
      const totalPaid = (payInvoice.paidAmount || 0) + amount;
      const remaining = payInvoice.totalAmount - totalPaid;
      
      if (remaining <= 0) {
        // Fully paid
        onUpdateInvoice(payInvoice.id, { status: 'paid', paidAmount: payInvoice.totalAmount, paidAt: new Date() });
      } else {
        // Partial payment
        onUpdateInvoice(payInvoice.id, { paidAmount: totalPaid });
      }
      setPayInvoice(null);
      setPaymentAmount('');
    }
  };

  const openPayDialog = (invoice: Invoice) => {
    setPayInvoice(invoice);
    const remaining = invoice.totalAmount - (invoice.paidAmount || 0);
    setPaymentAmount(String(remaining));
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
        {/* Financial summary */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
            <CardContent className="p-3 sm:p-4 text-center">
              <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide">Total Facturé</p>
              <p className="text-sm sm:text-xl font-bold text-blue-700 dark:text-blue-300"><p className="text-sm sm:text-xl font-bold text-blue-700 dark:text-blue-300">{financialStats.totalAmount.toLocaleString('fr-FR')} FCFA</p></p>
            </CardContent>
          </Card>
          <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
            <CardContent className="p-3 sm:p-4 text-center">
              <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide">Total Payé</p>
              <p className="text-sm sm:text-xl font-bold text-green-700 dark:text-green-300"><p className="text-sm sm:text-xl font-bold text-green-700 dark:text-green-300">{financialStats.totalPaid.toLocaleString('fr-FR')} FCFA</p></p>
            </CardContent>
          </Card>
          <Card className="bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800">
            <CardContent className="p-3 sm:p-4 text-center">
              <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide">Reliquats</p>
              <p className="text-sm sm:text-xl font-bold text-orange-700 dark:text-orange-300"><p className="text-sm sm:text-xl font-bold text-orange-700 dark:text-orange-300">{financialStats.totalRemaining.toLocaleString('fr-FR')} FCFA</p></p>
            </CardContent>
          </Card>
        </div>

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
            <>
            {/* Desktop table */}
            <div className="overflow-x-auto hidden md:block">
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
                      <p className="font-bold">{invoice.totalAmount.toLocaleString('fr-FR')} FCFA</p>
                      </td>
                      <td className="py-3 px-2">
                        {invoice.isProForma === false ? (
                          invoice.status === 'paid' ? (
                            <Badge variant="default" className="bg-green-600 hover:bg-green-600">
                              Payée
                            </Badge>
                          ) : (invoice.paidAmount || 0) > 0 ? (
                            <div className="flex flex-col gap-0.5">
                              <Badge variant="outline" className="text-orange-600 border-orange-600">
                                Partiel
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {(invoice.paidAmount || 0).toLocaleString('fr-FR')} / {invoice.totalAmount.toLocaleString('fr-FR')} FCFA
                              </span>
                            </div>
                          ) : (
                            <Badge variant="outline" className="text-orange-600 border-orange-600">
                              En attente
                            </Badge>
                          )
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
                              onClick={() => openPayDialog(invoice)}
                              title="Enregistrer un paiement"
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

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {filteredInvoices.map((invoice) => (
                <div key={invoice.id} className="border rounded-lg p-3 space-y-2 bg-card">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{invoice.invoiceNumber}</span>
                        <Badge variant={invoice.isProForma !== false ? 'secondary' : 'default'} className="text-xs">
                          {invoice.isProForma !== false ? 'Pro Forma' : 'Définitive'}
                        </Badge>
                      </div>
                      <p className="font-medium mt-1">{invoice.clientName}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(invoice.date), 'dd/MM/yyyy', { locale: fr })} · {invoice.interventionTypeName}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold">{invoice.totalAmount.toLocaleString('fr-FR')} F</p>
                      {invoice.isProForma === false && (
                        <div className="mt-1">
                          {invoice.status === 'paid' ? (
                            <Badge variant="default" className="bg-green-600 hover:bg-green-600 text-xs">Payée</Badge>
                          ) : (invoice.paidAmount || 0) > 0 ? (
                            <div className="flex flex-col items-end gap-0.5">
                              <Badge variant="outline" className="text-orange-600 border-orange-600 text-xs">Partiel</Badge>
                              <span className="text-[10px] text-muted-foreground">
                                {(invoice.paidAmount || 0).toLocaleString('fr-FR')} / {invoice.totalAmount.toLocaleString('fr-FR')} FCFA
                              </span>
                            </div>
                          ) : (
                            <Badge variant="outline" className="text-orange-600 border-orange-600 text-xs">En attente</Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-end gap-1 border-t pt-2">
                    {invoice.isProForma !== false && (
                      <Button size="sm" variant="ghost" onClick={() => setConvertInvoice(invoice)} className="h-8 w-8 p-0">
                        <FileCheck className="w-4 h-4" />
                      </Button>
                    )}
                    {invoice.isProForma === false && invoice.status !== 'paid' && (
                      <Button size="sm" variant="ghost" onClick={() => openPayDialog(invoice)} className="h-8 w-8 p-0 text-green-600">
                        <Banknote className="w-4 h-4" />
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => onEditInvoice(invoice)} className="h-8 w-8 p-0">
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => onCopyInvoice(invoice)} className="h-8 w-8 p-0">
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => onViewInvoice(invoice)} className="h-8 w-8 p-0">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setDeleteInvoice(invoice)} className="h-8 w-8 p-0 text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            </>
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

      <AlertDialog open={!!payInvoice} onOpenChange={(open) => { if (!open) { setPayInvoice(null); setPaymentAmount(''); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Enregistrer un paiement</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  Facture <strong>{payInvoice?.invoiceNumber}</strong> — Total: <strong>{payInvoice?.totalAmount.toLocaleString('fr-FR')} FCFA</strong>
                </p>
                {(payInvoice?.paidAmount || 0) > 0 && (
                  <p>Déjà payé: <strong>{(payInvoice?.paidAmount || 0).toLocaleString('fr-FR')} FCFA</strong> — Reste: <strong>{((payInvoice?.totalAmount || 0) - (payInvoice?.paidAmount || 0)).toLocaleString('fr-FR')} FCFA</strong></p>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="payment-amount">Montant du paiement (FCFA)</Label>
                  <Input
                    id="payment-amount"
                    type="number"
                    min="0"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="Montant..."
                  />
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmPay} className="bg-green-600 hover:bg-green-700" disabled={!paymentAmount || parseFloat(paymentAmount) <= 0}>
              Confirmer le paiement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default InvoiceList;
