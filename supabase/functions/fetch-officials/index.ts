import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Official {
  external_id: string;
  name: string;
  role: string;
  photo_url: string | null;
  party: string | null;
  uf: string;
  city: string | null;
  category_tags: string[];
  scope: string;
  email: string | null;
  phone: string | null;
}

// Map category to responsible roles
const CATEGORY_ROLE_MAP: Record<string, string[]> = {
  'SAUDE': ['SECRETARIO_SAUDE', 'MINISTRO_SAUDE', 'VEREADOR', 'DEPUTADO_ESTADUAL', 'DEPUTADO_FEDERAL', 'SENADOR'],
  'EDUCACAO': ['SECRETARIO_EDUCACAO', 'MINISTRO_EDUCACAO', 'VEREADOR', 'DEPUTADO_ESTADUAL', 'DEPUTADO_FEDERAL', 'SENADOR'],
  'OBRAS': ['SECRETARIO_OBRAS', 'PREFEITO', 'GOVERNADOR', 'VEREADOR', 'DEPUTADO_ESTADUAL'],
  'SERVICOS_URBANOS': ['SECRETARIO_SERVICOS_URBANOS', 'PREFEITO', 'VEREADOR'],
  'MEIO_AMBIENTE': ['SECRETARIO_MEIO_AMBIENTE', 'MINISTRO_MEIO_AMBIENTE', 'VEREADOR', 'DEPUTADO_ESTADUAL', 'DEPUTADO_FEDERAL', 'SENADOR'],
  'SEGURANCA': ['SECRETARIO_SEGURANCA', 'MINISTRO_JUSTICA', 'GOVERNADOR', 'DEPUTADO_ESTADUAL', 'DEPUTADO_FEDERAL', 'SENADOR'],
  'CORRUPCAO': ['PREFEITO', 'GOVERNADOR', 'PRESIDENTE', 'VEREADOR', 'DEPUTADO_ESTADUAL', 'DEPUTADO_FEDERAL', 'SENADOR'],
};

// Role labels in Portuguese
const ROLE_LABELS: Record<string, string> = {
  'VEREADOR': 'Vereador(a)',
  'PREFEITO': 'Prefeito(a)',
  'DEPUTADO_ESTADUAL': 'Deputado(a) Estadual',
  'DEPUTADO_FEDERAL': 'Deputado(a) Federal',
  'SENADOR': 'Senador(a)',
  'GOVERNADOR': 'Governador(a)',
  'SECRETARIO_SAUDE': 'Secretário(a) de Saúde',
  'SECRETARIO_EDUCACAO': 'Secretário(a) de Educação',
  'SECRETARIO_OBRAS': 'Secretário(a) de Obras',
  'SECRETARIO_SERVICOS_URBANOS': 'Secretário(a) de Serviços Urbanos',
  'SECRETARIO_MEIO_AMBIENTE': 'Secretário(a) de Meio Ambiente',
  'SECRETARIO_SEGURANCA': 'Secretário(a) de Segurança',
  'MINISTRO_SAUDE': 'Ministro(a) da Saúde',
  'MINISTRO_EDUCACAO': 'Ministro(a) da Educação',
  'MINISTRO_MEIO_AMBIENTE': 'Ministro(a) do Meio Ambiente',
  'MINISTRO_JUSTICA': 'Ministro(a) da Justiça',
  'PRESIDENTE': 'Presidente',
};

async function fetchDeputadosFederais(uf: string): Promise<Official[]> {
  try {
    // First get the list of deputies
    const response = await fetch(
      `https://dadosabertos.camara.leg.br/api/v2/deputados?siglaUf=${uf}&ordem=nome&ordenarPor=nome&itens=100`,
      { headers: { 'Accept': 'application/json' } }
    );
    
    if (!response.ok) {
      console.error('Erro ao buscar deputados federais:', response.status);
      return [];
    }
    
    const data = await response.json();
    const deputies = data.dados || [];
    
    // Fetch detailed info for each deputy (in batches to avoid rate limiting)
    const detailedDeputies: Official[] = [];
    
    for (const dep of deputies) {
      try {
        const detailResponse = await fetch(
          `https://dadosabertos.camara.leg.br/api/v2/deputados/${dep.id}`,
          { headers: { 'Accept': 'application/json' } }
        );
        
        if (detailResponse.ok) {
          const detailData = await detailResponse.json();
          const detail = detailData.dados;
          
          detailedDeputies.push({
            external_id: `DEP_FED_${dep.id}`,
            name: dep.nome,
            role: 'DEPUTADO_FEDERAL',
            photo_url: dep.urlFoto || null,
            party: dep.siglaPartido || null,
            uf: dep.siglaUf,
            city: detail?.municipioNascimento || null,
            category_tags: [],
            scope: 'FEDERAL',
            email: detail?.ultimoStatus?.gabinete?.email || dep.email || null,
            phone: detail?.ultimoStatus?.gabinete?.telefone || null,
          });
        } else {
          // Fallback to basic info
          detailedDeputies.push({
            external_id: `DEP_FED_${dep.id}`,
            name: dep.nome,
            role: 'DEPUTADO_FEDERAL',
            photo_url: dep.urlFoto || null,
            party: dep.siglaPartido || null,
            uf: dep.siglaUf,
            city: null,
            category_tags: [],
            scope: 'FEDERAL',
            email: dep.email || null,
            phone: null,
          });
        }
      } catch (detailError) {
        // Fallback to basic info on error
        detailedDeputies.push({
          external_id: `DEP_FED_${dep.id}`,
          name: dep.nome,
          role: 'DEPUTADO_FEDERAL',
          photo_url: dep.urlFoto || null,
          party: dep.siglaPartido || null,
          uf: dep.siglaUf,
          city: null,
          category_tags: [],
          scope: 'FEDERAL',
          email: dep.email || null,
          phone: null,
        });
      }
    }
    
    return detailedDeputies;
  } catch (error) {
    console.error('Erro ao buscar deputados federais:', error);
    return [];
  }
}

async function fetchSenadores(uf: string): Promise<Official[]> {
  try {
    const response = await fetch(
      `https://legis.senado.leg.br/dadosabertos/senador/lista/atual?uf=${uf}`,
      { headers: { 'Accept': 'application/json' } }
    );
    
    if (!response.ok) {
      console.error('Erro ao buscar senadores:', response.status);
      return [];
    }
    
    const data = await response.json();
    const parlamentares = data?.ListaParlamentarEmExercicio?.Parlamentares?.Parlamentar || [];
    
    // Fetch detailed info for each senator
    const detailedSenators: Official[] = [];
    
    for (const sen of parlamentares) {
      const identificacao = sen.IdentificacaoParlamentar || {};
      const codigo = identificacao.CodigoParlamentar;
      
      try {
        // Fetch detailed senator info including contact
        const detailResponse = await fetch(
          `https://legis.senado.leg.br/dadosabertos/senador/${codigo}`,
          { headers: { 'Accept': 'application/json' } }
        );
        
        if (detailResponse.ok) {
          const detailData = await detailResponse.json();
          const parlamentar = detailData?.DetalheParlamentar?.Parlamentar;
          const dadosBasicos = parlamentar?.DadosBasicosParlamentar;
          const telefones = parlamentar?.Telefones?.Telefone;
          
          let phone = null;
          if (telefones) {
            const telefoneArray = Array.isArray(telefones) ? telefones : [telefones];
            const gabinete = telefoneArray.find((t: any) => t.OrdemPublicacao === '1');
            phone = gabinete?.NumeroTelefone || telefoneArray[0]?.NumeroTelefone || null;
          }
          
          detailedSenators.push({
            external_id: `SEN_${codigo}`,
            name: identificacao.NomeParlamentar || identificacao.NomeCompletoParlamentar,
            role: 'SENADOR',
            photo_url: identificacao.UrlFotoParlamentar || null,
            party: identificacao.SiglaPartidoParlamentar || null,
            uf: identificacao.UfParlamentar || uf,
            city: dadosBasicos?.NaturalMunicipio || null,
            category_tags: [],
            scope: 'FEDERAL',
            email: identificacao.EmailParlamentar || null,
            phone: phone,
          });
        } else {
          // Fallback to basic info
          detailedSenators.push({
            external_id: `SEN_${codigo}`,
            name: identificacao.NomeParlamentar || identificacao.NomeCompletoParlamentar,
            role: 'SENADOR',
            photo_url: identificacao.UrlFotoParlamentar || null,
            party: identificacao.SiglaPartidoParlamentar || null,
            uf: identificacao.UfParlamentar || uf,
            city: null,
            category_tags: [],
            scope: 'FEDERAL',
            email: identificacao.EmailParlamentar || null,
            phone: null,
          });
        }
      } catch (detailError) {
        // Fallback to basic info on error
        detailedSenators.push({
          external_id: `SEN_${codigo}`,
          name: identificacao.NomeParlamentar || identificacao.NomeCompletoParlamentar,
          role: 'SENADOR',
          photo_url: identificacao.UrlFotoParlamentar || null,
          party: identificacao.SiglaPartidoParlamentar || null,
          uf: identificacao.UfParlamentar || uf,
          city: null,
          category_tags: [],
          scope: 'FEDERAL',
          email: identificacao.EmailParlamentar || null,
          phone: null,
        });
      }
    }
    
    return detailedSenators;
  } catch (error) {
    console.error('Erro ao buscar senadores:', error);
    return [];
  }
}

async function fetchDeputadosEstaduais(uf: string): Promise<Official[]> {
  // Most state assemblies don't have open APIs, we'll return empty for now
  // Can be populated via admin panel or other data sources
  console.log(`Deputados estaduais de ${uf} não disponíveis via API pública`);
  return [];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { uf, city, category, forceRefresh } = await req.json();
    
    if (!uf) {
      return new Response(
        JSON.stringify({ error: 'UF é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if we have recent data in cache (less than 24h old)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    let query = supabase
      .from('public_officials')
      .select('*')
      .eq('uf', uf)
      .eq('active', true);
    
    if (city) {
      query = query.or(`city.eq.${city},city.is.null`);
    }
    
    if (category) {
      const relevantRoles = CATEGORY_ROLE_MAP[category] || [];
      if (relevantRoles.length > 0) {
        query = query.in('role', relevantRoles);
      }
    }

    const { data: cachedOfficials, error: cacheError } = await query
      .order('role')
      .order('name');

    // If we have cached data and not forcing refresh, return it
    if (cachedOfficials && cachedOfficials.length > 0 && !forceRefresh) {
      // Add role labels
      const officialsWithLabels = cachedOfficials.map(off => ({
        ...off,
        role_label: ROLE_LABELS[off.role] || off.role,
      }));
      
      return new Response(
        JSON.stringify({ officials: officialsWithLabels, source: 'cache' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch fresh data from APIs
    console.log(`Buscando dados frescos para ${uf}...`);
    
    const [deputadosFederais, senadores, deputadosEstaduais] = await Promise.all([
      fetchDeputadosFederais(uf),
      fetchSenadores(uf),
      fetchDeputadosEstaduais(uf),
    ]);

    const allOfficials = [...deputadosFederais, ...senadores, ...deputadosEstaduais];

    // Upsert to cache
    if (allOfficials.length > 0) {
      const { error: upsertError } = await supabase
        .from('public_officials')
        .upsert(
          allOfficials.map(off => ({
            ...off,
            updated_at: new Date().toISOString(),
          })),
          { onConflict: 'external_id,role' }
        );

      if (upsertError) {
        console.error('Erro ao salvar no cache:', upsertError);
      }
    }

    // Merge with existing cached data (for roles we can't fetch via API)
    const mergedOfficials = [...allOfficials];
    
    if (cachedOfficials) {
      const freshIds = new Set(allOfficials.map(o => o.external_id));
      const additionalFromCache = cachedOfficials.filter(o => !freshIds.has(o.external_id));
      mergedOfficials.push(...additionalFromCache);
    }

    // Filter by category if specified
    let filteredOfficials = mergedOfficials;
    if (category) {
      const relevantRoles = CATEGORY_ROLE_MAP[category] || [];
      filteredOfficials = mergedOfficials.filter(off => 
        relevantRoles.includes(off.role) || off.category_tags.includes(category)
      );
    }

    // Add role labels
    const officialsWithLabels = filteredOfficials.map(off => ({
      ...off,
      role_label: ROLE_LABELS[off.role] || off.role,
    }));

    // Sort by scope (municipal first, then state, then federal) and name
    officialsWithLabels.sort((a, b) => {
      const scopeOrder = { 'MUNICIPAL': 0, 'ESTADUAL': 1, 'FEDERAL': 2 };
      const scopeDiff = (scopeOrder[a.scope as keyof typeof scopeOrder] || 0) - (scopeOrder[b.scope as keyof typeof scopeOrder] || 0);
      if (scopeDiff !== 0) return scopeDiff;
      return a.name.localeCompare(b.name, 'pt-BR');
    });

    return new Response(
      JSON.stringify({ officials: officialsWithLabels, source: 'api' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro na função fetch-officials:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno ao buscar servidores públicos' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
