import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, MessageCircle, Heart, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface GuestSignupPromptProps {
  messagesUsed: number;
  onDismiss?: () => void;
}

export function GuestSignupPrompt({ messagesUsed, onDismiss }: GuestSignupPromptProps) {
  const navigate = useNavigate();
  
  const isLimitReached = messagesUsed >= 3;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-background to-secondary/30">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5 text-primary" />
          {isLimitReached ? "You've experienced Anya!" : "Enjoying your chat?"}
        </CardTitle>
        <CardDescription>
          {isLimitReached 
            ? "Sign up free to continue your conversation and unlock all features."
            : `${3 - messagesUsed} trial messages remaining. Sign up to keep chatting!`
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-primary" />
            <span>Unlimited conversations with Anya</span>
          </div>
          <div className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-primary" />
            <span>Track your mood & journal entries</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <span>Your chats stay private & secure</span>
          </div>
        </div>
        
        <div className="flex flex-col gap-2">
          <Button 
            onClick={() => navigate('/auth')} 
            className="w-full"
          >
            Sign Up Free
          </Button>
          {!isLimitReached && onDismiss && (
            <Button 
              variant="ghost" 
              onClick={onDismiss}
              className="w-full text-muted-foreground"
            >
              Continue trial
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
