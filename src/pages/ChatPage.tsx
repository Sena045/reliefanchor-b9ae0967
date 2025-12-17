import { useState, useRef, useEffect } from 'react';
import { Send, Trash2, Loader2 } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface ChatPageProps {
  onShowPremium: () => void;
}

export function ChatPage({ onShowPremium }: ChatPageProps) {
  const { 
    settings, 
    chatHistory, 
    sendMessage, 
    clearChat, 
    canSendMessage, 
    remainingMessages,
  } = useApp();
  const { toast } = useToast();
  
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const message = input.trim();
    setInput('');
    setIsLoading(true);
    
    try {
      await sendMessage(message);
    } catch (error) {
      if (error instanceof Error && error.message === 'PAYWALL') {
        onShowPremium();
      } else {
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to send message',
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div>
          <h1 className="font-semibold">Anya</h1>
          <p className="text-xs text-muted-foreground">
            {!settings.isPremium && `${remainingMessages} messages remaining today`}
          </p>
        </div>
        {chatHistory.length > 0 && (
          <Button variant="ghost" size="icon" onClick={clearChat}>
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
        {chatHistory.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            <p className="text-lg mb-2">👋 Hello!</p>
            <p className="text-sm">
              I'm Anya, your mental wellness companion. How are you feeling today?
            </p>
          </div>
        )}
        
        {chatHistory.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              'flex',
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            <div
              className={cn(
                'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm',
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground rounded-br-md'
                  : 'bg-secondary text-secondary-foreground rounded-bl-md'
              )}
            >
              {msg.content}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-secondary rounded-2xl rounded-bl-md px-4 py-3">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            disabled={isLoading || !canSendMessage}
            className="flex-1"
          />
          <Button 
            type="submit" 
            size="icon" 
            disabled={!input.trim() || isLoading || !canSendMessage}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
        
        {!canSendMessage && !settings.isPremium && (
          <p className="text-xs text-center text-muted-foreground mt-2">
            Free messages used today. Upgrade to Premium!
          </p>
        )}
      </div>
    </div>
  );
}
