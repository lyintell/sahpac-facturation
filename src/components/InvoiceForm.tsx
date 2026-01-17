import { useState, useMemo } from 'react';
import { Plus, X, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Client, Invoice, ZoneIntervention, INTERVENTION_TYPES, DEFAULT_TVA_RATE } from '@/types';

interface InvoiceFormProps {
  clients: Client[];
  zones: ZoneIntervention[];
  onAddClient: (client: Omit<Client, 'id' | 'createdAt'>) => void;
  onAddZone: (zone: Omit<ZoneIntervention, 'id'>) => void;
  onCreateInvoice: (invoice: Omit<Invoice, 'id' | 'createdAt' | 'invoiceNumber'>) => void;
}

const InvoiceForm = ({ clients, zones, onAddClient, onAddZone, onCreateInvoice }: InvoiceFormProps) => {
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

  const handleAddZone = () => {
    if (newZoneName.trim()) {
      const newZone: ZoneIntervention = {
        id: Date.now().toString(),
        name: newZoneName.trim()
      };
      onAddZone(newZone);
      setSelectedZones([...selectedZones, newZone]);
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

    const invoice: Omit<Invoice, 'id' | 'createdAt' | 'invoiceNumber'> = {
      date: new Date(),
      clientId: client.id,
      clientName: client.name,
      workDescription,
      interventionTypeId: selectedIntervention.id,
      interventionTypeName: selectedIntervention.name,
      interventionDescription: customInterventionDesc || selectedIntervention.description,
      zones: selectedZones,
      frequency,
      findings,
      amountHT: parseFloat(amountHT) || 0,
      tvaRate: includeTva ? tvaRate : 0,
      tvaAmount,
      totalAmount,
      isProForma,
    };

    onCreateInvoice(invoice);
    
    // Reset form
    setSelectedClientId('');
    setWorkDescription('');
    setSelectedInterventionId('');
    setCustomInterventionDesc('');
    setSelectedZones([]);
    setFrequency('');
    setFindings('');
    setAmountHT('');
  };

  const isValid = selectedClientId && selectedInterventionId && workDescription && parseFloat(amountHT) > 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Client Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Informations Client</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
              <ul className="list-disc list-inside text-sm text-muted-foreground">
                {selectedZones.map(zone => (
                  <li key={zone.id}>{zone.name}</li>
                ))}
              </ul>
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
        </CardContent>
      </Card>

      <Button 
        onClick={handleSubmit} 
        disabled={!isValid}
        className="w-full"
        size="lg"
      >
        <FileText className="w-5 h-5 mr-2" />
        Créer la Facture
      </Button>
    </div>
  );
};

export default InvoiceForm;
