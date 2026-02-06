import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Mail, Phone, Building2, ArrowLeft, User, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

interface Person {
  id: string;
  full_name: string;
  party: string | null;
  photo_url: string | null;
}

interface Mandate {
  id: string;
  status: string;
  confidence: string;
  person: Person;
  office: { name: string };
  location: { name: string; uf: string };
}

interface Contact {
  email: string | null;
  phone: string | null;
}

export default function AtlasFederal() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('senadores');

  // Fetch federal mandates
  const { data: mandates, isLoading } = useQuery({
    queryKey: ['atlas-federal-mandates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('atlas_mandates')
        .select(`
          id,
          status,
          confidence,
          person:atlas_people(id, full_name, party, photo_url),
          office:atlas_offices(name),
          location:atlas_locations(name, uf)
        `)
        .eq('office.level', 'FEDERAL');

      if (error) throw error;
      return (data || []) as unknown as Mandate[];
    },
  });

  // Fetch contacts for all people
  const { data: contacts } = useQuery({
    queryKey: ['atlas-federal-contacts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('atlas_contacts')
        .select('person_id, email, phone');

      if (error) throw error;
      
      const contactMap = new Map<string, Contact>();
      data?.forEach(c => {
        contactMap.set(c.person_id, { email: c.email, phone: c.phone });
      });
      return contactMap;
    },
  });

  // Filter mandates
  const filteredMandates = mandates?.filter(m => {
    const matchesSearch = m.person?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.person?.party?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.location?.uf?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTab = 
      (activeTab === 'senadores' && m.office?.name === 'Senador') ||
      (activeTab === 'deputados' && m.office?.name === 'Deputado Federal') ||
      (activeTab === 'executivo' && (m.office?.name?.includes('Presidente') || m.office?.name?.includes('Ministro')));

    return matchesSearch && matchesTab;
  }) || [];

  // Group by state for senators/deputies
  const groupedByState = filteredMandates.reduce((acc, m) => {
    const uf = m.location?.uf || 'BR';
    if (!acc[uf]) acc[uf] = [];
    acc[uf].push(m);
    return acc;
  }, {} as Record<string, Mandate[]>);

  const sortedStates = Object.keys(groupedByState).sort();

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="bg-gradient-to-br from-green-500/20 via-green-500/10 to-transparent pt-12 pb-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to="/atlas" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Governo Federal</h1>
              <p className="text-muted-foreground">
                Presidente, Senadores e Deputados Federais
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 -mt-4 max-w-4xl mx-auto space-y-6">
        {/* Search */}
        <Card>
          <CardContent className="pt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, partido ou estado..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="senadores">Senadores</TabsTrigger>
            <TabsTrigger value="deputados">Deputados</TabsTrigger>
            <TabsTrigger value="executivo">Executivo</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <Card key={i}>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-4">
                        <Skeleton className="h-14 w-14 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-48" />
                          <Skeleton className="h-3 w-32" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredMandates.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum político encontrado</p>
                  <p className="text-sm mt-1">Execute a coleta de dados federais para popular o sistema</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {sortedStates.map(uf => (
                  <div key={uf}>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="outline" className="font-semibold">
                        {uf}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {groupedByState[uf].length} {groupedByState[uf].length === 1 ? 'político' : 'políticos'}
                      </span>
                    </div>
                    
                    <div className="grid gap-3">
                      {groupedByState[uf].map(mandate => {
                        const contact = contacts?.get(mandate.person?.id);
                        
                        return (
                          <Card key={mandate.id} className="overflow-hidden">
                            <CardContent className="p-4">
                              <div className="flex items-start gap-4">
                                <Avatar className="h-14 w-14 border-2 border-background ring-2 ring-primary/20">
                                  <AvatarImage src={mandate.person?.photo_url || undefined} />
                                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                    {mandate.person?.full_name?.split(' ').slice(0, 2).map(n => n[0]).join('')}
                                  </AvatarFallback>
                                </Avatar>
                                
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h3 className="font-semibold text-foreground">
                                      {mandate.person?.full_name}
                                    </h3>
                                    {mandate.person?.party && (
                                      <Badge variant="secondary" className="text-xs">
                                        {mandate.person.party}
                                      </Badge>
                                    )}
                                    {mandate.confidence === 'CONFIRMADO' ? (
                                      <Badge variant="default" className="text-xs bg-green-500">
                                        Confirmado
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="text-xs text-amber-500 border-amber-500">
                                        Não confirmado
                                      </Badge>
                                    )}
                                  </div>
                                  
                                  <p className="text-sm text-muted-foreground">
                                    {mandate.office?.name} • {mandate.location?.name}
                                  </p>
                                  
                                  {/* Contacts */}
                                  <div className="flex items-center gap-4 mt-2">
                                    {contact?.email && (
                                      <a
                                        href={`mailto:${contact.email}`}
                                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                                      >
                                        <Mail className="h-3 w-3" />
                                        {contact.email}
                                      </a>
                                    )}
                                    {contact?.phone && (
                                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                        <Phone className="h-3 w-3" />
                                        {contact.phone}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
