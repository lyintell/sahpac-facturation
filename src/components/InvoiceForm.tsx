import { useState, useMemo, useEffect } from 'react';
import { Plus, X, FileText, Save, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Client, Invoice, ZoneIntervention, INTERVENTION_TYPES, DEFAULT_TVA_RATE } from '@/types';
interface InvoiceFormProps {
  clients: Client[];
  zones: ZoneIntervention[];
  editingInvoice?: Invoice | null;
  preselectedClientId?: string | null;
  onAddClient: (client: Omit<Client, 'id' | 'createdAt'>) => void;
  onAddZone: (zone: Omit<ZoneIntervention, 'id'>) => Promise<ZoneIntervention | null>;
  onCreateInvoice: (invoice: Omit<Invoice, 'id' | 'createdAt' | 'invoiceNumber'>) => void;
  onUpdateInvoice?: (id: string, data: Partial<Invoice>) => void;
  onCancelEdit?: () => void;
}

const InvoiceForm = ({ clients, zones, editingInvoice, preselectedClientId, onAddClient, onAddZone, onCreateInvoice, onUpdateInvoice, onCancelEdit }: InvoiceFormProps) => {
  const [selectedClientId, setSelectedClientId] = useState('');
  const [newClientName, setNewClientName] = useState('');
  const [newClientAddress, setNewClientAddress] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [showNewClient, setShowNewClient] = useState(false);
  
  const [workDescription, setWorkDescription] = useState('');
  const [selectedInterventionId, setSelectedInterventionId] = useState('');
  const [customInterventionDesc, setCustomInterventionDesc] = useState('');
  
  const [selectedZones, setSelectedZones] = useState<ZoneIntervention[]>([]);
  const [newZoneName, setNewZoneName] = useState('');
  
  const [frequency, setFrequency] = useState('');
  const [findings, setFindings] = useState('');
  
  const [amountHT, setAmountHT] = useState('');
  const [tvaRate] = useState(DEFAULT_TVA_RATE);
  const [includeTva, setIncludeTva] = useState(true);
  const [isProForma, setIsProForma] = useState(true);
  const [observations, setObservations] = useState('');
  const [invoiceDate, setInvoiceDate] = useState<Date>(new Date());

  // Load editing invoice data or preselected client
  useEffect(() => {
    if (editingInvoice) {
      setSelectedClientId(editingInvoice.clientId);
      setWorkDescription(editingInvoice.workDescription);
      setSelectedInterventionId(editingInvoice.interventionTypeId);
      setCustomInterventionDesc(editingInvoice.interventionDescription);
      setSelectedZones(editingInvoice.zones);
      setFrequency(editingInvoice.frequency);
      setFindings(editingInvoice.findings);
      setAmountHT(editingInvoice.amountHT.toString());
      setIncludeTva(editingInvoice.tvaRate > 0);
      setIsProForma(editingInvoice.isProForma !== false);
      setObservations(editingInvoice.observations || '');
      setInvoiceDate(new Date(editingInvoice.date));
    } else if (preselectedClientId) {
      setSelectedClientId(preselectedClientId);
    }
  }, [editingInvoice, preselectedClientId]);

  const resetForm = () => {
    setSelectedClientId('');
    setWorkDescription('');
    setSelectedInterventionId('');
    setCustomInterventionDesc('');
    setSelectedZones([]);
    setFrequency('');
    setFindings('');
    setAmountHT('');
    setIsProForma(true);
    setIncludeTva(true);
    setObservations('');
    setInvoiceDate(new Date());
  };

  const selectedIntervention = INTERVENTION_TYPES.find(t => t.id === selectedInterventionId);
  
  const tvaAmount = useMemo(() => {
    if (!includeTva) return 0;
    const ht = parseFloat(amountHT) || 0;
    return ht * (tvaRate / 100);
  }, [amountHT, tvaRate, includeTva]);

  const totalAmount = useMemo(() => {
    const ht = parseFloat(amountHT) || 0;
    return ht + tvaAmount;
  }, [amountHT, tvaAmount]);

  const handleAddNewClient = () => {
    if (newClientName.trim()) {
      onAddClient({ 
        name: newClientName.trim(),
        address: newClientAddress.trim() || undefined,
        phone: newClientPhone.trim() || undefined,
      });
      setNewClientName('');
      setNewClientAddress('');
      setNewClientPhone('');
      setShowNewClient(false);
    }
  };

  const handleAddZone = async () => {
    if (newZoneName.trim()) {
      const savedZone = await onAddZone({ name: newZoneName.trim() });
      if (savedZone) {
        setSelectedZones([...selectedZones, { id: savedZone.id, name: savedZone.name }]);
      }
      setNewZoneName('');
    }
  };

  const toggleZone = (zone: ZoneIntervention) => {
    if (selectedZones.find(z => z.id === zone.id)) {
      setSelectedZones(selectedZones.filter(z => z.id !== zone.id));
    } else {
      setSelectedZones([...selectedZones, zone]);
    }
  };

  const handleSubmit = () => {
    const client = clients.find(c => c.id === selectedClientId);
    if (!client || !selectedIntervention) return;

    const invoiceData = {
      date: invoiceDate,
      clientId: client.id,
      clientName: client.name,
      workDescription,
      interventionTypeId: selectedIntervention.id,
      interventionTypeName: selectedIntervention.name,
      interventionDescription: customInterventionDesc || selectedIntervention.description,
      zones: selectedZones,
      frequency,
      findings,
      observations,
      amountHT: parseFloat(amountHT) || 0,
      tvaRate: includeTva ? tvaRate : 0,
      tvaAmount,
      totalAmount,
      isProForma,
      status: editingInvoice?.status || 'pending',
    };

    if (editingInvoice && onUpdateInvoice) {
      onUpdateInvoice(editingInvoice.id, invoiceData);
      onCancelEdit?.();
    } else {
      onCreateInvoice(invoiceData);
    }
    
    resetForm();
  };

  const handleCancel = () => {
    resetForm();
    onCancelEdit?.();
  };

  const isValid = selectedClientId && selectedInterventionId && workDescription && parseFloat(amountHT) > 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {editingInvoice && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Mode édition</p>
                <p className="text-sm text-muted-foreground">
                  Modification de la facture {editingInvoice.invoiceNumber}
                </p>
              </div>
              <Button variant="outline" onClick={handleCancel}>
                <X className="w-4 h-4 mr-2" />
                Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Client Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Informations Client</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Client</Label>
              <div className="flex gap-2">
                <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Sélectionner un client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map(client => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={() => setShowNewClient(!showNewClient)}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Date de la facture</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !invoiceDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {invoiceDate ? format(invoiceDate, "d MMMM yyyy", { locale: fr }) : <span>Choisir une date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={invoiceDate}
                    onSelect={(date) => date && setInvoiceDate(date)}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {showNewClient && (
            <div className="flex flex-col gap-3 p-4 bg-secondary/50 rounded-lg">
              <div className="flex flex-col md:flex-row gap-2">
                <Input
                  placeholder="Nom du nouveau client"
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
              </div>
              <div className="flex gap-2 justify-end">
                <Button onClick={handleAddNewClient} disabled={!newClientName.trim()}>
                  Créer
                </Button>
                <Button variant="ghost" onClick={() => setShowNewClient(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Description du travail</Label>
            <Textarea
              placeholder="Ex: Le traitement chimique de votre usine sise à la Zone industrielle..."
              value={workDescription}
              onChange={(e) => setWorkDescription(e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Intervention Type */}
      <Card>
        <CardHeader>
          <CardTitle>Type d'Intervention</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={selectedInterventionId} onValueChange={(value) => {
              setSelectedInterventionId(value);
              const intervention = INTERVENTION_TYPES.find(t => t.id === value);
              if (intervention) {
                setCustomInterventionDesc(intervention.description);
              }
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un type d'intervention" />
              </SelectTrigger>
              <SelectContent>
                {INTERVENTION_TYPES.map(type => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedIntervention && (
            <div className="space-y-2">
              <Label>Description de l'intervention</Label>
              <Textarea
                value={customInterventionDesc}
                onChange={(e) => setCustomInterventionDesc(e.target.value)}
                rows={4}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Zones */}
      <Card>
        <CardHeader>
          <CardTitle>Zones d'Intervention</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {zones.map(zone => (
              <Button
                key={zone.id}
                variant={selectedZones.find(z => z.id === zone.id) ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleZone(zone)}
              >
                {zone.name}
              </Button>
            ))}
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Ajouter une nouvelle zone"
              value={newZoneName}
              onChange={(e) => setNewZoneName(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleAddZone} disabled={!newZoneName.trim()}>
              <Plus className="w-4 h-4 mr-2" />
              Ajouter
            </Button>
          </div>

          {selectedZones.length > 0 && (
            <div className="p-3 bg-secondary/50 rounded-lg">
              <p className="text-sm font-medium mb-2">Zones sélectionnées:</p>
              <div className="flex flex-wrap gap-2">
                {selectedZones.map(zone => (
                  <div key={zone.id} className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-md text-sm">
                    <span>{zone.name}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedZones(selectedZones.filter(z => z.id !== zone.id))}
                      className="ml-1 hover:bg-primary/20 rounded p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Frequency & Findings */}
      <Card>
        <CardHeader>
          <CardTitle>Détails de l'Intervention</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Fréquence d'intervention</Label>
            <Textarea
              placeholder="Ex: Le traitement chimique est ponctuel et demande un suivi de 07 jours."
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Constats</Label>
            <Textarea
              placeholder="Ex: Présence de Rat d'égout ou Surmulot : RATTUS NORVEGICUS et souris (NUS NUSCULUS)"
              value={findings}
              onChange={(e) => setFindings(e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Amounts */}
      <Card>
        <CardHeader>
          <CardTitle>Montants</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center gap-4 pb-2 border-b">
            <div className="flex items-center space-x-3">
              <Switch
                id="is-proforma"
                checked={isProForma}
                onCheckedChange={setIsProForma}
              />
              <Label htmlFor="is-proforma" className="cursor-pointer">
                Facture Pro Forma
              </Label>
            </div>
            <div className="flex items-center space-x-3">
              <Switch
                id="include-tva"
                checked={includeTva}
                onCheckedChange={setIncludeTva}
              />
              <Label htmlFor="include-tva" className="cursor-pointer">
                Appliquer la TVA ({tvaRate}%)
              </Label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Montant HT (FCFA)</Label>
              <Input
                type="number"
                placeholder="0"
                value={amountHT}
                onChange={(e) => setAmountHT(e.target.value)}
              />
            </div>

            {includeTva && (
              <div className="space-y-2">
                <Label>TVA ({tvaRate}%)</Label>
                <Input
                  type="text"
                  value={tvaAmount.toLocaleString('fr-FR')}
                  disabled
                  className="bg-muted"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>{includeTva ? 'Total TTC' : 'Total'} (FCFA)</Label>
              <Input
                type="text"
                value={totalAmount.toLocaleString('fr-FR')}
                disabled
                className="bg-primary/10 font-bold"
              />
            </div>
          </div>

          <div className="space-y-2 pt-4 border-t">
            <Label>Observations</Label>
            <Textarea
              placeholder="Observations supplémentaires..."
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Button 
        onClick={handleSubmit} 
        disabled={!isValid}
        className="w-full"
        size="lg"
      >
        {editingInvoice ? (
          <>
            <Save className="w-5 h-5 mr-2" />
            Enregistrer les modifications
          </>
        ) : (
          <>
            <FileText className="w-5 h-5 mr-2" />
            Créer la Facture
          </>
        )}
      </Button>
    </div>
  );
};

export default InvoiceForm;
