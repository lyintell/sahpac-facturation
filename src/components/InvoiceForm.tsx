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
import { Client, Invoice, InvoiceIntervention, ZoneIntervention, InterventionType, DEFAULT_TVA_RATE } from '@/types';

type InterventionSelection = {
  id: string;
  description: string;
  amountHT: string;
};

const createEmptyInterventionSelection = (): InterventionSelection => ({
  id: '',
  description: '',
  amountHT: '',
});

const ensureInterventionSlots = (interventions: InterventionSelection[]) => {
  const selectedInterventions = interventions.filter((intervention) => intervention.id);

  return [...selectedInterventions, createEmptyInterventionSelection()];
};

interface InvoiceFormProps {
  clients: Client[];
  invoices: Invoice[];
  zones: ZoneIntervention[];
  interventionTypes: InterventionType[];
  editingInvoice?: Invoice | null;
  preselectedClientId?: string | null;
  onAddClient: (client: Omit<Client, 'id' | 'createdAt'>) => void;
  onAddZone: (zone: Omit<ZoneIntervention, 'id'>) => Promise<ZoneIntervention | null>;
  onAddInterventionType: (type: Omit<InterventionType, 'id'>) => Promise<InterventionType | null>;
  onCreateInvoice: (invoice: Omit<Invoice, 'id' | 'createdAt' | 'invoiceNumber'>) => void;
  onUpdateInvoice?: (id: string, data: Partial<Invoice>) => void;
  onCancelEdit?: () => void;
}

const InvoiceForm = ({ clients, invoices, zones, interventionTypes, editingInvoice, preselectedClientId, onAddClient, onAddZone, onAddInterventionType, onCreateInvoice, onUpdateInvoice, onCancelEdit }: InvoiceFormProps) => {
  const [selectedClientId, setSelectedClientId] = useState('');
  const [newClientName, setNewClientName] = useState('');
  const [newClientAddress, setNewClientAddress] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [showNewClient, setShowNewClient] = useState(false);
  
  const [workDescription, setWorkDescription] = useState('');
  const [selectedInterventions, setSelectedInterventions] = useState<InterventionSelection[]>([createEmptyInterventionSelection()]);
  const [showNewIntervention, setShowNewIntervention] = useState(false);
  const [newInterventionTargetIndex, setNewInterventionTargetIndex] = useState<number | null>(null);
  const [newInterventionName, setNewInterventionName] = useState('');
  const [newInterventionDesc, setNewInterventionDesc] = useState('');
  const [newInterventionPrice, setNewInterventionPrice] = useState('');
  
  const [selectedZones, setSelectedZones] = useState<ZoneIntervention[]>([]);
  const [newZoneName, setNewZoneName] = useState('');
  
  const [frequency, setFrequency] = useState('');
  const [findings, setFindings] = useState('');
  
  const [amountHT, setAmountHT] = useState('');
  const [tvaRate] = useState(DEFAULT_TVA_RATE);
  const [includeTva, setIncludeTva] = useState(false);
  const [separateTotalsByInterventionType, setSeparateTotalsByInterventionType] = useState(false);
  const [isProForma, setIsProForma] = useState(true);
  const [observations, setObservations] = useState('');
  const [invoiceDate, setInvoiceDate] = useState<Date>(new Date());
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [isAmountManuallyEdited, setIsAmountManuallyEdited] = useState(false);

  // Load editing invoice data or preselected client
  useEffect(() => {
    if (editingInvoice) {
      const invoiceInterventions = editingInvoice.interventions && editingInvoice.interventions.length > 0
        ? editingInvoice.interventions
        : [{
            id: editingInvoice.interventionTypeId,
            name: editingInvoice.interventionTypeName,
            description: editingInvoice.interventionDescription,
            standardPrice: editingInvoice.amountHT,
          }];
      setSelectedClientId(editingInvoice.clientId);
      setWorkDescription(editingInvoice.workDescription);
      setSelectedInterventions(
        ensureInterventionSlots(
          invoiceInterventions.map((intervention) => ({
            id: intervention.id,
            description: intervention.description,
            amountHT: (() => {
              const lineAmount = intervention.amountHT ?? intervention.standardPrice ?? 0;
              if (lineAmount) {
                return lineAmount.toString();
              }
              if (invoiceInterventions.length === 1 && editingInvoice.amountHT) {
                return editingInvoice.amountHT.toString();
              }
              return '';
            })(),
          }))
        )
      );
      setSelectedZones(editingInvoice.zones);
      setFrequency(editingInvoice.frequency);
      setFindings(editingInvoice.findings);
      setAmountHT(editingInvoice.amountHT ? editingInvoice.amountHT.toString() : '');
      setSeparateTotalsByInterventionType(editingInvoice.separateTotalsByInterventionType === true);
      setIsAmountManuallyEdited(true);
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
    setSelectedInterventions([createEmptyInterventionSelection()]);
    setSelectedZones([]);
    setFrequency('');
    setFindings('');
    setAmountHT('');
    setSeparateTotalsByInterventionType(false);
    setIsAmountManuallyEdited(false);
    setIsProForma(true);
    setIncludeTva(true);
    setObservations('');
    setInvoiceDate(new Date());
  };

  const activeInterventions = useMemo<InvoiceIntervention[]>(() => {
    return selectedInterventions
      .filter((intervention) => intervention.id)
      .map((intervention) => {
        const interventionType = interventionTypes.find((type) => type.id === intervention.id);

        return {
          id: intervention.id,
          name: interventionType?.name || '',
          description: intervention.description || interventionType?.description || '',
          standardPrice: interventionType?.standardPrice || 0,
          amountHT: intervention.amountHT.trim() !== ''
            ? Number(intervention.amountHT) || 0
            : interventionType?.standardPrice || 0,
        };
      })
      .filter((intervention) => intervention.name);
  }, [selectedInterventions, interventionTypes]);
  const defaultAmountHT = useMemo(() => {
    return activeInterventions.reduce((total, intervention) => total + intervention.standardPrice, 0);
  }, [activeInterventions]);
  const separatedAmountHT = useMemo(() => {
    return activeInterventions.reduce((total, intervention) => total + (intervention.amountHT || 0), 0);
  }, [activeInterventions]);
  const recentZones = useMemo(() => {
    if (zones.length === 0) {
      return [];
    }

    const selectedZoneIds = new Set(selectedZones.map(zone => zone.id));
    const zonesById = new Map(zones.map(zone => [zone.id, zone]));
    const recentZoneMap = new Map<string, ZoneIntervention>();
    const sortedInvoices = [...invoices].sort(
      (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
    );

    for (const invoice of sortedInvoices) {
      for (const invoiceZone of invoice.zones) {
        const zone = zonesById.get(invoiceZone.id);

        if (!zone || selectedZoneIds.has(zone.id) || recentZoneMap.has(zone.id)) {
          continue;
        }

        recentZoneMap.set(zone.id, zone);

        if (recentZoneMap.size === 5) {
          return Array.from(recentZoneMap.values());
        }
      }
    }

    return Array.from(recentZoneMap.values());
  }, [invoices, selectedZones, zones]);

  useEffect(() => {
    if (editingInvoice) {
      return;
    }

    if (!separateTotalsByInterventionType && !isAmountManuallyEdited) {
      setAmountHT(defaultAmountHT > 0 ? defaultAmountHT.toString() : '');
    }
  }, [editingInvoice, defaultAmountHT, isAmountManuallyEdited, separateTotalsByInterventionType]);

  useEffect(() => {
    if (!separateTotalsByInterventionType) {
      return;
    }

    if (separatedAmountHT > 0) {
      setAmountHT(separatedAmountHT.toString());
    } else if (!editingInvoice) {
      setAmountHT('');
    }
  }, [editingInvoice, separateTotalsByInterventionType, separatedAmountHT]);

  useEffect(() => {
    if (activeInterventions.length <= 1 && separateTotalsByInterventionType) {
      setSeparateTotalsByInterventionType(false);
    }
  }, [activeInterventions.length, separateTotalsByInterventionType]);

  const handleSelectIntervention = (index: number, value: string) => {
    const interventionType = interventionTypes.find((type) => type.id === value);

    setSelectedInterventions((currentInterventions) => {
      const nextInterventions = [...currentInterventions];
      nextInterventions[index] = {
        id: value,
        description: interventionType?.description || '',
        amountHT: (interventionType?.standardPrice || 0).toString(),
      };

      return ensureInterventionSlots(nextInterventions);
    });
  };

  const handleInterventionDescriptionChange = (index: number, description: string) => {
    setSelectedInterventions((currentInterventions) => {
      const nextInterventions = [...currentInterventions];
      nextInterventions[index] = {
        ...nextInterventions[index],
        description,
      };

      return nextInterventions;
    });
  };

  const handleRemoveIntervention = (index: number) => {
    setSelectedInterventions((currentInterventions) => {
      const nextInterventions = currentInterventions.filter((_, currentIndex) => currentIndex !== index);

      return ensureInterventionSlots(nextInterventions);
    });
  };

  const handleInterventionAmountChange = (index: number, nextAmount: string) => {
    setSelectedInterventions((currentInterventions) => {
      const nextInterventions = [...currentInterventions];
      nextInterventions[index] = {
        ...nextInterventions[index],
        amountHT: nextAmount,
      };

      return nextInterventions;
    });
  };

  const handleToggleSeparateTotals = (checked: boolean) => {
    setSeparateTotalsByInterventionType(checked);

    if (checked) {
      setAmountHT(separatedAmountHT > 0 ? separatedAmountHT.toString() : '');
      return;
    }

    setAmountHT(separatedAmountHT > 0 ? separatedAmountHT.toString() : '');
    setIsAmountManuallyEdited(true);
  };
  
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
    if (!client || activeInterventions.length === 0) return;

    const invoiceData = {
      date: invoiceDate,
      clientId: client.id,
      clientName: client.name,
      workDescription,
      interventionTypeId: activeInterventions[0].id,
      interventionTypeName: activeInterventions.map((intervention) => intervention.name).join(' + '),
      interventionDescription: activeInterventions.length === 1
        ? activeInterventions[0].description
        : activeInterventions.map((intervention) => `${intervention.name}: ${intervention.description}`).join('\n'),
      interventions: activeInterventions,
      separateTotalsByInterventionType,
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
      paidAmount: editingInvoice?.paidAmount || 0,
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

  const isValid = selectedClientId && activeInterventions.length > 0 && workDescription && parseFloat(amountHT) > 0;

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
              <Select value={selectedClientId} onValueChange={(value) => {
                if (value === '__new_client__') {
                  setShowNewClient(true);
                  setSelectedClientId('');
                } else {
                  setSelectedClientId(value);
                  setShowNewClient(false);
                }
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un client" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__new_client__" className="font-bold text-orange-500 focus:text-orange-500">
                    NOUVEAU CLIENT
                  </SelectItem>
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date de la facture</Label>
              <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
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
                    onSelect={(date) => {
                      if (date) {
                        setInvoiceDate(date);
                        setDatePickerOpen(false);
                      }
                    }}
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
          {selectedInterventions.map((selection, index) => {
            const selectedInterventionIds = new Set(
              selectedInterventions
                .filter((intervention) => intervention.id)
                .map((intervention) => intervention.id)
            );
            const selectedType = interventionTypes.find((type) => type.id === selection.id);
            const canRemoveIntervention = selectedInterventions.filter((intervention) => intervention.id).length > 1 && !!selection.id;

            return (
              <div key={`${selection.id || 'new'}-${index}`} className="space-y-3">
                <div className="space-y-2">
                  <Label>{index === 0 ? "Type" : `Type ${index + 1}`}</Label>
                  <div className="flex gap-2">
                    <Select
                      value={selection.id}
                      onValueChange={(value) => {
                        if (value === '__new_intervention__') {
                          setNewInterventionTargetIndex(index);
                          setShowNewIntervention(true);
                          return;
                        }

                        handleSelectIntervention(index, value);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un type d'intervention" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__new_intervention__" className="font-bold text-orange-500 focus:text-orange-500">
                          NOUVEAU TYPE D'INTERVENTION
                        </SelectItem>
                        {interventionTypes
                          .filter((type) => !selectedInterventionIds.has(type.id) || type.id === selection.id)
                          .map((type) => (
                            <SelectItem key={type.id} value={type.id}>
                              {type.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    {canRemoveIntervention && (
                      <Button type="button" variant="outline" size="icon" onClick={() => handleRemoveIntervention(index)}>
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {selection.id && selectedType && (
                  <div className="space-y-2 rounded-lg bg-secondary/40 p-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-muted-foreground">Prix standard</span>
                      <span className="font-semibold">{selectedType.standardPrice.toLocaleString('fr-FR')} FCFA</span>
                    </div>
                    <div className="space-y-2">
                      <Label>Description de l'intervention</Label>
                      <Textarea
                        value={selection.description}
                        onChange={(e) => handleInterventionDescriptionChange(index, e.target.value)}
                        rows={3}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {showNewIntervention && (
            <div className="flex flex-col gap-3 p-4 bg-secondary/50 rounded-lg">
              <Input
                placeholder="Nom du type d'intervention"
                value={newInterventionName}
                onChange={(e) => setNewInterventionName(e.target.value)}
              />
              <Textarea
                placeholder="Description de l'intervention"
                value={newInterventionDesc}
                onChange={(e) => setNewInterventionDesc(e.target.value)}
                rows={3}
              />
              <div className="space-y-1">
                <Label>Prix standard (FCFA)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={newInterventionPrice}
                  onChange={(e) => setNewInterventionPrice(e.target.value)}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  onClick={async () => {
                    if (newInterventionName.trim() && newInterventionPrice.trim() && newInterventionTargetIndex !== null) {
                      const saved = await onAddInterventionType({
                        name: newInterventionName.trim(),
                        description: newInterventionDesc.trim(),
                        standardPrice: parseFloat(newInterventionPrice) || 0,
                      });
                      if (saved) {
                        handleSelectIntervention(newInterventionTargetIndex, saved.id);
                        setShowNewIntervention(false);
                        setNewInterventionTargetIndex(null);
                        setNewInterventionName('');
                        setNewInterventionDesc('');
                        setNewInterventionPrice('');
                      }
                    }
                  }}
                  disabled={!newInterventionName.trim() || !newInterventionPrice.trim()}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Enregistrer
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowNewIntervention(false);
                    setNewInterventionTargetIndex(null);
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
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
          <div className="space-y-2">
            <Label>Rechercher ou ajouter une zone</Label>
            <div className="relative">
              <Input
                placeholder="Tapez pour rechercher ou ajouter une zone..."
                value={newZoneName}
                onChange={(e) => setNewZoneName(e.target.value)}
                className="w-full"
              />
              {newZoneName.trim() && (
                <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-md shadow-lg max-h-48 overflow-auto">
                  {zones
                    .filter(zone => 
                      zone.name.toLowerCase().startsWith(newZoneName.toLowerCase()) ||
                      zone.name.toLowerCase().includes(newZoneName.toLowerCase())
                    )
                    .filter(zone => !selectedZones.find(z => z.id === zone.id))
                    .map(zone => (
                      <button
                        key={zone.id}
                        type="button"
                        className="w-full px-3 py-2 text-left hover:bg-secondary transition-colors text-sm"
                        onClick={() => {
                          toggleZone(zone);
                          setNewZoneName('');
                        }}
                      >
                        {zone.name}
                      </button>
                    ))
                  }
                  {!zones.some(zone => 
                    zone.name.toLowerCase() === newZoneName.trim().toLowerCase()
                  ) && (
                    <button
                      type="button"
                      className="w-full px-3 py-2 text-left hover:bg-secondary transition-colors text-sm flex items-center gap-2 text-primary font-medium border-t border-border"
                      onClick={handleAddZone}
                    >
                      <Plus className="w-4 h-4" />
                      Ajouter "{newZoneName.trim()}"
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {recentZones.length > 0 && !newZoneName.trim() && (
            <div className="flex flex-wrap gap-2">
              {recentZones.map(zone => (
                  <Button
                    key={zone.id}
                    variant="outline"
                    size="sm"
                    onClick={() => toggleZone(zone)}
                  >
                    {zone.name}
                  </Button>
                ))}
            </div>
          )}

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
            {activeInterventions.length > 1 && (
              <div className="flex items-center space-x-3">
                <Switch
                  id="split-intervention-totals"
                  checked={separateTotalsByInterventionType}
                  onCheckedChange={handleToggleSeparateTotals}
                />
                <Label htmlFor="split-intervention-totals" className="cursor-pointer">
                  Total par type d'intervention
                </Label>
              </div>
            )}
          </div>

          {separateTotalsByInterventionType && activeInterventions.length > 1 && (
            <div className="space-y-3 rounded-lg bg-secondary/40 p-4">
              <p className="text-sm font-medium text-muted-foreground">
                Définissez le montant HT de chaque type. Le montant global sera recalculé automatiquement.
              </p>
              <div className="space-y-3">
                {activeInterventions.map((intervention, index) => (
                  <div key={`${intervention.id}-${index}`} className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-3 items-end">
                    <div>
                      <p className="font-medium text-primary">{intervention.name}</p>
                      <p className="text-sm text-muted-foreground">Prix standard: {intervention.standardPrice.toLocaleString('fr-FR')} FCFA</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Total HT</Label>
                      <Input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={selectedInterventions[index]?.amountHT || ''}
                        onChange={(e) => handleInterventionAmountChange(index, e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>{separateTotalsByInterventionType ? 'Montant HT global (FCFA)' : 'Montant HT (FCFA)'}</Label>
              <Input
                type="number"
                placeholder="0"
                value={amountHT}
                disabled={separateTotalsByInterventionType}
                className={separateTotalsByInterventionType ? 'bg-muted font-medium' : undefined}
                onChange={(e) => {
                  setAmountHT(e.target.value);
                  setIsAmountManuallyEdited(true);
                }}
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
