import { useRef, useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Printer, X, Download, Banknote, FileCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Invoice } from "@/types";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface InvoicePreviewProps {
  invoice: Invoice;
  onClose: () => void;
  onUpdateInvoice?: (id: string, data: Partial<Invoice>) => void;
  onConvertInvoice?: (invoice: Invoice, includeTva: boolean) => void;
}

const numberToWords = (num: number): string => {
  const ones = [
    "",
    "UN",
    "DEUX",
    "TROIS",
    "QUATRE",
    "CINQ",
    "SIX",
    "SEPT",
    "HUIT",
    "NEUF",
    "DIX",
    "ONZE",
    "DOUZE",
    "TREIZE",
    "QUATORZE",
    "QUINZE",
    "SEIZE",
    "DIX-SEPT",
    "DIX-HUIT",
    "DIX-NEUF",
  ];
  const tens = [
    "",
    "",
    "VINGT",
    "TRENTE",
    "QUARANTE",
    "CINQUANTE",
    "SOIXANTE",
    "SOIXANTE",
    "QUATRE-VINGT",
    "QUATRE-VINGT",
  ];

  if (num === 0) return "ZÉRO";
  if (num < 0) return "MOINS " + numberToWords(-num);

  let words = "";

  if (Math.floor(num / 1000000) > 0) {
    words += numberToWords(Math.floor(num / 1000000)) + " MILLION ";
    num %= 1000000;
  }

  if (Math.floor(num / 1000) > 0) {
    if (Math.floor(num / 1000) === 1) {
      words += "MILLE ";
    } else {
      words += numberToWords(Math.floor(num / 1000)) + " MILLE ";
    }
    num %= 1000;
  }

  if (Math.floor(num / 100) > 0) {
    if (Math.floor(num / 100) === 1) {
      words += "CENT ";
    } else {
      words += ones[Math.floor(num / 100)] + " CENT ";
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
        words += tens[tenIndex] + "-" + ones[10 + oneIndex];
      } else if (tenIndex === 8) {
        if (oneIndex === 0) {
          words += "QUATRE-VINGTS";
        } else {
          words += "QUATRE-VINGT-" + ones[oneIndex];
        }
      } else {
        words += tens[tenIndex];
        if (oneIndex === 1 && tenIndex !== 8) {
          words += " ET UN";
        } else if (oneIndex > 0) {
          words += "-" + ones[oneIndex];
        }
      }
    }
  }

  return words.trim();
};

const InvoicePreview = ({ invoice, onClose, onUpdateInvoice, onConvertInvoice }: InvoicePreviewProps) => {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [showPayDialog, setShowPayDialog] = useState(false);
  const [showConvertDialog, setShowConvertDialog] = useState(false);
  const [convertIncludeTva, setConvertIncludeTva] = useState(true);
  const [paymentAmount, setPaymentAmount] = useState('');
  const interventions = invoice.interventions && invoice.interventions.length > 0
    ? invoice.interventions
    : [{
        id: invoice.interventionTypeId,
        name: invoice.interventionTypeName,
        description: invoice.interventionDescription,
        standardPrice: invoice.amountHT,
      }];
  const showSeparatedTotals = invoice.separateTotalsByInterventionType === true && interventions.length > 1;

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = async () => {
    if (!invoiceRef.current) return;
    
    setIsExporting(true);
    try {
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 0;
      
      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`${invoice.invoiceNumber}.pdf`);
    } catch (error) {
      console.error('Error exporting PDF:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const formattedDate = format(new Date(invoice.date), "d MMMM yyyy", { locale: fr });
  const totalInWords = numberToWords(Math.round(invoice.totalAmount));

  return (
    <div
      className="print-container fixed inset-0 bg-foreground/50 z-50 overflow-auto"
      onClick={onClose}
    >
      <div className="min-h-full flex flex-col items-center py-2 sm:py-4 px-2 sm:px-4">
        <div className="max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
        <div className="no-print flex flex-wrap justify-end gap-1.5 sm:gap-2 mb-3 sm:mb-4">
          {invoice.isProForma !== false && onConvertInvoice && (
            <Button
              onClick={() => {
                setConvertIncludeTva(true);
                setShowConvertDialog(true);
              }}
              variant="secondary"
              size="sm"
              className="text-xs sm:text-sm"
            >
              <FileCheck className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Convertir en facture</span>
              <span className="sm:hidden">Convertir</span>
            </Button>
          )}
          {!invoice.isProForma && invoice.status !== 'paid' && onUpdateInvoice && (
            <Button
              onClick={() => {
                const remaining = invoice.totalAmount - (invoice.paidAmount || 0);
                setPaymentAmount(String(remaining));
                setShowPayDialog(true);
              }}
              variant="secondary"
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm"
            >
              <Banknote className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Enregistrer un paiement</span>
              <span className="sm:hidden">Payer</span>
            </Button>
          )}
          <Button 
            onClick={handleExportPDF} 
            variant="secondary"
            size="sm"
            className="bg-warning hover:bg-warning/90 text-warning-foreground text-xs sm:text-sm"
            disabled={isExporting}
          >
            <Download className="w-4 h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">{isExporting ? 'Export...' : 'Exporter PDF'}</span>
            <span className="sm:hidden">PDF</span>
          </Button>
          {/* Print button hidden per request */}
          {/*
          <Button onClick={handlePrint} variant="secondary" size="sm" className="bg-warning hover:bg-warning/90 text-warning-foreground text-xs sm:text-sm">
            <Printer className="w-4 h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Imprimer</span>
          </Button>
          */}
          <Button variant="outline" onClick={onClose} size="sm" className="bg-card text-xs sm:text-sm">
            <X className="w-4 h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Fermer</span>
          </Button>
        </div>

        <div ref={invoiceRef} className="invoice-paper print-paper bg-card relative overflow-hidden">
          {/* PAYÉ Watermark */}
          {invoice.status === 'paid' && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <span className="text-green-500/20 text-[120px] font-bold rotate-[-30deg] select-none tracking-widest">
                PAYÉE
              </span>
            </div>
          )}
          
          {/* Header with letterhead image */}
          <div className="invoice-header border-b-0 pb-0 relative z-20">
            <img
              src="/sahpac-header.png"
              alt="SAHPAC SARL - Société Africaine pour l'Hygiène Publique, L'Agriculture & le Commerce"
              className="w-full object-contain"
            />
            <p className="text-sm text-muted-foreground text-right mt-5 ms-5">Bamako, le {formattedDate}</p>
          </div>

          {/* Title with invoice number */}
          <h2 className="text-center text-xl font-bold underline mb-6 text-primary">
            {invoice.isProForma !== false
              ? `PROFORMA No. ${invoice.invoiceNumber}`
              : `FACTURE No. ${invoice.invoiceNumber}`}
          </h2>

          {/* Client */}
          <p className="mb-4">
            <span className="font-semibold underline">Doit</span>:{" "}
            <span className="font-semibold">{invoice.clientName}</span>
          </p>

          {/* Work Description */}
          <p className="mb-6 font-semibold">{invoice.workDescription}</p>

          {/* Intervention Type */}
          <div className="mb-6">
            <h3 className="invoice-section-title">TYPE{interventions.length > 1 ? 'S' : ''} D'INTERVENTION</h3>
            <div className="space-y-2">
              {interventions.map((intervention, index) => (
                <p key={`${intervention.id}-${index}`} className="mb-2">
                  <span className="font-semibold text-primary underline">{intervention.name.toUpperCase()}</span>{" "}
                  : {intervention.description}
                  {intervention.standardPrice > 0 && (
                    <span className="font-medium"> ({intervention.standardPrice.toLocaleString('fr-FR')} FCFA)</span>
                  )}
                </p>
              ))}
            </div>
          </div>

          {/* Zones */}
          {invoice.zones.length > 0 && (
            <div className="mb-6">
              <h3 className="invoice-section-title">ZONES D'INTERVENTION</h3>
              <ul className="list-disc list-inside space-y-1">
                {invoice.zones.map((zone) => (
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
                <span className="font-semibold text-primary underline">CONSTAT</span> : {invoice.findings}
              </p>
            </div>
          )}

          {/* Observations */}
          {invoice.observations && (
            <div className="mb-6 text-sm text-foreground">
              <p>
                <span className="font-semibold underline">OBSERVATIONS</span> : {invoice.observations}
              </p>
            </div>
          )}

          {/* Amounts */}
          <div className="pt-4 mt-6">
            <div className="space-y-2">
              {showSeparatedTotals && interventions.map((intervention, index) => (
                <div key={`${intervention.id}-${index}`} className="flex items-baseline font-bold">
                  <span className="shrink-0">{intervention.name}</span>
                  <span className="flex-1 border-b border-dotted border-foreground/50 mx-2 mb-1"></span>
                  <span className="shrink-0">{(intervention.amountHT || 0).toLocaleString("fr-FR")} FCFA</span>
                </div>
              ))}
              <div className="flex items-baseline">
                <span className="shrink-0">{showSeparatedTotals ? 'Total HT' : 'Soit au forfait'}</span>
                <span className="flex-1 border-b border-dotted border-foreground/50 mx-2 mb-1"></span>
                <span className="font-medium shrink-0">{invoice.amountHT.toLocaleString("fr-FR")} FCFA</span>
              </div>
              {invoice.tvaRate > 0 && (
                <div className="flex items-baseline">
                  <span className="shrink-0">TVA {invoice.tvaRate}%</span>
                  <span className="flex-1 border-b border-dotted border-foreground/50 mx-2 mb-1"></span>
                  <span className="font-medium shrink-0"><span className="font-medium shrink-0">{invoice.tvaAmount.toLocaleString("fr-FR")} FCFA</span></span>
                </div>
              )}
              <div className="flex items-baseline font-bold text-lg pt-2">
                <span className="shrink-0">Total{invoice.tvaRate > 0 ? " TTC" : ""}</span>
                <span className="flex-1 border-b border-dotted border-foreground/50 mx-2 mb-1"></span>
                <span className="shrink-0"><span className="shrink-0">{invoice.totalAmount.toLocaleString("fr-FR")} FCFA</span></span>
              </div>
              {/* Partial payment info */}
              {!invoice.isProForma && (invoice.paidAmount || 0) > 0 && invoice.status !== 'paid' && (
                <>
                  <div className="flex items-baseline pt-1 text-sm">
                    <span className="shrink-0">Montant payé</span>
                    <span className="flex-1 border-b border-dotted border-foreground/50 mx-2 mb-1"></span>
                    <span className="shrink-0"><span className="shrink-0">{(invoice.paidAmount || 0).toLocaleString("fr-FR")} FCFA</span></span>
                  </div>
                  <div className="flex items-baseline font-bold text-lg text-orange-600 pt-1">
                    <span className="shrink-0">Reste à payer</span>
                    <span className="flex-1 border-b border-dotted border-foreground/50 mx-2 mb-1"></span>
                    <span className="shrink-0"><span className="shrink-0">{(invoice.totalAmount - (invoice.paidAmount || 0)).toLocaleString("fr-FR")} FCFA</span></span>
                  </div>
                </>
              )}
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
          <div className="mt-12 pt-4 border-t border-foreground text-center text-xs">
            <p className="font-semibold">Siège social : Faladié SEMA (cité BIAO) porte 250 Rue 902</p>
            <p>
              Compte BMS : 000163802001 - RCCM : MABKO 2007 3558 N° Fiscal 086103191<sup>E</sup> - Tél 66.94.30.18 &
              76.49.53.67
            </p>
            <p>sahpac1_sarl@yahoo.fr : Bamako - Mali</p>
          </div>
        </div>
        </div>
      </div>

      {/* Payment Dialog */}
      <AlertDialog open={showPayDialog} onOpenChange={(open) => { if (!open) { setShowPayDialog(false); setPaymentAmount(''); } }}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Enregistrer un paiement</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  Facture <strong>{invoice.invoiceNumber}</strong> — Total: <strong>{invoice.totalAmount.toLocaleString('fr-FR')} FCFA</strong>
                </p>
                {(invoice.paidAmount || 0) > 0 && (
                  <p>Déjà payé: <strong>{(invoice.paidAmount || 0).toLocaleString('fr-FR')} FCFA</strong> — Reste: <strong>{(invoice.totalAmount - (invoice.paidAmount || 0)).toLocaleString('fr-FR')} FCFA</strong></p>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="preview-payment-amount">Montant du paiement (FCFA)</Label>
                  <Input
                    id="preview-payment-amount"
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
            <AlertDialogAction
              className="bg-green-600 hover:bg-green-700"
              disabled={!paymentAmount || parseFloat(paymentAmount) <= 0}
              onClick={() => {
                if (!onUpdateInvoice) return;
                const amount = parseFloat(paymentAmount) || 0;
                const totalPaid = (invoice.paidAmount || 0) + amount;
                const remaining = invoice.totalAmount - totalPaid;
                if (remaining <= 0) {
                  onUpdateInvoice(invoice.id, { status: 'paid', paidAmount: invoice.totalAmount, paidAt: new Date() });
                } else {
                  onUpdateInvoice(invoice.id, { paidAmount: totalPaid });
                }
                setShowPayDialog(false);
                setPaymentAmount('');
              }}
            >
              Confirmer le paiement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showConvertDialog} onOpenChange={(open) => {
        if (!open) {
          setShowConvertDialog(false);
          setConvertIncludeTva(true);
        }
      }}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Convertir en facture définitive</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  Êtes-vous sûr de vouloir convertir la facture pro forma <strong>{invoice.invoiceNumber}</strong> en facture définitive ?
                  Cette action est irréversible.
                </p>
                <div className="flex items-center space-x-3 rounded-lg bg-secondary/40 p-3">
                  <Switch
                    id="preview-convert-include-tva"
                    checked={convertIncludeTva}
                    onCheckedChange={setConvertIncludeTva}
                  />
                  <Label htmlFor="preview-convert-include-tva" className="cursor-pointer">
                    Ajouter TVA
                  </Label>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onConvertInvoice?.(invoice, convertIncludeTva);
                setShowConvertDialog(false);
                setConvertIncludeTva(true);
              }}
            >
              Convertir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default InvoicePreview;
