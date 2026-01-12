import { useState } from 'react';
import { Plus, Trash2, Edit2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Client } from '@/types';

interface ClientManagerProps {
  clients: Client[];
  onAddClient: (client: Omit<Client, 'id' | 'createdAt'>) => void;
  onDeleteClient: (id: string) => void;
  onUpdateClient: (id: string, client: Partial<Client>) => void;
}

const ClientManager = ({ clients, onAddClient, onDeleteClient, onUpdateClient }: ClientManagerProps) => {
  const [newClientName, setNewClientName] = useState('');
  const [newClientAddress, setNewClientAddress] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [deleteClient, setDeleteClient] = useState<Client | null>(null);

  const handleAddClient = () => {
    if (newClientName.trim()) {
      onAddClient({
        name: newClientName.trim(),
        address: newClientAddress.trim() || undefined,
      });
      setNewClientName('');
      setNewClientAddress('');
    }
  };

  const startEdit = (client: Client) => {
    setEditingId(client.id);
    setEditName(client.name);
    setEditAddress(client.address || '');
  };

  const saveEdit = () => {
    if (editingId && editName.trim()) {
      onUpdateClient(editingId, {
        name: editName.trim(),
        address: editAddress.trim() || undefined,
      });
      setEditingId(null);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleConfirmDelete = () => {
    if (deleteClient) {
      onDeleteClient(deleteClient.id);
      setDeleteClient(null);
    }
  };

  return (
    <>
      <div className="space-y-6 animate-fade-in">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Ajouter un Client
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <Input
                placeholder="Nom du client"
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
              <Button onClick={handleAddClient} disabled={!newClientName.trim()}>
                <Plus className="w-4 h-4 mr-2" />
                Ajouter
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Liste des Clients ({clients.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {clients.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Aucun client enregistré. Ajoutez votre premier client ci-dessus.
              </p>
            ) : (
              <div className="space-y-2">
                {clients.map((client) => (
                  <div
                    key={client.id}
                    className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors"
                  >
                    {editingId === client.id ? (
                      <div className="flex-1 flex flex-col md:flex-row gap-2 mr-4">
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder="Nom"
                          className="flex-1"
                        />
                        <Input
                          value={editAddress}
                          onChange={(e) => setEditAddress(e.target.value)}
                          placeholder="Adresse"
                          className="flex-1"
                        />
                      </div>
                    ) : (
                      <div className="flex-1">
                        <p className="font-medium">{client.name}</p>
                        {client.address && (
                          <p className="text-sm text-muted-foreground">{client.address}</p>
                        )}
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      {editingId === client.id ? (
                        <>
                          <Button size="sm" variant="ghost" onClick={saveEdit}>
                            <Save className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={cancelEdit}>
                            <X className="w-4 h-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button size="sm" variant="ghost" onClick={() => startEdit(client)}>
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeleteClient(client)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={!!deleteClient} onOpenChange={(open) => !open && setDeleteClient(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le client <strong>{deleteClient?.name}</strong> ?
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
    </>
  );
};

export default ClientManager;
