import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getDeviceId } from '@/lib/device';
import { generateProtocol } from '@/lib/protocol';
import type { CategoryKey, StatusKey } from '@/lib/constants';

export interface Report {
  id: string;
  protocol: string;
  uf: string;
  city: string;
  category: CategoryKey;
  title: string | null;
  description: string;
  occurred_at: string;
  address_text: string | null;
  lat: number | null;
  lng: number | null;
  is_anonymous: boolean;
  author_name: string | null;
  author_contact: string | null;
  show_name_publicly: boolean;
  created_at: string;
  status: StatusKey;
  confirmations_count: number;
  flags_count: number;
}

export interface Evidence {
  id: string;
  report_id: string;
  file_url: string;
  file_type: string;
  file_name: string;
  created_at: string;
}

interface CreateReportInput {
  uf: string;
  city: string;
  category: CategoryKey;
  title?: string;
  description: string;
  occurred_at: string;
  address_text?: string;
  lat?: number;
  lng?: number;
  is_anonymous: boolean;
  author_name?: string;
  author_contact?: string;
  show_name_publicly?: boolean;
}

export function useReports(uf: string | null, city: string | null, category?: CategoryKey | null) {
  return useQuery({
    queryKey: ['reports', uf, city, category],
    queryFn: async () => {
      if (!uf || !city) return [];
      
      let query = supabase
        .from('reports')
        .select('*')
        .eq('uf', uf)
        .eq('city', city)
        .neq('status', 'SOB_REVISAO')
        .order('created_at', { ascending: false });
      
      if (category) {
        query = query.eq('category', category);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as Report[];
    },
    enabled: !!uf && !!city,
  });
}

export function useReport(id: string | null) {
  return useQuery({
    queryKey: ['report', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as Report;
    },
    enabled: !!id,
  });
}

export function useReportByProtocol(protocol: string | null) {
  return useQuery({
    queryKey: ['report-protocol', protocol],
    queryFn: async () => {
      if (!protocol) return null;
      
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('protocol', protocol)
        .single();
      
      if (error) throw error;
      return data as Report;
    },
    enabled: !!protocol,
  });
}

export function useReportEvidences(reportId: string | null) {
  return useQuery({
    queryKey: ['evidences', reportId],
    queryFn: async () => {
      if (!reportId) return [];
      
      const { data, error } = await supabase
        .from('evidences')
        .select('*')
        .eq('report_id', reportId)
        .order('created_at');
      
      if (error) throw error;
      return data as Evidence[];
    },
    enabled: !!reportId,
  });
}

export function useCreateReport() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: CreateReportInput) => {
      const protocol = generateProtocol();
      const deviceId = getDeviceId();
      
      const { data, error } = await supabase
        .from('reports')
        .insert({
          protocol,
          device_id: deviceId,
          uf: input.uf,
          city: input.city,
          category: input.category,
          title: input.title || null,
          description: input.description,
          occurred_at: input.occurred_at,
          address_text: input.address_text || null,
          lat: input.lat || null,
          lng: input.lng || null,
          is_anonymous: input.is_anonymous,
          author_name: input.author_name || null,
          author_contact: input.author_contact || null,
          show_name_publicly: input.show_name_publicly || false,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as Report;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['reports', data.uf, data.city] });
    },
  });
}

export function useUploadEvidence() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ reportId, file }: { reportId: string; file: File }) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${reportId}/${crypto.randomUUID()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('evidences')
        .upload(fileName, file);
      
      if (uploadError) throw uploadError;
      
      const { data: urlData } = supabase.storage
        .from('evidences')
        .getPublicUrl(fileName);
      
      const { data, error } = await supabase
        .from('evidences')
        .insert({
          report_id: reportId,
          file_url: urlData.publicUrl,
          file_type: file.type,
          file_name: file.name,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as Evidence;
    },
    onSuccess: (_, { reportId }) => {
      queryClient.invalidateQueries({ queryKey: ['evidences', reportId] });
    },
  });
}

export function useConfirmReport() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (reportId: string) => {
      const deviceId = getDeviceId();
      
      const { data, error } = await supabase
        .from('confirmations')
        .insert({
          report_id: reportId,
          device_or_user_id: deviceId,
        })
        .select()
        .single();
      
      if (error) {
        if (error.code === '23505') {
          throw new Error('Você já confirmou esta denúncia');
        }
        throw error;
      }
      
      return data;
    },
    onSuccess: (_, reportId) => {
      queryClient.invalidateQueries({ queryKey: ['report', reportId] });
    },
  });
}

export function useFlagReport() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ reportId, reason }: { reportId: string; reason: string }) => {
      const deviceId = getDeviceId();
      
      const { data, error } = await supabase
        .from('moderation_flags')
        .insert({
          report_id: reportId,
          reason,
          device_or_user_id: deviceId,
        })
        .select()
        .single();
      
      if (error) {
        if (error.code === '23505') {
          throw new Error('Você já reportou esta denúncia');
        }
        throw error;
      }
      
      return data;
    },
    onSuccess: (_, { reportId }) => {
      queryClient.invalidateQueries({ queryKey: ['report', reportId] });
    },
  });
}
