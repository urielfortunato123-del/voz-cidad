import { useState } from 'react';
import { Sparkles, FileSearch, Scale, Wand2, Languages, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useAIAssistant } from '@/hooks/useAIAssistant';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

interface ReportAnalyzerProps {
  category: string;
  title?: string;
  description: string;
  onApplySuggestion?: (text: string) => void;
}

type AnalysisType = 'analyze' | 'laws' | 'correct' | 'adapt';
type UserProfile = 'cidadao' | 'advogado' | 'juiz' | 'promotor';

const PROFILE_LABELS: Record<UserProfile, string> = {
  cidadao: 'Cidadão',
  advogado: 'Advogado',
  juiz: 'Juiz',
  promotor: 'Promotor'
};

export function ReportAnalyzer({ category, title, description, onApplySuggestion }: ReportAnalyzerProps) {
  const [activeAnalysis, setActiveAnalysis] = useState<AnalysisType | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<UserProfile>('cidadao');
  const [result, setResult] = useState<string>('');
  const [isOpen, setIsOpen] = useState(false);
  const { analyzeReport, suggestLaws, correctText, adaptLanguage, isLoading } = useAIAssistant();

  const reportData = { category, title, description };

  const handleAnalysis = async (type: AnalysisType) => {
    if (!description.trim()) return;
    
    setActiveAnalysis(type);
    setResult('');
    setIsOpen(true);

    try {
      let response = '';
      switch (type) {
        case 'analyze':
          response = await analyzeReport(reportData) || '';
          break;
        case 'laws':
          response = await suggestLaws(reportData) || '';
          break;
        case 'correct':
          response = await correctText(description) || '';
          break;
        case 'adapt':
          response = await adaptLanguage(reportData, selectedProfile) || '';
          break;
      }
      setResult(response);
    } catch (error) {
      console.error('Analysis error:', error);
    }
  };

  const isDisabled = !description.trim() || description.length < 20;

  return (
    <div className="space-y-3 p-4 bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl border border-primary/20">
      <div className="flex items-center gap-2 text-primary">
        <Sparkles className="h-5 w-5" />
        <span className="font-semibold text-sm">Assistente IA</span>
      </div>
      
      <p className="text-xs text-muted-foreground">
        Use a IA para melhorar sua denúncia antes de enviar
      </p>

      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => handleAnalysis('analyze')}
          disabled={isDisabled || (isLoading && activeAnalysis === 'analyze')}
          className="justify-start text-xs h-9"
        >
          {isLoading && activeAnalysis === 'analyze' ? (
            <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
          ) : (
            <FileSearch className="h-3.5 w-3.5 mr-1.5" />
          )}
          Analisar texto
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => handleAnalysis('laws')}
          disabled={isDisabled || (isLoading && activeAnalysis === 'laws')}
          className="justify-start text-xs h-9"
        >
          {isLoading && activeAnalysis === 'laws' ? (
            <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
          ) : (
            <Scale className="h-3.5 w-3.5 mr-1.5" />
          )}
          Sugerir leis
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => handleAnalysis('correct')}
          disabled={isDisabled || (isLoading && activeAnalysis === 'correct')}
          className="justify-start text-xs h-9"
        >
          {isLoading && activeAnalysis === 'correct' ? (
            <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
          ) : (
            <Wand2 className="h-3.5 w-3.5 mr-1.5" />
          )}
          Corrigir texto
        </Button>

        <div className="flex gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleAnalysis('adapt')}
            disabled={isDisabled || (isLoading && activeAnalysis === 'adapt')}
            className="flex-1 justify-start text-xs h-9"
          >
            {isLoading && activeAnalysis === 'adapt' ? (
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            ) : (
              <Languages className="h-3.5 w-3.5 mr-1.5" />
            )}
            Adaptar
          </Button>
          <select
            value={selectedProfile}
            onChange={(e) => setSelectedProfile(e.target.value as UserProfile)}
            className="h-9 text-xs rounded-md border border-input bg-background px-2"
          >
            {Object.entries(PROFILE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {isDisabled && (
        <p className="text-xs text-muted-foreground italic">
          Digite pelo menos 20 caracteres na descrição para usar a IA
        </p>
      )}

      {/* Results */}
      {result && (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full justify-between text-xs h-8 mt-2"
            >
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                Resultado da análise
              </span>
              {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-2 p-3 bg-background rounded-lg border border-border max-h-60 overflow-y-auto">
              <div className="prose prose-sm dark:prose-invert max-w-none text-xs">
                <ReactMarkdown>{result}</ReactMarkdown>
              </div>
              
              {activeAnalysis === 'correct' && onApplySuggestion && (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => onApplySuggestion(result)}
                  className="mt-3 w-full text-xs h-8"
                >
                  <Wand2 className="h-3.5 w-3.5 mr-1.5" />
                  Aplicar correção
                </Button>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}
