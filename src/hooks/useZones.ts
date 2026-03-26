import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface Zone {
  id: string;
  name: string;
  created_at?: string;
}

export const useZones = () => {
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchZones = useCallback(async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('zones')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Error fetching zones:', error);
      toast.error('Erreur lors du chargement des zones');
    } else {
      setZones(data || []);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchZones();
  }, [fetchZones]);

  const addZone = useCallback(async (zone: { name: string }) => {
    if (!user) return null;
    
    const { data, error } = await supabase
      .from('zones')
      .insert({ ...zone, user_id: user.id })
      .select()
      .single();
    
    if (error) {
      console.error('Error adding zone:', error);
      toast.error('Erreur lors de l\'ajout de la zone');
      return null;
    }
    
    setZones(prev => [...prev, data]);
    return data;
  }, [user]);

  const updateZone = useCallback(async (id: string, data: Partial<{ name: string }>) => {
    const { error } = await supabase
      .from('zones')
      .update(data)
      .eq('id', id);
    
    if (error) {
      console.error('Error updating zone:', error);
      toast.error('Erreur lors de la mise à jour de la zone');
      return;
    }
    
    setZones(prev => prev.map(z => z.id === id ? { ...z, ...data } : z));
  }, []);

  const deleteZone = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('zones')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting zone:', error);
      toast.error('Erreur lors de la suppression de la zone');
      return;
    }
    
    setZones(prev => prev.filter(z => z.id !== id));
  }, []);

  return { zones, loading, addZone, updateZone, deleteZone, refetch: fetchZones };
};
