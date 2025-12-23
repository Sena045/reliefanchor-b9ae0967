import { useState } from 'react';
import { MessageSquare, Send, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface RegistrationSurveyProps {
  isOpen: boolean;
  onClose: () => void;
}

const SURVEY_REASONS = [
  { value: 'just_browsing', label: 'Just browsing, not ready yet', emoji: '👀' },
  { value: 'privacy_concerns', label: 'Privacy or data concerns', emoji: '🔒' },
  { value: 'no_google', label: "Don't want to use Google sign-in", emoji: '🚫' },
  { value: 'not_sure_helpful', label: 'Not sure if this will help me', emoji: '🤔' },
  { value: 'too_complicated', label: 'Seems too complicated', emoji: '😵' },
  { value: 'other', label: 'Other reason', emoji: '💬' },
];

export function RegistrationSurvey({ isOpen, onClose }: RegistrationSurveyProps) {
  const [selectedReason, setSelectedReason] = useState('');
  const [otherReason, setOtherReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!selectedReason) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('registration_surveys')
        .insert({
          reason: selectedReason,
          other_reason: selectedReason === 'other' ? otherReason.trim() : null,
          user_agent: navigator.userAgent,
        });

      if (error) throw error;

      setIsSubmitted(true);
      toast({ title: 'Thank you!', description: 'Your feedback helps us improve.' });
      
      setTimeout(() => {
        onClose();
        setIsSubmitted(false);
        setSelectedReason('');
        setOtherReason('');
      }, 2000);
    } catch {
      toast({ title: 'Oops!', description: 'Failed to submit. Please try again.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    onClose();
    setSelectedReason('');
    setOtherReason('');
  };

  if (!isOpen) return null;

  if (isSubmitted) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background">
        <div className="text-center p-8 animate-in fade-in zoom-in duration-300">
          <div className="mx-auto w-24 h-24 rounded-full bg-green-500 flex items-center justify-center mb-6 animate-pulse">
            <Send className="w-12 h-12 text-white" />
          </div>
          <h3 className="text-3xl font-bold mb-3">Thanks for sharing! 🎉</h3>
          <p className="text-muted-foreground text-lg">Your feedback helps us make ReliefAnchor better for everyone.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto">
      {/* Animated gradient background */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-primary/10"
        style={{
          animation: 'pulse 3s ease-in-out infinite',
        }}
      />
      
      {/* Floating particles effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-3 h-3 rounded-full bg-primary/30"
            style={{
              left: `${15 + i * 15}%`,
              top: `${20 + (i % 3) * 25}%`,
              animation: `float ${3 + i * 0.5}s ease-in-out infinite`,
              animationDelay: `${i * 0.3}s`,
            }}
          />
        ))}
      </div>
      
      <div className="relative w-full max-w-lg mx-4 my-8 animate-in slide-in-from-bottom-8 fade-in duration-500">
        {/* Glowing card effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-primary via-primary/50 to-primary rounded-2xl blur-lg opacity-40 animate-pulse" />
        
        <div className="relative bg-card rounded-2xl shadow-2xl p-6 sm:p-8 border border-primary/20">
          {/* Header with sparkle icon */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/60 mb-4 shadow-lg">
              <Sparkles className="w-10 h-10 text-primary-foreground animate-pulse" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">
              Wait! Quick question 🙋
            </h2>
            <p className="text-muted-foreground">
              Help us understand what's stopping you. Takes 5 seconds!
            </p>
          </div>

          {/* Survey options - larger touch targets */}
          <RadioGroup value={selectedReason} onValueChange={setSelectedReason} className="space-y-3 mb-6">
            {SURVEY_REASONS.map((reason) => (
              <div
                key={reason.value}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer active:scale-[0.98] ${
                  selectedReason === reason.value
                    ? 'border-primary bg-primary/10 shadow-md shadow-primary/20'
                    : 'border-border hover:border-primary/50 hover:bg-muted/50'
                }`}
                onClick={() => setSelectedReason(reason.value)}
              >
                <span className="text-2xl">{reason.emoji}</span>
                <RadioGroupItem value={reason.value} id={reason.value} className="sr-only" />
                <Label htmlFor={reason.value} className="cursor-pointer flex-1 text-base font-medium">
                  {reason.label}
                </Label>
              </div>
            ))}
          </RadioGroup>

          {selectedReason === 'other' && (
            <Textarea
              placeholder="Please tell us more..."
              value={otherReason}
              onChange={(e) => setOtherReason(e.target.value)}
              className="min-h-[100px] text-base mb-6 border-2"
              maxLength={500}
              autoFocus
            />
          )}

          {/* Large, prominent submit button */}
          <Button
            onClick={handleSubmit}
            disabled={!selectedReason || isSubmitting}
            size="lg"
            className="w-full h-14 text-lg font-semibold shadow-lg shadow-primary/30 mb-4"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Submitting...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Send className="w-5 h-5" />
                Submit Feedback
              </span>
            )}
          </Button>

          {/* Skip button - less prominent but still visible */}
          <button
            onClick={handleSkip}
            className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-3 rounded-lg hover:bg-muted/50"
          >
            Maybe later
          </button>
        </div>
      </div>

      {/* CSS for floating animation */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) scale(1); opacity: 0.3; }
          50% { transform: translateY(-20px) scale(1.2); opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}
