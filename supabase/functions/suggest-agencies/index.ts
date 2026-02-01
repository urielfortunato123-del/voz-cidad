import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SuggestAgenciesRequest {
  uf: string;
  city: string;
  category: string;
  categoryLabel: string;
}

const CATEGORY_ORGANS: Record<string, string[]> = {
  SAUDE: ["Secretaria de Saúde", "Vigilância Sanitária", "CRM", "Conselho de Saúde", "Ouvidoria da Saúde"],
  OBRAS: ["Secretaria de Obras", "Secretaria de Infraestrutura", "Defesa Civil", "CREA"],
  EDUCACAO: ["Secretaria de Educação", "Conselho de Educação", "Ministério Público - Educação"],
  SERVICOS_URBANOS: ["Secretaria de Serviços Urbanos", "Prefeitura", "Ouvidoria Municipal", "PROCON"],
  MEIO_AMBIENTE: ["IBAMA", "Secretaria de Meio Ambiente", "Polícia Ambiental", "ICMBio", "Ministério Público - Meio Ambiente"],
  SEGURANCA: ["Polícia Militar", "Polícia Civil", "Secretaria de Segurança", "Guarda Municipal", "Disque Denúncia"],
  CORRUPCAO: ["Ministério Público", "CGU", "TCE", "TCU", "Polícia Federal", "Controladoria Geral"],
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    if (!OPENROUTER_API_KEY) {
      throw new Error("OPENROUTER_API_KEY is not configured");
    }

    const { uf, city, category, categoryLabel }: SuggestAgenciesRequest = await req.json();

    if (!uf || !city || !category) {
      throw new Error("UF, city and category are required");
    }

    const relevantOrgans = CATEGORY_ORGANS[category] || ["Ouvidoria", "Ministério Público"];

    const prompt = `Você é um especialista em órgãos públicos brasileiros.

Preciso dos emails oficiais de contato para denúncias na cidade de ${city}/${uf}, categoria: ${categoryLabel}.

Órgãos relevantes para esta categoria: ${relevantOrgans.join(", ")}

IMPORTANTE:
1. Retorne APENAS emails que você tem ALTA CONFIANÇA que são corretos
2. Use padrões conhecidos de emails governamentais brasileiros (ex: ouvidoria@cidade.sp.gov.br)
3. Para órgãos estaduais/federais, use os emails oficiais conhecidos
4. Se não tiver certeza do email exato de uma cidade pequena, sugira o órgão estadual correspondente

Retorne no seguinte formato JSON (sem markdown, apenas o JSON puro):
{
  "suggestions": [
    {
      "name": "Nome do Órgão",
      "email": "email@orgao.gov.br",
      "scope": "MUNICIPAL" | "ESTADUAL" | "FEDERAL",
      "confidence": "alta" | "media",
      "description": "Breve descrição do órgão"
    }
  ]
}

Retorne entre 3 e 6 sugestões, priorizando órgãos locais primeiro, depois estaduais e federais.
Inclua apenas emails no formato válido. Não invente emails.`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://fiscalizabrasil.app",
        "X-Title": "Fiscaliza Brasil",
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-001",
        messages: [
          { role: "user", content: prompt }
        ],
        temperature: 0.1, // Low temperature for more consistent results
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Muitas requisições. Tente novamente em alguns segundos.", suggestions: [] }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes.", suggestions: [] }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("OpenRouter API error:", response.status, errorText);
      throw new Error("Erro na API de IA");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Try to parse JSON from response
    let suggestions = [];
    try {
      // Remove markdown code blocks if present
      const jsonStr = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(jsonStr);
      suggestions = parsed.suggestions || [];
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      suggestions = [];
    }

    return new Response(
      JSON.stringify({ suggestions }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Suggest agencies error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Erro desconhecido",
        suggestions: []
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
