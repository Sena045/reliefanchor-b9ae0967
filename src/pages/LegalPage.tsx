import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface LegalPageProps {
  onClose: () => void;
  initialTab?: 'privacy' | 'terms';
}

export function LegalPage({ onClose, initialTab = 'privacy' }: LegalPageProps) {
  return (
    <div className="min-h-screen bg-background p-4 safe-top">
      <div className="max-w-2xl mx-auto">
        <Button variant="ghost" onClick={onClose} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <Tabs defaultValue={initialTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="privacy">Privacy Policy</TabsTrigger>
            <TabsTrigger value="terms">Terms of Service</TabsTrigger>
          </TabsList>

          <TabsContent value="privacy">
            <Card>
              <CardHeader>
                <CardTitle>Privacy Policy</CardTitle>
                <p className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-4">
                <section>
                  <h3 className="text-lg font-semibold">1. Information We Collect</h3>
                  <p className="text-muted-foreground">
                    ReliefAnchor collects the following information to provide you with a personalized mental wellness experience:
                  </p>
                  <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                    <li><strong>Account Information:</strong> Email address and password for authentication</li>
                    <li><strong>Mood Data:</strong> Your mood entries and optional notes to track your emotional well-being</li>
                    <li><strong>Journal Entries:</strong> Your personal journal writings and reflections</li>
                    <li><strong>Chat History:</strong> Conversations with our AI companion Anya</li>
                    <li><strong>Preferences:</strong> Language settings and app preferences</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-lg font-semibold">2. How We Use Your Information</h3>
                  <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                    <li>To provide personalized mental wellness support</li>
                    <li>To track your mood patterns and provide insights (Premium feature)</li>
                    <li>To improve our AI responses and services</li>
                    <li>To send you reminders and notifications (with your consent)</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-lg font-semibold">3. Data Security</h3>
                  <p className="text-muted-foreground">
                    Your data is encrypted and stored securely using industry-standard security measures. 
                    We use Supabase for secure data storage with Row Level Security (RLS) policies ensuring 
                    only you can access your personal data.
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold">4. Data Sharing</h3>
                  <p className="text-muted-foreground">
                    We do not sell, rent, or share your personal information with third parties except:
                  </p>
                  <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                    <li>With your explicit consent</li>
                    <li>To comply with legal obligations</li>
                    <li>To protect our rights and safety</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-lg font-semibold">5. Your Rights</h3>
                  <p className="text-muted-foreground">You have the right to:</p>
                  <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                    <li>Access your personal data</li>
                    <li>Export your data at any time</li>
                    <li>
                      Delete your account and all associated data – 
                      <a 
                        href="/delete-account" 
                        className="text-primary hover:underline ml-1"
                      >
                        Request deletion here
                      </a>
                    </li>
                    <li>Opt-out of notifications</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-lg font-semibold">6. Contact Us</h3>
                  <p className="text-muted-foreground">
                    If you have questions about this Privacy Policy, please contact us at: 
                    <span className="font-medium"> support@reliefanchor.app</span>
                  </p>
                </section>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="terms">
            <Card>
              <CardHeader>
                <CardTitle>Terms of Service</CardTitle>
                <p className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-4">
                <section>
                  <h3 className="text-lg font-semibold">1. Acceptance of Terms</h3>
                  <p className="text-muted-foreground">
                    By accessing or using ReliefAnchor, you agree to be bound by these Terms of Service. 
                    If you do not agree to these terms, please do not use our service.
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold">2. Description of Service</h3>
                  <p className="text-muted-foreground">
                    ReliefAnchor is a mental wellness application that provides:
                  </p>
                  <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                    <li>AI-powered emotional support through our companion Anya</li>
                    <li>Mood tracking and journaling features</li>
                    <li>Wellness tools including breathing exercises, grounding techniques, and ambient sounds</li>
                    <li>Mental wellness games</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-lg font-semibold">3. Important Disclaimer</h3>
                  <p className="text-muted-foreground font-medium text-amber-600 dark:text-amber-400">
                    ReliefAnchor is NOT a substitute for professional mental health care. If you are experiencing 
                    a mental health crisis, please contact emergency services or a mental health professional immediately.
                  </p>
                  <p className="text-muted-foreground mt-2">
                    Our AI companion Anya is designed to provide supportive conversation but is not a licensed 
                    therapist or counselor.
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold">4. User Responsibilities</h3>
                  <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                    <li>You must be at least 13 years old to use this service</li>
                    <li>You are responsible for maintaining the confidentiality of your account</li>
                    <li>You agree not to use the service for any illegal purposes</li>
                    <li>You agree not to attempt to harm or exploit the service</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-lg font-semibold">5. Premium Subscription</h3>
                  <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                    <li>Premium features require a paid subscription</li>
                    <li>Subscriptions are billed monthly or annually</li>
                    <li>You may cancel your subscription at any time</li>
                    <li>Refunds are subject to our refund policy</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-lg font-semibold">6. Intellectual Property</h3>
                  <p className="text-muted-foreground">
                    All content, features, and functionality of ReliefAnchor are owned by us and are 
                    protected by international copyright, trademark, and other intellectual property laws.
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold">7. Limitation of Liability</h3>
                  <p className="text-muted-foreground">
                    ReliefAnchor and its creators shall not be liable for any indirect, incidental, 
                    special, consequential, or punitive damages resulting from your use of the service.
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold">8. Changes to Terms</h3>
                  <p className="text-muted-foreground">
                    We reserve the right to modify these terms at any time. We will notify users of 
                    significant changes via email or in-app notification.
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold">9. Contact</h3>
                  <p className="text-muted-foreground">
                    For questions about these Terms, contact us at: 
                    <span className="font-medium"> support@reliefanchor.app</span>
                  </p>
                </section>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}