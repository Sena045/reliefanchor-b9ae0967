import { ArrowLeft, Heart, Wind, Brain, Shield, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface AboutPageProps {
  onClose: () => void;
}

export function AboutPage({ onClose }: AboutPageProps) {
  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Go back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">About ReliefAnchor</h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Hero Section */}
        <section className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
            <Heart className="h-10 w-10 text-primary" aria-hidden="true" />
          </div>
          <h2 className="text-3xl font-bold mb-4">ReliefAnchor</h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            A simple web-based breathing and relaxation app designed to help people feel calmer during stressful moments.
          </p>
        </section>

        {/* Mission */}
        <section className="mb-12">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />
                Our Mission
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                ReliefAnchor offers guided breathing exercises and calming tools for daily wellbeing. 
                We believe that everyone deserves access to simple, effective techniques for managing 
                stress and finding moments of peace in their busy lives.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Features */}
        <section className="mb-12">
          <h3 className="text-xl font-semibold mb-6 text-center">What We Offer</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Wind className="h-5 w-5 text-primary" aria-hidden="true" />
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Guided Breathing</h4>
                    <p className="text-sm text-muted-foreground">
                      Follow along with calming breathing exercises designed to reduce stress and anxiety.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Brain className="h-5 w-5 text-primary" aria-hidden="true" />
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Wellness Tools</h4>
                    <p className="text-sm text-muted-foreground">
                      Access a variety of relaxation techniques and mindfulness exercises.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Heart className="h-5 w-5 text-primary" aria-hidden="true" />
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Mood Tracking</h4>
                    <p className="text-sm text-muted-foreground">
                      Monitor your emotional wellbeing and discover patterns over time.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Shield className="h-5 w-5 text-primary" aria-hidden="true" />
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Privacy First</h4>
                    <p className="text-sm text-muted-foreground">
                      Your data stays private and secure. Your wellbeing journey is personal.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Call to Action */}
        <section className="text-center">
          <p className="text-muted-foreground mb-4">
            Ready to find your calm?
          </p>
          <Button onClick={onClose} size="lg">
            Get Started
          </Button>
        </section>
      </div>
    </main>
  );
}

export default AboutPage;
