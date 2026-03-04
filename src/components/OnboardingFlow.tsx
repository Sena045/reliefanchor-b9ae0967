import { useState, useEffect } from 'react';
import { MessageCircle, Smile, Wind, ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface OnboardingFlowProps {
  onNavigate: (tab: string) => void;
  onComplete: () => void;
}

const steps = [
  {
    id: 'welcome',
    icon: Sparkles,
    title: 'Welcome to ReliefAnchor 🎉',
    subtitle: "Let's set you up in 30 seconds",
    description: 'ReliefAnchor is your private space for mental wellness. Here are 3 things you can do:',
    features: [
      { icon: MessageCircle, label: 'Talk to Anya', desc: 'Your caring AI companion' },
      { icon: Smile, label: 'Track your mood', desc: 'See patterns over time' },
      { icon: Wind, label: 'Wellness tools', desc: 'Breathing, grounding & more' },
    ],
  },
  {
    id: 'chat',
    icon: MessageCircle,
    title: 'Say hi to Anya 💬',
    subtitle: 'Your AI companion who truly listens',
    description: "Anya adapts to how you feel. She's not a therapist, but she's always here — judgment-free, 24/7. Try saying \"I had a rough day\" to start.",
    action: 'chat',
    actionLabel: 'Start a Conversation',
  },
  {
    id: 'mood',
    icon: Smile,
    title: 'How are you feeling? 📊',
    subtitle: 'Track your emotions daily',
    description: "Logging your mood takes 5 seconds and helps you notice patterns. Over time, you'll see what affects your wellbeing most.",
    action: 'mood',
    actionLabel: 'Log Your First Mood',
  },
  {
    id: 'tools',
    icon: Wind,
    title: 'Your wellness toolkit 🧘',
    subtitle: 'Calm your mind anytime',
    description: 'Try a 1-minute breathing exercise, grounding techniques, or ambient sounds. These tools are always available when you need a moment of peace.',
    action: 'tools',
    actionLabel: 'Explore Tools',
  },
];

export function OnboardingFlow({ onNavigate, onComplete }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const Icon = step.icon;

  const handleAction = () => {
    if (step.action) {
      setCompletedSteps(prev => new Set([...prev, step.id]));
      onNavigate(step.action);
    }
  };

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <div className="p-4 max-w-lg mx-auto safe-top space-y-6">
      {/* Progress */}
      <div className="flex items-center justify-between pt-6">
        <div className="flex gap-1.5">
          {steps.map((s, i) => (
            <div
              key={s.id}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === currentStep
                  ? 'w-8 bg-primary'
                  : i < currentStep
                  ? 'w-4 bg-primary/50'
                  : 'w-4 bg-muted'
              }`}
            />
          ))}
        </div>
        <button
          onClick={handleSkip}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Skip tour
        </button>
      </div>

      {/* Step Content */}
      <div className="text-center space-y-4 animate-fade-in" key={step.id}>
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
          <Icon className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-2xl font-display font-bold text-foreground">{step.title}</h1>
        <p className="text-sm text-muted-foreground">{step.subtitle}</p>
        <p className="text-sm text-foreground/80 leading-relaxed max-w-sm mx-auto">{step.description}</p>
      </div>

      {/* Welcome step features */}
      {step.id === 'welcome' && step.features && (
        <div className="space-y-3">
          {step.features.map(f => {
            const FIcon = f.icon;
            return (
              <Card key={f.label} className="border-border">
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <FIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium">{f.label}</p>
                    <p className="text-xs text-muted-foreground">{f.desc}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Action button for feature steps */}
      {step.action && (
        <Button
          onClick={handleAction}
          className="w-full"
          size="lg"
        >
          {step.actionLabel}
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      )}

      {/* Navigation */}
      <div className="flex gap-3">
        {currentStep > 0 && (
          <Button
            variant="outline"
            onClick={() => setCurrentStep(prev => prev - 1)}
            className="flex-1"
          >
            Back
          </Button>
        )}
        <Button
          onClick={handleNext}
          variant={step.action ? 'outline' : 'default'}
          className="flex-1"
        >
          {isLastStep ? "I'm ready! Let's go" : 'Next'}
          {!isLastStep && <ArrowRight className="h-4 w-4 ml-2" />}
        </Button>
      </div>
    </div>
  );
}
