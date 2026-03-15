import { useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Save, X, Bug, MapPin, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { InterventionType, ZoneIntervention } from '@/types';

interface AdminPanelProps {
  interventionTypes: InterventionType[];
  zones: ZoneIntervention[];
  onAddInterventionType: (type: Omit<InterventionType, 'id'>) => Promise<InterventionType | null>;
  onUpdateInterventionType: (id: string, data: Partial<InterventionType>) => Promise<void>;
  onDeleteInterventionType: (id: string) => Promise<void>;
  onAddZone: (zone: Omit<ZoneIntervention, 'id'>) => Promise<ZoneIntervention | null>;
  onUpdateZone: (id: string, data: Partial<ZoneIntervention>) => Promise<void>;
  onDeleteZone: (id: string) => Promise<void>;
  onClose: () => void;
}

const AdminPanel = ({
  interventionTypes, zones,
  onAddInterventionType, onUpdateInterventionType, onDeleteInterventionType,
  onAddZone, onUpdateZone, onDeleteZone, onClose,
}: AdminPanelProps) => {
  // Intervention type form
  const [itName, setItName] = useState('');
  const [itDesc, setItDesc] = useState('');
  const [itPrice, setItPrice] = useState('');
  const [editingItId, setEditingItId] = useState<string | null>(null);

  // Zone form
  const [zoneName, setZoneName] = useState('');
  const [editingZoneId, setEditingZoneId] = useState<string | null>(null);

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const navigate = useNavigate();

  const resetItForm = () => { setItName(''); setItDesc(''); setItPrice(''); setEditingItId(null); };
  const resetZoneForm = () => { setZoneName(''); setEditingZoneId(null); };

  const handleSaveIt = useCallback(async () => {
    if (!itName.trim()) { toast.error('Le nom est requis'); return; }
    if (!itPrice || isNaN(Number(itPrice))) { toast.error('Le prix standard est requis'); return; }

    if (editingItId) {
      await onUpdateInterventionType(editingItId, {
        name: itName.trim(),
        description: itDesc.trim(),
        standardPrice: Number(itPrice),
      });
      toast.success('Type d\'intervention mis à jour');
    } else {
      await onAddInterventionType({
        name: itName.trim(),
        description: itDesc.trim(),
        standardPrice: Number(itPrice),
      });
    }
    resetItForm();
  }, [itName, itDesc, itPrice, editingItId, onAddInterventionType, onUpdateInterventionType]);

  const handleEditIt = (type: InterventionType) => {
    setItName(type.name);
    setItDesc(type.description);
    setItPrice(type.standardPrice.toString());
    setEditingItId(type.id);
  };

  const handleSaveZone = useCallback(async () => {
    if (!zoneName.trim()) { toast.error('Le nom est requis'); return; }

    if (editingZoneId) {
      await onUpdateZone(editingZoneId, { name: zoneName.trim() });
      toast.success('Zone mise à jour');
    } else {
      await onAddZone({ name: zoneName.trim() });
      toast.success('Zone ajoutée');
    }
    resetZoneForm();
  }, [zoneName, editingZoneId, onAddZone, onUpdateZone]);

  const handleEditZone = (zone: ZoneIntervention) => {
    setZoneName(zone.name);
    setEditingZoneId(zone.id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold text-foreground">Administration</h2>
        <Button variant="outline" onClick={onClose}>
          <X className="w-4 h-4 mr-2" /> Fermer
        </Button>
      </div>

      <Tabs defaultValue="interventions">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="interventions" className="flex items-center gap-2">
            <Bug className="w-4 h-4" /> Types d'intervention
          </TabsTrigger>
          <TabsTrigger value="zones" className="flex items-center gap-2">
            <MapPin className="w-4 h-4" /> Zones d'intervention
          </TabsTrigger>
        </TabsList>

        {/* Intervention Types Tab */}
        <TabsContent value="interventions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {editingItId ? 'Modifier le type d\'intervention' : 'Ajouter un type d\'intervention'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <Label>Nom *</Label>
                  <Input value={itName} onChange={e => setItName(e.target.value)} placeholder="Ex: Désinsectisation" />
                </div>
                <div>
                  <Label>Prix standard (FCFA) *</Label>
                  <Input type="number" value={itPrice} onChange={e => setItPrice(e.target.value)} placeholder="0" />
                </div>
                <div>
                  <Label>Description</Label>
                  <Input value={itDesc} onChange={e => setItDesc(e.target.value)} placeholder="Description..." />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSaveIt}>
                  <Save className="w-4 h-4 mr-2" />
                  {editingItId ? 'Mettre à jour' : 'Ajouter'}
                </Button>
                {editingItId && (
                  <Button variant="outline" onClick={resetItForm}>Annuler</Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Prix standard</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {interventionTypes.length === 0 && (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Aucun type d'intervention</TableCell></TableRow>
                  )}
                  {interventionTypes.map(type => (
                    <TableRow key={type.id}>
                      <TableCell className="font-medium">{type.name}</TableCell>
                      <TableCell className="text-muted-foreground">{type.description || '—'}</TableCell>
                      <TableCell className="text-right">{type.standardPrice.toLocaleString('fr-FR')} FCFA</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEditIt(type)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Supprimer "{type.name}" ?</AlertDialogTitle>
                                <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction onClick={() => onDeleteInterventionType(type.id)}>Supprimer</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Zones Tab */}
        <TabsContent value="zones" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {editingZoneId ? 'Modifier la zone' : 'Ajouter une zone'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-1">
                  <Label>Nom *</Label>
                  <Input value={zoneName} onChange={e => setZoneName(e.target.value)} placeholder="Ex: Entrepôt" />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSaveZone}>
                  <Save className="w-4 h-4 mr-2" />
                  {editingZoneId ? 'Mettre à jour' : 'Ajouter'}
                </Button>
                {editingZoneId && (
                  <Button variant="outline" onClick={resetZoneForm}>Annuler</Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {zones.length === 0 && (
                    <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground">Aucune zone</TableCell></TableRow>
                  )}
                  {zones.map(zone => (
                    <TableRow key={zone.id}>
                      <TableCell className="font-medium">{zone.name}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEditZone(zone)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Supprimer "{zone.name}" ?</AlertDialogTitle>
                                <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction onClick={() => onDeleteZone(zone.id)}>Supprimer</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPanel;
