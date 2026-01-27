import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface IBGEState {
  id: number;
  sigla: string;
  nome: string;
}

interface IBGECity {
  id: number;
  nome: string;
  microrregiao?: {
    mesorregiao?: {
      UF?: {
        sigla: string;
      };
    };
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch states from IBGE API
    console.log("Fetching states from IBGE...");
    const statesResponse = await fetch(
      "https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome"
    );
    const states: IBGEState[] = await statesResponse.json();

    // Create a map of state ID to sigla
    const stateIdToSigla = new Map<number, string>();
    states.forEach((state) => {
      stateIdToSigla.set(state.id, state.sigla);
    });

    // Insert states
    const statesData = states.map((state) => ({
      uf: state.sigla,
      name: state.nome,
    }));

    // Delete existing cities first, then states
    console.log("Clearing existing data...");
    await supabase.from("locations_cities").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("locations_states").delete().neq("uf", "XX");

    console.log("Inserting states...");
    const { error: statesError } = await supabase
      .from("locations_states")
      .upsert(statesData, { onConflict: "uf" });

    if (statesError) {
      console.error("Error inserting states:", statesError);
      throw statesError;
    }

    console.log(`Inserted ${states.length} states`);

    // Fetch cities by state to get proper UF reference
    console.log("Fetching cities from IBGE for each state...");
    let totalCities = 0;

    for (const state of states) {
      console.log(`Fetching cities for ${state.sigla}...`);
      const citiesResponse = await fetch(
        `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${state.id}/municipios?orderBy=nome`
      );
      const cities = await citiesResponse.json();

      if (!Array.isArray(cities) || cities.length === 0) {
        console.log(`No cities found for ${state.sigla}`);
        continue;
      }

      const citiesData = cities.map((city: { nome: string }) => ({
        name: city.nome,
        uf: state.sigla,
      }));

      const { error: citiesError } = await supabase
        .from("locations_cities")
        .insert(citiesData);

      if (citiesError) {
        console.error(`Error inserting cities for ${state.sigla}:`, citiesError);
        // Continue with other states
      } else {
        totalCities += cities.length;
        console.log(`Inserted ${cities.length} cities for ${state.sigla} (total: ${totalCities})`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Populated database with ${states.length} states and ${totalCities} cities from IBGE`,
        states: states.length,
        cities: totalCities,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error seeding locations:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
