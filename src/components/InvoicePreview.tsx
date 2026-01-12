import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Printer, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Invoice } from '@/types';

interface InvoicePreviewProps {
  invoice: Invoice;
  onClose: () => void;
}

const numberToWords = (num: number): string => {
  const ones = ['', 'UN', 'DEUX', 'TROIS', 'QUATRE', 'CINQ', 'SIX', 'SEPT', 'HUIT', 'NEUF', 'DIX', 
                'ONZE', 'DOUZE', 'TREIZE', 'QUATORZE', 'QUINZE', 'SEIZE', 'DIX-SEPT', 'DIX-HUIT', 'DIX-NEUF'];
  const tens = ['', '', 'VINGT', 'TRENTE', 'QUARANTE', 'CINQUANTE', 'SOIXANTE', 'SOIXANTE', 'QUATRE-VINGT', 'QUATRE-VINGT'];
  
  if (num === 0) return 'ZÉRO';
  if (num < 0) return 'MOINS ' + numberToWords(-num);
  
  let words = '';
  
  if (Math.floor(num / 1000000) > 0) {
    words += numberToWords(Math.floor(num / 1000000)) + ' MILLION ';
    num %= 1000000;
  }
  
  if (Math.floor(num / 1000) > 0) {
    if (Math.floor(num / 1000) === 1) {
      words += 'MILLE ';
    } else {
      words += numberToWords(Math.floor(num / 1000)) + ' MILLE ';
    }
    num %= 1000;
  }
  
  if (Math.floor(num / 100) > 0) {
    if (Math.floor(num / 100) === 1) {
      words += 'CENT ';
    } else {
      words += ones[Math.floor(num / 100)] + ' CENT ';
    }
    num %= 100;
  }
  
  if (num > 0) {
    if (num < 20) {
      words += ones[num];
    } else {
      const tenIndex = Math.floor(num / 10);
      const oneIndex = num % 10;
      
      if (tenIndex === 7 || tenIndex === 9) {
        words += tens[tenIndex] + '-' + ones[10 + oneIndex];
      } else if (tenIndex === 8) {
        if (oneIndex === 0) {
          words += 'QUATRE-VINGTS';
        } else {
          words += 'QUATRE-VINGT-' + ones[oneIndex];
        }
      } else {
        words += tens[tenIndex];
        if (oneIndex === 1 && tenIndex !== 8) {
          words += ' ET UN';
        } else if (oneIndex > 0) {
          words += '-' + ones[oneIndex];
        }
      }
    }
  }
  
  return words.trim();
};

const InvoicePreview = ({ invoice, onClose }: InvoicePreviewProps) => {
  const handlePrint = () => {
    window.print();
  };

  const formattedDate = format(new Date(invoice.date), "d MMMM yyyy", { locale: fr });
  const totalInWords = numberToWords(Math.round(invoice.totalAmount));

  return (
    <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center p-4 z-50 overflow-auto">
      <div className="max-w-4xl w-full">
        <div className="no-print flex justify-end gap-2 mb-4">
          <Button onClick={handlePrint} className="bg-success hover:bg-success/90">
            <Printer className="w-4 h-4 mr-2" />
            Imprimer
          </Button>
          <Button variant="outline" onClick={onClose} className="bg-card">
            <X className="w-4 h-4 mr-2" />
            Fermer
          </Button>
        </div>

        <div className="invoice-paper bg-card">
          {/* Header */}
          <div className="invoice-header text-center">
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center">
                <span className="font-display font-bold text-accent-foreground text-2xl">S</span>
              </div>
              <div>
                <h1 className="font-display text-3xl font-bold text-primary">SAHPAC <span className="text-lg font-normal">SARL</span></h1>
                <p className="text-sm text-muted-foreground">Société Africaine pour l'Hygiène Publique</p>
                <p className="text-sm text-muted-foreground">L'Agriculture & le Commerce</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">Bamako, le {formattedDate}</p>
          </div>

          {/* Title */}
          <h2 className="text-center text-xl font-bold underline mb-6 text-primary">FACTURE PROFORMA</h2>
          
          {/* Invoice Number */}
          <p className="text-right text-sm text-muted-foreground mb-4">N° {invoice.invoiceNumber}</p>

          {/* Client */}
          <p className="mb-4">
            <span className="font-semibold">Doit :</span> {invoice.clientName}
          </p>

          {/* Work Description */}
          <p className="mb-6">{invoice.workDescription}</p>

          {/* Intervention Type */}
          <div className="mb-6">
            <h3 className="invoice-section-title">TYPE D'INTERVENTION</h3>
            <p className="mb-2">
              <span className="font-semibold text-primary">{invoice.interventionTypeName.toUpperCase()}</span> : {invoice.interventionDescription}
            </p>
          </div>

          {/* Zones */}
          {invoice.zones.length > 0 && (
            <div className="mb-6">
              <h3 className="invoice-section-title">ZONES D'INTERVENTION</h3>
              <ul className="list-disc list-inside space-y-1">
                {invoice.zones.map(zone => (
                  <li key={zone.id}>{zone.name}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Frequency */}
          {invoice.frequency && (
            <div className="mb-6">
              <h3 className="invoice-section-title">FRÉQUENCE D'INTERVENTION</h3>
              <p>{invoice.frequency}</p>
            </div>
          )}

          {/* Findings */}
          {invoice.findings && (
            <div className="mb-6">
              <p>
                <span className="font-semibold text-primary">CONSTAT</span> : {invoice.findings}
              </p>
            </div>
          )}

          {/* Amounts */}
          <div className="border-t border-border pt-4 mt-6">
            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between">
                  <span>Soit au forfait</span>
                  <span className="font-medium">{invoice.amountHT.toLocaleString('fr-FR')} F</span>
                </div>
                <div className="flex justify-between">
                  <span>TVA {invoice.tvaRate}%</span>
                  <span className="font-medium">{invoice.tvaAmount.toLocaleString('fr-FR')} F</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total</span>
                  <span>{invoice.totalAmount.toLocaleString('fr-FR')} F</span>
                </div>
              </div>
            </div>
          </div>

          {/* Amount in Words */}
          <p className="mt-6 text-sm">
            Arrêté la présente facture à la somme de <span className="font-semibold">{totalInWords}</span> FRANC CFA.
          </p>

          {/* Signatures */}
          <div className="flex justify-between mt-12">
            <div className="text-center">
              <p className="font-semibold">Pour Acquit</p>
            </div>
            <div className="text-center">
              <p className="font-semibold">Le Directeur Général</p>
              <p className="mt-8 text-muted-foreground italic">Mamadou DIALLO</p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-4 border-t text-center text-xs text-muted-foreground">
            <p>Compte BMS : 1638020115 - RCCM : MARKO 2007 3858 - N° Fiscal 0861031915</p>
            <p>Tél 66.94.30.18 - Bamako, Mali</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoicePreview;
