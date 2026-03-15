import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { InterventionType, INTERVENTION_TYPES } from '@/types';

export const useInterventionTypes = () => {
  const [customTypes, setCustomTypes] = useState<InterventionType[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchTypes = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('intervention_types')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching intervention types:', error);
    } else {
      setCustomTypes(
        (data || []).map((d) => ({
          id: d.id,
          name: d.name,
          description: d.description || '',
        }))
      );
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchTypes();
  }, [fetchTypes]);

  // Merge defaults + custom, defaults first
  const allTypes: InterventionType[] = [...INTERVENTION_TYPES, ...customTypes];

  const addType = useCallback(
    async (type: Omit<InterventionType, 'id'>): Promise<InterventionType | null> => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('intervention_types')
        .insert({
          user_id: user.id,
          name: type.name,
          description: type.description,
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
      };
      setCustomTypes((prev) => [...prev, newType]);
      toast.success(`Type d'intervention "${newType.name}" ajouté`);
      return newType;
    },
    [user]
  );

  return { interventionTypes: allTypes, loading, addType };
};
