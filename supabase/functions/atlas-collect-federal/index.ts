import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CollectorResult {
  created: number;
  updated: number;
  failed: number;
  errors: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { target } = await req.json();

    // Create job record
    const { data: job, error: jobError } = await supabase
      .from('atlas_jobs')
      .insert({
        job_type: `collect_federal_${target || 'all'}`,
        target_level: 'FEDERAL',
        status: 'RUNNING',
      })
      .select()
      .single();

    if (jobError) {
      console.error('Error creating job:', jobError);
    }

    const jobId = job?.id;
    const results: CollectorResult = { created: 0, updated: 0, failed: 0, errors: [] };

    // Get the federal location
    const { data: federalLocation } = await supabase
      .from('atlas_locations')
      .select('id')
      .eq('level', 'FEDERAL')
      .single();

    if (!federalLocation) {
      throw new Error('Federal location not found');
    }

    // Get office IDs
    const { data: offices } = await supabase
      .from('atlas_offices')
      .select('id, name')
      .eq('level', 'FEDERAL');

    const officeMap = new Map(offices?.map(o => [o.name, o.id]) || []);
    const deputadoOfficeId = officeMap.get('Deputado Federal');
    const senadorOfficeId = officeMap.get('Senador');

    // Create source record
    const { data: source } = await supabase
      .from('atlas_sources')
      .insert({
        title: `Coleta automática - ${new Date().toISOString()}`,
        url: 'https://dadosabertos.camara.leg.br/api/v2 + https://legis.senado.leg.br/dadosabertos',
        publisher: 'Câmara dos Deputados / Senado Federal',
        domain_type: 'CAMARA',
        method: 'API',
      })
      .select()
      .single();

    const sourceId = source?.id;

    // Collect Deputies
    if (!target || target === 'deputados' || target === 'all') {
      console.log('Collecting federal deputies...');
      
      try {
        const response = await fetch(
          'https://dadosabertos.camara.leg.br/api/v2/deputados?ordem=nome&ordenarPor=nome&itens=600',
          { headers: { 'Accept': 'application/json' } }
        );

        if (response.ok) {
          const data = await response.json();
          const deputies = data.dados || [];

          for (const dep of deputies) {
            try {
              // Get detailed info
              let email = dep.email || null;
              let phone = null;

              try {
                const detailRes = await fetch(
                  `https://dadosabertos.camara.leg.br/api/v2/deputados/${dep.id}`,
                  { headers: { 'Accept': 'application/json' } }
                );
                if (detailRes.ok) {
                  const detail = await detailRes.json();
                  const gabinete = detail.dados?.ultimoStatus?.gabinete;
                  email = gabinete?.email || email;
                  phone = gabinete?.telefone || null;
                }
              } catch (e) {
                // Continue with basic info
              }

              // Check if person exists first
              const { data: existingPerson } = await supabase
                .from('atlas_people')
                .select('id')
                .eq('cpf_hash', `DEP_FED_${dep.id}`)
                .maybeSingle();

              let person;
              if (existingPerson) {
                // Update existing
                const { data: updated } = await supabase
                  .from('atlas_people')
                  .update({
                    full_name: dep.nome,
                    party: dep.siglaPartido,
                    photo_url: dep.urlFoto,
                  })
                  .eq('id', existingPerson.id)
                  .select()
                  .single();
                person = updated;
                results.updated++;
              } else {
                // Insert new
                const { data: inserted, error: insertError } = await supabase
                  .from('atlas_people')
                  .insert({
                    full_name: dep.nome,
                    party: dep.siglaPartido,
                    photo_url: dep.urlFoto,
                    cpf_hash: `DEP_FED_${dep.id}`,
                  })
                  .select()
                  .single();
                
                if (insertError) {
                  console.error('Error inserting person:', insertError);
                  results.failed++;
                  continue;
                }
                person = inserted;
              }

              // Get state location
              const { data: stateLocation } = await supabase
                .from('atlas_locations')
                .select('id')
                .eq('level', 'ESTADUAL')
                .eq('uf', dep.siglaUf)
                .single();

              if (!stateLocation) {
                console.error(`State not found: ${dep.siglaUf}`);
                results.failed++;
                continue;
              }

              // Upsert mandate
              // Check if mandate exists
              const { data: existingMandate } = await supabase
                .from('atlas_mandates')
                .select('id')
                .eq('person_id', person.id)
                .eq('office_id', deputadoOfficeId)
                .eq('location_id', stateLocation.id)
                .maybeSingle();

              if (existingMandate) {
                await supabase
                  .from('atlas_mandates')
                  .update({
                    status: 'EM_EXERCICIO',
                    confidence: 'CONFIRMADO',
                    source_id: sourceId,
                  })
                  .eq('id', existingMandate.id);
              } else {
                await supabase
                  .from('atlas_mandates')
                  .insert({
                    location_id: stateLocation.id,
                    office_id: deputadoOfficeId,
                    person_id: person.id,
                    status: 'EM_EXERCICIO',
                    start_date: '2023-02-01',
                    confidence: 'CONFIRMADO',
                    source_id: sourceId,
                  });
              }

              // Check if contact exists
              const { data: existingContact } = await supabase
                .from('atlas_contacts')
                .select('id')
                .eq('person_id', person.id)
                .maybeSingle();

              if (email || phone) {
                if (existingContact) {
                  await supabase
                    .from('atlas_contacts')
                    .update({ email, phone, source_id: sourceId })
                    .eq('id', existingContact.id);
                } else {
                  await supabase
                    .from('atlas_contacts')
                    .insert({
                      person_id: person.id,
                      email,
                      phone,
                      source_id: sourceId,
                    });
                }
              }

              results.created++;
            } catch (e) {
              console.error('Error processing deputy:', e);
              results.failed++;
            }
          }
        }
      } catch (e) {
        console.error('Error fetching deputies:', e);
        results.errors.push(`Deputados: ${e.message}`);
      }
    }

    // Collect Senators
    if (!target || target === 'senadores' || target === 'all') {
      console.log('Collecting senators...');
      
      try {
        const response = await fetch(
          'https://legis.senado.leg.br/dadosabertos/senador/lista/atual',
          { headers: { 'Accept': 'application/json' } }
        );

        if (response.ok) {
          const data = await response.json();
          const senators = data?.ListaParlamentarEmExercicio?.Parlamentares?.Parlamentar || [];

          for (const sen of senators) {
            try {
              const id = sen.IdentificacaoParlamentar;
              const codigo = id.CodigoParlamentar;

              // Get detailed info
              let phone = null;
              let city = null;

              try {
                const detailRes = await fetch(
                  `https://legis.senado.leg.br/dadosabertos/senador/${codigo}`,
                  { headers: { 'Accept': 'application/json' } }
                );
                if (detailRes.ok) {
                  const detail = await detailRes.json();
                  const parlamentar = detail?.DetalheParlamentar?.Parlamentar;
                  const telefones = parlamentar?.Telefones?.Telefone;
                  city = parlamentar?.DadosBasicosParlamentar?.NaturalMunicipio;
                  
                  if (telefones) {
                    const arr = Array.isArray(telefones) ? telefones : [telefones];
                    phone = arr[0]?.NumeroTelefone || null;
                  }
                }
              } catch (e) {
                // Continue with basic info
              }

              // Check if person exists first
              const { data: existingPerson } = await supabase
                .from('atlas_people')
                .select('id')
                .eq('cpf_hash', `SEN_${codigo}`)
                .maybeSingle();

              let person;
              if (existingPerson) {
                // Update existing
                const { data: updated } = await supabase
                  .from('atlas_people')
                  .update({
                    full_name: id.NomeParlamentar || id.NomeCompletoParlamentar,
                    party: id.SiglaPartidoParlamentar,
                    photo_url: id.UrlFotoParlamentar,
                  })
                  .eq('id', existingPerson.id)
                  .select()
                  .single();
                person = updated;
              } else {
                // Insert new
                const { data: inserted, error: insertError } = await supabase
                  .from('atlas_people')
                  .insert({
                    full_name: id.NomeParlamentar || id.NomeCompletoParlamentar,
                    party: id.SiglaPartidoParlamentar,
                    photo_url: id.UrlFotoParlamentar,
                    cpf_hash: `SEN_${codigo}`,
                  })
                  .select()
                  .single();
                
                if (insertError) {
                  console.error('Error inserting senator:', insertError);
                  results.failed++;
                  continue;
                }
                person = inserted;
              }

              if (!person) {
                results.failed++;
                continue;
              }

              // Get state location
              const { data: stateLocation } = await supabase
                .from('atlas_locations')
                .select('id')
                .eq('level', 'ESTADUAL')
                .eq('uf', id.UfParlamentar)
                .single();

              if (!stateLocation) {
                console.error(`State not found: ${id.UfParlamentar}`);
                results.failed++;
                continue;
              }

              // Check if mandate exists
              const { data: existingMandate } = await supabase
                .from('atlas_mandates')
                .select('id')
                .eq('person_id', person.id)
                .eq('office_id', senadorOfficeId)
                .eq('location_id', stateLocation.id)
                .maybeSingle();

              if (existingMandate) {
                await supabase
                  .from('atlas_mandates')
                  .update({
                    status: 'EM_EXERCICIO',
                    confidence: 'CONFIRMADO',
                    source_id: sourceId,
                  })
                  .eq('id', existingMandate.id);
              } else {
                await supabase
                  .from('atlas_mandates')
                  .insert({
                    location_id: stateLocation.id,
                    office_id: senadorOfficeId,
                    person_id: person.id,
                    status: 'EM_EXERCICIO',
                    confidence: 'CONFIRMADO',
                    source_id: sourceId,
                  });
              }

              // Check if contact exists
              const { data: existingContact } = await supabase
                .from('atlas_contacts')
                .select('id')
                .eq('person_id', person.id)
                .maybeSingle();

              if (id.EmailParlamentar || phone) {
                if (existingContact) {
                  await supabase
                    .from('atlas_contacts')
                    .update({ email: id.EmailParlamentar, phone, source_id: sourceId })
                    .eq('id', existingContact.id);
                } else {
                  await supabase
                    .from('atlas_contacts')
                    .insert({
                      person_id: person.id,
                      email: id.EmailParlamentar,
                      phone,
                      source_id: sourceId,
                    });
                }
              }

              results.created++;
            } catch (e) {
              console.error('Error processing senator:', e);
              results.failed++;
            }
          }
        }
      } catch (e) {
        console.error('Error fetching senators:', e);
        results.errors.push(`Senadores: ${e.message}`);
      }
    }

    // Update job status
    if (jobId) {
      await supabase
        .from('atlas_jobs')
        .update({
          status: results.errors.length > 0 ? 'PARTIAL' : 'SUCCESS',
          records_created: results.created,
          records_updated: results.updated,
          records_failed: results.failed,
          finished_at: new Date().toISOString(),
          log: results.errors,
        })
        .eq('id', jobId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        job_id: jobId,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Collector error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
