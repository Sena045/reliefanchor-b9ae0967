import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { guestChatService } from '@/services/guestChatService';
import { GuestSignupPrompt } from '@/components/GuestSignupPrompt';

const GUEST_MESSAGES_KEY = 'relief_anchor_guest_chat';
const GUEST_COUNT_KEY = 'relief_anchor_guest_count';

interface GuestMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface GuestChatPageProps {
  onSignUp: () => void;
}

export function GuestChatPage({ onSignUp }: GuestChatPageProps) {
  const { toast } = useToast();
  
  const [messages, setMessages] = useState<GuestMessage[]>(() => {
    try {
      const saved = localStorage.getItem(GUEST_MESSAGES_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  
  const [messagesUsed, setMessagesUsed] = useState(() => {
    try {
      return parseInt(localStorage.getItem(GUEST_COUNT_KEY) || '0', 10);
    } catch {
      return 0;
    }
  });
  
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Persist messages to localStorage
  useEffect(() => {
    localStorage.setItem(GUEST_MESSAGES_KEY, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem(GUEST_COUNT_KEY, messagesUsed.toString());
  }, [messagesUsed]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Show signup prompt after first response
  useEffect(() => {
    if (messagesUsed === 1 && messages.length === 2) {
      setTimeout(() => setShowSignupPrompt(true), 1500);
    }
  }, [messagesUsed, messages.length]);

  const canSend = messagesUsed < 3;
  const remainingMessages = 3 - messagesUsed;

  const handleSend = async () => {
    if (!input.trim() || isLoading || !canSend) return;
    
    const message = input.trim();
    setInput('');
    setIsLoading(true);
    
    const userMessage: GuestMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    try {
      const allMessages = [...messages, userMessage].map(m => ({ 
        role: m.role, 
        content: m.content 
      }));
      
      const response = await guestChatService.sendMessage(allMessages);
      
      const assistantMessage: GuestMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      setMessagesUsed(prev => prev + 1);
      
    } catch (error) {
      if (error instanceof Error && error.message === 'GUEST_LIMIT_REACHED') {
        setShowSignupPrompt(true);
      } else {
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to send message',
          variant: 'destructive',
        });
        // Remove the user message on error
        setMessages(prev => prev.filter(m => m.id !== userMessage.id));
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
          <h1 className="font-semibold">Try Anya</h1>
          <p className="text-xs text-muted-foreground">
            {canSend 
              ? `${remainingMessages} free trial message${remainingMessages !== 1 ? 's' : ''} remaining`
              : 'Trial complete! Create your space to continue'
            }
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={onSignUp}
          className="gap-1 text-xs"
        >
          Create a private space <ArrowRight className="h-3 w-3" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            <p className="text-lg mb-2">👋 Hello!</p>
            <p className="text-sm mb-4">
              I'm Anya, your mental wellness companion. Try chatting with me!
            </p>
            <p className="text-xs text-muted-foreground/70">
              3 free messages to experience how I can help you.
            </p>
          </div>
        )}
        
        {messages.map((msg) => (
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
        
        {/* Signup prompt after messages */}
        {showSignupPrompt && (
          <div className="py-4">
            <GuestSignupPrompt 
              messagesUsed={messagesUsed}
              onDismiss={canSend ? () => setShowSignupPrompt(false) : undefined}
              onSignUp={onSignUp}
            />
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border">
        {canSend ? (
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
              disabled={isLoading}
              className="flex-1"
            />
            <Button 
              type="submit" 
              size="icon" 
              disabled={!input.trim() || isLoading}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        ) : (
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-3">
              You've used all trial messages!
            </p>
            <Button onClick={onSignUp} className="w-full">
              Create a Private Space to Continue
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
