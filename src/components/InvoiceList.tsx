import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Eye, Trash2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Invoice } from '@/types';

interface InvoiceListProps {
  invoices: Invoice[];
  onViewInvoice: (invoice: Invoice) => void;
  onDeleteInvoice: (id: string) => void;
}

const InvoiceList = ({ invoices, onViewInvoice, onDeleteInvoice }: InvoiceListProps) => {
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
    <div className="space-y-4 animate-fade-in">
      <Card>
        <CardHeader>
          <CardTitle>Factures ({invoices.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">N°</th>
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Date</th>
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Client</th>
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Type</th>
                  <th className="text-right py-3 px-2 font-medium text-muted-foreground">Total</th>
                  <th className="text-right py-3 px-2 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b hover:bg-secondary/50 transition-colors">
                    <td className="py-3 px-2 font-medium">{invoice.invoiceNumber}</td>
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
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onViewInvoice(invoice)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onDeleteInvoice(invoice.id)}
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
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoiceList;
