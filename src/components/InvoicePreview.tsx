import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Printer, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Invoice } from "@/types";

interface InvoicePreviewProps {
  invoice: Invoice;
  onClose: () => void;
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

const InvoicePreview = ({ invoice, onClose }: InvoicePreviewProps) => {
  const handlePrint = () => {
    window.print();
  };

  const formattedDate = format(new Date(invoice.date), "d MMMM yyyy", { locale: fr });
  const totalInWords = numberToWords(Math.round(invoice.totalAmount));

  return (
    <div
      className="fixed inset-0 bg-foreground/50 flex items-center justify-center p-4 z-50 overflow-auto"
      onClick={onClose}
    >
      <div className="max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
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
          {/* Header with letterhead image */}
          <div className="invoice-header border-b-0 pb-0">
            <img
              src="/sahpac-header.png"
              alt="SAHPAC SARL - Société Africaine pour l'Hygiène Publique, L'Agriculture & le Commerce"
              className="w-full object-contain"
            />
            <p className="text-sm text-muted-foreground text-right mt-5 ms-5">Bamako, le {formattedDate}</p>
          </div>

          {/* Title */}
          <h2 className="text-center text-xl font-bold underline mb-6 text-primary">
            {invoice.isProForma !== false ? "FACTURE PROFORMA" : "FACTURE"}
          </h2>

          {/* Invoice Number */}
          <p className="text-right text-sm text-muted-foreground mb-4">N° {invoice.invoiceNumber}</p>

          {/* Client */}
          <p className="mb-4">
            <span className="font-semibold underline">Doit : </span>{" "}
            <span className="font-semibold">{invoice.clientName}</span>
          </p>

          {/* Work Description */}
          <p className="mb-6 font-semibold">{invoice.workDescription}</p>

          {/* Intervention Type */}
          <div className="mb-6">
            <h3 className="invoice-section-title">TYPE D'INTERVENTION</h3>
            <p className="mb-2">
              <span className="font-semibold text-primary underline">{invoice.interventionTypeName.toUpperCase()}</span>{" "}
              : {invoice.interventionDescription}
            </p>
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
            <div className="mb-6">
              <p>
                <span className="font-semibold text-primary">OBSERVATIONS</span> : {invoice.observations}
              </p>
            </div>
          )}

          {/* Amounts */}
          <div className="border-t border-border pt-4 mt-6">
            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between">
                  <span>Soit au forfait</span>
                  <span className="font-medium">{invoice.amountHT.toLocaleString("fr-FR")} F</span>
                </div>
                {invoice.tvaRate > 0 && (
                  <div className="flex justify-between">
                    <span>TVA {invoice.tvaRate}%</span>
                    <span className="font-medium">{invoice.tvaAmount.toLocaleString("fr-FR")} F</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total{invoice.tvaRate > 0 ? " TTC" : ""}</span>
                  <span>{invoice.totalAmount.toLocaleString("fr-FR")} F</span>
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
  );
};

export default InvoicePreview;
