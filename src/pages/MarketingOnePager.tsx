import { Heart, MessageCircle, Brain, Gamepad2, Shield, Globe, Wind, Eye, Volume2, BookOpen, Check, Crown, Users, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MarketingOnePagerProps {
  onClose: () => void;
}

export function MarketingOnePager({ onClose }: MarketingOnePagerProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Print Controls - Hidden when printing */}
      <div className="print:hidden fixed top-4 right-4 z-50 flex gap-2">
        <Button onClick={handlePrint} className="shadow-lg">
          Save as PDF
        </Button>
        <Button variant="outline" onClick={onClose} className="shadow-lg bg-background">
          Close
        </Button>
      </div>

      {/* One-Pager Content - Optimized for A4 print */}
      <div className="max-w-[210mm] mx-auto p-8 print:p-12 bg-white text-gray-900 print:text-black">
        
        {/* Header */}
        <header className="text-center mb-8 pb-6 border-b-2 border-primary/20">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Heart className="h-10 w-10 text-primary print:text-gray-800" />
            <h1 className="text-4xl font-bold tracking-tight">ReliefAnchor</h1>
          </div>
          <p className="text-xl text-gray-600 font-medium">
            Your Quiet Corner for Everyday Calm
          </p>
          <p className="text-sm text-gray-500 mt-2">
            reliefanchor.com
          </p>
        </header>

        {/* Value Proposition */}
        <section className="mb-8">
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 print:bg-gray-100 rounded-xl p-6 text-center">
            <h2 className="text-2xl font-bold mb-3 text-gray-900">
              When your mind feels full, this is your quiet corner
            </h2>
            <p className="text-gray-600 max-w-xl mx-auto">
              A self-guided wellbeing app for people experiencing stress, overthinking, or emotional overload. 
              Private, simple, and judgment-free.
            </p>
          </div>
        </section>

        {/* Social Proof Bar */}
        <section className="mb-8">
          <div className="flex justify-center gap-8 text-sm">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary print:text-gray-700" />
              <span className="font-semibold">1,000+ Users</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                ))}
              </div>
              <span className="font-semibold">4.8/5 Rating</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              <span className="font-semibold">100% Private</span>
            </div>
          </div>
        </section>

        {/* Core Features Grid */}
        <section className="mb-8">
          <h3 className="text-lg font-bold mb-4 text-center text-gray-800">Core Features</h3>
          <div className="grid grid-cols-2 gap-4">
            <FeatureItem 
              icon={MessageCircle} 
              title="Anya AI Chat" 
              description="Supportive AI companion for talking through feelings, anytime"
            />
            <FeatureItem 
              icon={Brain} 
              title="Mood Tracking" 
              description="Log daily moods, view charts, and spot emotional patterns"
            />
            <FeatureItem 
              icon={Wind} 
              title="Breathing Exercises" 
              description="Guided 4-7-8 technique for calming the nervous system"
            />
            <FeatureItem 
              icon={Eye} 
              title="5-4-3-2-1 Grounding" 
              description="Sensory awareness exercise for anxiety relief"
            />
            <FeatureItem 
              icon={Volume2} 
              title="Ambient Sounds" 
              description="Rain, forest, campfire, brown noise, and premium sounds"
            />
            <FeatureItem 
              icon={BookOpen} 
              title="Journaling" 
              description="Prompted reflections saved privately and securely"
            />
            <FeatureItem 
              icon={Gamepad2} 
              title="Wellness Games" 
              description="Bubble pop, memory, gratitude jar, body scan, and more"
            />
            <FeatureItem 
              icon={Globe} 
              title="8 Languages" 
              description="EN, HI, ES, FR, DE, PT, ZH, JA — fully localized"
            />
          </div>
        </section>

        {/* Pricing Comparison */}
        <section className="mb-8">
          <h3 className="text-lg font-bold mb-4 text-center text-gray-800">Simple, Transparent Pricing</h3>
          <div className="grid grid-cols-2 gap-6">
            {/* Free Plan */}
            <div className="border-2 border-gray-200 rounded-xl p-5">
              <h4 className="text-lg font-bold mb-3">Free</h4>
              <p className="text-2xl font-bold mb-4">$0 <span className="text-sm font-normal text-gray-500">forever</span></p>
              <ul className="space-y-2 text-sm">
                <PricingItem text="5 AI messages per day" />
                <PricingItem text="Basic mood tracking" />
                <PricingItem text="Breathing & grounding exercises" />
                <PricingItem text="4 ambient sounds" />
                <PricingItem text="Private journaling" />
              </ul>
            </div>

            {/* Premium Plan */}
            <div className="border-2 border-primary print:border-gray-800 rounded-xl p-5 bg-primary/5 print:bg-gray-50 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary print:bg-gray-800 text-white text-xs px-3 py-1 rounded-full font-medium">
                Best Value
              </div>
              <h4 className="text-lg font-bold mb-3 flex items-center gap-2">
                <Crown className="h-5 w-5 text-primary print:text-gray-700" />
                Premium
              </h4>
              <p className="text-2xl font-bold mb-1">$4.99<span className="text-sm font-normal text-gray-500">/month</span></p>
              <p className="text-sm text-gray-500 mb-4">or $49.99/year (save $10)</p>
              <ul className="space-y-2 text-sm">
                <PricingItem text="Unlimited AI messages" highlight />
                <PricingItem text="Weekly mood insights & analytics" highlight />
                <PricingItem text="All wellness games unlocked" highlight />
                <PricingItem text="Premium sounds (ocean, sleep)" highlight />
                <PricingItem text="Export journal entries" highlight />
                <PricingItem text="Priority AI responses" highlight />
              </ul>
            </div>
          </div>
          <p className="text-center text-sm text-gray-500 mt-3">
            Also available in INR: ₹149/month or ₹1,499/year
          </p>
        </section>

        {/* Target Audience */}
        <section className="mb-8">
          <h3 className="text-lg font-bold mb-3 text-center text-gray-800">Who It's For</h3>
          <div className="flex flex-wrap justify-center gap-3 text-sm">
            <span className="bg-gray-100 px-4 py-2 rounded-full">Adults dealing with everyday stress</span>
            <span className="bg-gray-100 px-4 py-2 rounded-full">People seeking private self-reflection</span>
            <span className="bg-gray-100 px-4 py-2 rounded-full">Users wanting gradual, gentle support</span>
            <span className="bg-gray-100 px-4 py-2 rounded-full">Non-English speakers needing localized tools</span>
          </div>
        </section>

        {/* Key Differentiators */}
        <section className="mb-8">
          <h3 className="text-lg font-bold mb-3 text-center text-gray-800">What Makes Us Different</h3>
          <div className="grid grid-cols-3 gap-4 text-center text-sm">
            <div className="p-3">
              <Shield className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <p className="font-semibold">Privacy-First</p>
              <p className="text-gray-500 text-xs">Encrypted, never shared</p>
            </div>
            <div className="p-3">
              <Heart className="h-8 w-8 mx-auto mb-2 text-primary print:text-gray-700" />
              <p className="font-semibold">No Medical Claims</p>
              <p className="text-gray-500 text-xs">Self-care, not therapy</p>
            </div>
            <div className="p-3">
              <Globe className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <p className="font-semibold">Works Everywhere</p>
              <p className="text-gray-500 text-xs">PWA, installable, offline</p>
            </div>
          </div>
        </section>

        {/* CTA Footer */}
        <footer className="text-center pt-6 border-t-2 border-gray-200">
          <p className="text-xl font-bold mb-2">Start Your Wellness Journey Today</p>
          <p className="text-gray-600 mb-3">Free to use. No credit card required. Your data stays private.</p>
          <div className="flex justify-center gap-4 text-sm">
            <span className="font-semibold">🌐 reliefanchor.com</span>
            <span className="text-gray-400">|</span>
            <span className="text-gray-600">📧 contact@reliefanchor.com</span>
          </div>
        </footer>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
}

function FeatureItem({ icon: Icon, title, description }: { icon: typeof Heart; title: string; description: string }) {
  return (
    <div className="flex gap-3 p-3 bg-gray-50 rounded-lg">
      <Icon className="h-5 w-5 text-primary print:text-gray-700 shrink-0 mt-0.5" />
      <div>
        <p className="font-semibold text-sm">{title}</p>
        <p className="text-xs text-gray-600">{description}</p>
      </div>
    </div>
  );
}

function PricingItem({ text, highlight }: { text: string; highlight?: boolean }) {
  return (
    <li className="flex items-center gap-2">
      <Check className={`h-4 w-4 shrink-0 ${highlight ? 'text-primary print:text-gray-700' : 'text-gray-400'}`} />
      <span className={highlight ? 'font-medium' : ''}>{text}</span>
    </li>
  );
}
