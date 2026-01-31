import { useState } from 'react';
import { Bot, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AIAssistantChat } from './AIAssistantChat';
import { cn } from '@/lib/utils';

export function AIAssistantButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-20 right-4 z-50 h-14 w-14 rounded-full shadow-lg transition-all duration-300",
          "bg-primary hover:bg-primary/90",
          isOpen && "rotate-90"
        )}
        size="icon"
        aria-label={isOpen ? "Fechar assistente" : "Abrir assistente de IA"}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <Bot className="h-6 w-6" />
        )}
      </Button>

      {/* Chat Panel */}
      <div
        className={cn(
          "fixed bottom-36 right-4 z-50 w-[calc(100vw-2rem)] max-w-md transition-all duration-300 transform",
          isOpen 
            ? "translate-y-0 opacity-100 pointer-events-auto" 
            : "translate-y-4 opacity-0 pointer-events-none"
        )}
      >
        <AIAssistantChat onClose={() => setIsOpen(false)} />
      </div>

      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
