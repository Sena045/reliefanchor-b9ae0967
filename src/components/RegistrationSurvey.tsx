import { useState } from 'react';
import { MessageSquare, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface RegistrationSurveyProps {
  isOpen: boolean;
  onClose: () => void;
}

const SURVEY_REASONS = [
  { value: 'just_browsing', label: 'Just browsing, not ready yet' },
  { value: 'privacy_concerns', label: 'Privacy or data concerns' },
  { value: 'no_google', label: "Don't want to use Google sign-in" },
  { value: 'not_sure_helpful', label: 'Not sure if this will help me' },
  { value: 'too_complicated', label: 'Seems too complicated' },
  { value: 'other', label: 'Other reason' },
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

  if (isSubmitted) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <div className="text-center py-8">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
              <Send className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Thanks for sharing!</h3>
            <p className="text-muted-foreground">Your feedback helps us make ReliefAnchor better for everyone.</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-3">
            <MessageSquare className="w-7 h-7 text-primary" />
          </div>
          <DialogTitle className="text-center text-xl">
            Quick question before you go
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <p className="text-center text-muted-foreground text-sm">
            What's holding you back from signing up? Your honest feedback helps us improve.
          </p>

          <RadioGroup value={selectedReason} onValueChange={setSelectedReason} className="space-y-2">
            {SURVEY_REASONS.map((reason) => (
              <div
                key={reason.value}
                className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                  selectedReason === reason.value
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setSelectedReason(reason.value)}
              >
                <RadioGroupItem value={reason.value} id={reason.value} />
                <Label htmlFor={reason.value} className="cursor-pointer flex-1 text-sm">
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
              className="min-h-[80px] text-sm"
              maxLength={500}
            />
          )}

          <div className="flex flex-col gap-2 pt-2">
            <Button
              onClick={handleSubmit}
              disabled={!selectedReason || isSubmitting}
              className="w-full"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </Button>
            <button
              onClick={handleSkip}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors py-2"
            >
              Skip
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
