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

  return { interventionTypes, loading, addType };
};
