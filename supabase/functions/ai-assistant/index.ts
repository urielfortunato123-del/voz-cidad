import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AssistantRequest {
  type: "chat" | "analyze_report" | "suggest_laws" | "correct_text" | "adapt_language";
  message?: string;
  reportData?: {
    category: string;
    title?: string;
    description: string;
  };
  userProfile?: "cidadao" | "advogado" | "juiz" | "promotor";
  currentPage?: string;
}

const SYSTEM_PROMPTS = {
  base: `Você é o assistente inteligente do Fiscaliza Brasil, um aplicativo de denúncias cidadãs.
Seu objetivo é ajudar os usuários a fazer denúncias mais completas, corretas e bem fundamentadas.

Informações importantes sobre o app:
- O app permite denúncias em categorias: Saúde, Obras & Infraestrutura, Educação, Serviços Urbanos, Meio Ambiente, Segurança, Corrupção/Gasto Público
- Denúncias falsas são crime (Art. 339 do Código Penal - Denunciação Caluniosa)
- O usuário pode fazer denúncias anônimas ou identificadas
- É possível anexar fotos, vídeos e documentos como evidência

Seja sempre educado, objetivo e útil. Responda em português brasileiro.`,

  analyze_report: `Você é um especialista em análise de denúncias cidadãs.
Ao receber uma denúncia, você deve:
1. Verificar se a descrição está clara e completa
2. Identificar possíveis leis ou normas relacionadas
3. Sugerir melhorias no texto para torná-lo mais objetivo
4. Alertar sobre possíveis problemas (exposição de dados pessoais, acusações sem evidência)
5. Verificar ortografia e gramática
6. Classificar a gravidade estimada

Responda de forma estruturada e profissional. Use linguagem acessível para cidadãos comuns.`,

  suggest_laws: `Você é um especialista em legislação brasileira.
Ao analisar uma denúncia, identifique:
1. Leis federais relacionadas (com artigos específicos quando possível)
2. Normas municipais/estaduais que podem se aplicar
3. Órgãos competentes para fiscalização
4. Precedentes ou casos similares se conhecidos
5. Prazos legais relevantes

Seja preciso nas citações legais. Explique os termos jurídicos de forma simples.`,

  adapt_language: {
    cidadao: "Adapte o texto para linguagem simples e acessível, evitando jargões jurídicos.",
    advogado: "Mantenha ou adapte para linguagem técnico-jurídica adequada, com citações de leis e artigos.",
    juiz: "Use linguagem formal e técnica, adequada para documentos judiciais, com fundamentação legal completa.",
    promotor: "Use linguagem adequada para peças do Ministério Público, focando em provas e tipificação."
  }
};

const PAGE_CONTEXT = {
  "/": "O usuário está na página inicial, onde pode ver estatísticas e acessar funcionalidades principais.",
  "/nova-denuncia": "O usuário está criando uma nova denúncia. Ajude-o a descrever bem o problema e a categoria correta.",
  "/denuncias": "O usuário está visualizando a lista de denúncias da cidade.",
  "/mapa": "O usuário está vendo o mapa com as denúncias geolocalizadas.",
  "/orgaos": "O usuário está vendo a lista de órgãos públicos cadastrados.",
  "/consultar": "O usuário pode consultar o status de uma denúncia pelo protocolo."
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { type, message, reportData, userProfile, currentPage }: AssistantRequest = await req.json();

    let systemPrompt = SYSTEM_PROMPTS.base;
    let userMessage = message || "";

    // Add page context
    if (currentPage && PAGE_CONTEXT[currentPage as keyof typeof PAGE_CONTEXT]) {
      systemPrompt += `\n\nContexto: ${PAGE_CONTEXT[currentPage as keyof typeof PAGE_CONTEXT]}`;
    }

    // Handle different request types
    switch (type) {
      case "analyze_report":
        systemPrompt = SYSTEM_PROMPTS.base + "\n\n" + SYSTEM_PROMPTS.analyze_report;
        if (reportData) {
          userMessage = `Analise esta denúncia:
Categoria: ${reportData.category}
${reportData.title ? `Título: ${reportData.title}` : ""}
Descrição: ${reportData.description}

Por favor, forneça:
1. Análise de clareza e completude
2. Correções ortográficas/gramaticais necessárias
3. Sugestões de melhoria
4. Possíveis leis relacionadas
5. Alertas importantes (se houver)`;
        }
        break;

      case "suggest_laws":
        systemPrompt = SYSTEM_PROMPTS.base + "\n\n" + SYSTEM_PROMPTS.suggest_laws;
        if (reportData) {
          userMessage = `Identifique as leis e normas relacionadas a esta denúncia:
Categoria: ${reportData.category}
Descrição: ${reportData.description}`;
        }
        break;

      case "correct_text":
        systemPrompt = SYSTEM_PROMPTS.base + `\n\nVocê é um revisor de textos especializado.
Corrija ortografia, gramática e pontuação do texto a seguir.
Retorne APENAS o texto corrigido, sem explicações adicionais.`;
        break;

      case "adapt_language":
        const profile = userProfile || "cidadao";
        systemPrompt = SYSTEM_PROMPTS.base + "\n\n" + SYSTEM_PROMPTS.adapt_language[profile];
        if (reportData) {
          userMessage = `Adapte o seguinte texto de denúncia para o perfil ${profile}:
${reportData.description}`;
        }
        break;

      default: // chat
        // General chat - use base prompt
        break;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage }
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Muitas requisições. Tente novamente em alguns segundos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Limite de uso atingido. Entre em contato com o suporte." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Erro ao processar sua solicitação. Tente novamente." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Assistant error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
