import { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function ProtocolSearch() {
  const [protocol, setProtocol] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!protocol.trim()) {
      toast.error('Digite um protocolo');
      return;
    }
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('id')
        .eq('protocol', protocol.trim().toUpperCase())
        .maybeSingle();
      
      if (error) throw error;
      
      if (data) {
        navigate(`/denuncia/${data.id}`);
      } else {
        toast.error('Protocolo não encontrado');
      }
    } catch (error) {
      console.error('Error searching protocol:', error);
      toast.error('Erro ao buscar protocolo');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSearch} className="flex gap-2">
      <Input
        placeholder="Buscar por protocolo..."
        value={protocol}
        onChange={(e) => setProtocol(e.target.value.toUpperCase())}
        className="input-accessible flex-1"
        maxLength={12}
      />
      <Button type="submit" disabled={loading} className="btn-touch">
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Search className="h-5 w-5" />
        )}
      </Button>
    </form>
  );
}
