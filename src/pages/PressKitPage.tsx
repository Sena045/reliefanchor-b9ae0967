import { ArrowLeft, Download, Mail, Globe, Heart, Brain, Sparkles, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PressKitPageProps {
  onClose: () => void;
}

export function PressKitPage({ onClose }: PressKitPageProps) {
  const handleDownloadLogo = () => {
    // Open the logo in a new tab for download
    window.open('/icon-512.png', '_blank');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Button variant="ghost" size="sm" onClick={onClose}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        {/* Hero */}
        <div className="text-center space-y-4">
          <img 
            src="/icon-192.png" 
            alt="ReliefAnchor Logo" 
            className="w-20 h-20 mx-auto rounded-2xl shadow-lg"
          />
          <h1 className="text-3xl font-bold">Press Kit</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Everything you need to write about ReliefAnchor. Download assets, copy descriptions, and learn about our mission.
          </p>
        </div>

        {/* Boilerplate */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">About ReliefAnchor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Short Description (50 words)</h3>
              <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                ReliefAnchor is a mental wellness companion app featuring AI-powered chat support, mood tracking, breathing exercises, ambient sounds, and mindfulness games. Available as a progressive web app, it helps users manage stress, anxiety, and emotional well-being through evidence-based tools and personalized insights.
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-2">Long Description (100 words)</h3>
              <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                ReliefAnchor is a comprehensive mental wellness platform designed to support users on their emotional health journey. The app combines AI-powered conversational support with Anya, our empathetic chatbot, alongside practical tools like 4-7-8 breathing exercises, 5-4-3-2-1 grounding techniques, and soothing ambient soundscapes. Users can track their moods over time, receive AI-generated insights about their emotional patterns, and engage with therapeutic games. Built as a progressive web app, ReliefAnchor is accessible on any device without downloads. Supporting 8 languages, it serves users worldwide in their mental wellness journey.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Key Features */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Key Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <MessageCircle className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium text-sm">AI Chat Support</h4>
                  <p className="text-xs text-muted-foreground">Empathetic conversations with Anya, available 24/7</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Heart className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium text-sm">Mood Tracking</h4>
                  <p className="text-xs text-muted-foreground">Visual mood history with AI-powered insights</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Brain className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium text-sm">Wellness Tools</h4>
                  <p className="text-xs text-muted-foreground">Breathing exercises, grounding, ambient sounds</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium text-sm">Mindfulness Games</h4>
                  <p className="text-xs text-muted-foreground">Interactive activities for mental wellness</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Facts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Facts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div className="p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-primary">8</div>
                <div className="text-xs text-muted-foreground">Languages</div>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-primary">PWA</div>
                <div className="text-xs text-muted-foreground">Technology</div>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-primary">24/7</div>
                <div className="text-xs text-muted-foreground">Available</div>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-primary">Free</div>
                <div className="text-xs text-muted-foreground">To Start</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Brand Assets */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Brand Assets</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
              <img 
                src="/icon-192.png" 
                alt="ReliefAnchor Logo" 
                className="w-16 h-16 rounded-xl"
              />
              <div className="flex-1">
                <h4 className="font-medium">App Icon</h4>
                <p className="text-sm text-muted-foreground">512x512 PNG, transparent background</p>
              </div>
              <Button size="sm" variant="outline" onClick={handleDownloadLogo}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Brand Colors</h4>
              <div className="flex gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary" />
                  <span className="text-sm text-muted-foreground">Primary (Teal)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-accent" />
                  <span className="text-sm text-muted-foreground">Accent</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <Globe className="h-5 w-5 text-muted-foreground" />
              <a 
                href="https://reliefanchor.lovable.app" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                reliefanchor.lovable.app
              </a>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                For press inquiries, reach out via the app
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground pb-8">
          Last updated: December 2024
        </p>
      </div>
    </div>
  );
}
