import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface Client {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  created_at?: string;
}

export const useClients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchClients = useCallback(async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Error fetching clients:', error);
      toast.error('Erreur lors du chargement des clients');
    } else {
      setClients(data || []);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const addClient = useCallback(async (clientData: Omit<Client, 'id' | 'created_at'>) => {
    if (!user) return null;
    
    const { data, error } = await supabase
      .from('clients')
      .insert({ ...clientData, user_id: user.id })
      .select()
      .single();
    
    if (error) {
      console.error('Error adding client:', error);
      toast.error('Erreur lors de l\'ajout du client');
      return null;
    }
    
    setClients(prev => [...prev, data]);
    toast.success(`Client "${clientData.name}" ajouté avec succès`);
    return data;
  }, [user]);

  const updateClient = useCallback(async (id: string, clientData: Partial<Client>) => {
    const { error } = await supabase
      .from('clients')
      .update(clientData)
      .eq('id', id);
    
    if (error) {
      console.error('Error updating client:', error);
      toast.error('Erreur lors de la mise à jour du client');
      return;
    }
    
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...clientData } : c));
    toast.success('Client mis à jour');
  }, []);

  const deleteClient = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting client:', error);
      toast.error('Erreur lors de la suppression du client');
      return;
    }
    
    setClients(prev => prev.filter(c => c.id !== id));
    toast.success('Client supprimé');
  }, []);

  return { clients, loading, addClient, updateClient, deleteClient, refetch: fetchClients };
};
