import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { InterventionType } from '@/types';

export const useInterventionTypes = () => {
  const [interventionTypes, setInterventionTypes] = useState<InterventionType[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchTypes = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('intervention_types')
      .select('*')
      .order('is_default', { ascending: false })
      .order('name');

    if (error) {
      console.error('Error fetching intervention types:', error);
    } else {
      setInterventionTypes(
        (data || []).map((d) => ({
          id: d.id,
          name: d.name,
          description: d.description || '',
          standardPrice: Number(d.standard_price) || 0,
        }))
      );
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchTypes();
  }, [fetchTypes]);

  const addType = useCallback(
    async (type: Omit<InterventionType, 'id'>): Promise<InterventionType | null> => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('intervention_types')
        .insert({
          user_id: user.id,
          name: type.name,
          description: type.description,
          standard_price: type.standardPrice,
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding intervention type:', error);
        toast.error("Erreur lors de l'ajout du type d'intervention");
        return null;
      }

      const newType: InterventionType = {
        id: data.id,
        name: data.name,
        description: data.description || '',
        standardPrice: Number(data.standard_price) || 0,
      };
      setInterventionTypes((prev) => [...prev, newType]);
      toast.success(`Type d'intervention "${newType.name}" ajouté`);
      return newType;
    },
    [user]
  );

  const updateType = useCallback(
    async (id: string, data: Partial<InterventionType>) => {
      const { error } = await supabase
        .from('intervention_types')
        .update({
          ...(data.name !== undefined && { name: data.name }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.standardPrice !== undefined && { standard_price: data.standardPrice }),
        })
        .eq('id', id);

      if (error) {
        console.error('Error updating intervention type:', error);
        toast.error("Erreur lors de la mise à jour");
        return;
      }

      setInterventionTypes((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...data } : t))
      );
    },
    []
  );

  const deleteType = useCallback(
    async (id: string) => {
      const { error } = await supabase
        .from('intervention_types')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting intervention type:', error);
        toast.error("Erreur lors de la suppression");
        return;
      }

      setInterventionTypes((prev) => prev.filter((t) => t.id !== id));
      toast.success("Type d'intervention supprimé");
    },
    []
  );

  return { interventionTypes, loading, addType, updateType, deleteType };
};
