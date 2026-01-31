import { useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

type RequestType = "chat" | "analyze_report" | "suggest_laws" | "correct_text" | "adapt_language";
type UserProfile = "cidadao" | "advogado" | "juiz" | "promotor";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ReportData {
  category: string;
  title?: string;
  description: string;
}

const AI_ASSISTANT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`;

export function useAIAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();

  const streamChat = useCallback(async ({
    type = "chat",
    message,
    reportData,
    userProfile,
  }: {
    type?: RequestType;
    message?: string;
    reportData?: ReportData;
    userProfile?: UserProfile;
  }) => {
    setIsLoading(true);
    setError(null);

    // Add user message to history
    if (message) {
      setMessages(prev => [...prev, { role: "user", content: message }]);
    }

    try {
      const response = await fetch(AI_ASSISTANT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          type,
          message,
          reportData,
          userProfile,
          currentPage: location.pathname,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erro ${response.status}`);
      }

      if (!response.body) throw new Error("Sem resposta do servidor");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let assistantContent = "";

      const updateAssistant = (content: string) => {
        assistantContent = content;
        setMessages(prev => {
          const lastMsg = prev[prev.length - 1];
          if (lastMsg?.role === "assistant") {
            return prev.map((m, i) => 
              i === prev.length - 1 ? { ...m, content } : m
            );
          }
          return [...prev, { role: "assistant", content }];
        });
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              updateAssistant(assistantContent);
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      setIsLoading(false);
      return assistantContent;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";
      setError(errorMessage);
      setIsLoading(false);
      throw err;
    }
  }, [location.pathname]);

  const analyzeReport = useCallback(async (reportData: ReportData) => {
    return streamChat({ type: "analyze_report", reportData });
  }, [streamChat]);

  const suggestLaws = useCallback(async (reportData: ReportData) => {
    return streamChat({ type: "suggest_laws", reportData });
  }, [streamChat]);

  const correctText = useCallback(async (text: string) => {
    return streamChat({ type: "correct_text", message: text });
  }, [streamChat]);

  const adaptLanguage = useCallback(async (reportData: ReportData, profile: UserProfile) => {
    return streamChat({ type: "adapt_language", reportData, userProfile: profile });
  }, [streamChat]);

  const sendMessage = useCallback(async (message: string) => {
    return streamChat({ type: "chat", message });
  }, [streamChat]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    analyzeReport,
    suggestLaws,
    correctText,
    adaptLanguage,
    clearMessages,
  };
}
