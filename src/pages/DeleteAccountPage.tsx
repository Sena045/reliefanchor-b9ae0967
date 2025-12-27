import { useState } from 'react';
import { ArrowLeft, Trash2, AlertTriangle, Mail } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface DeleteAccountPageProps {
  onClose: () => void;
}

export function DeleteAccountPage({ onClose }: DeleteAccountPageProps) {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [confirmEmail, setConfirmEmail] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    if (!user) return;
    
    if (confirmEmail !== user.email) {
      toast({ 
        title: 'Email does not match', 
        description: 'Please enter your email address exactly as shown.',
        variant: 'destructive' 
      });
      return;
    }

    const confirmed = window.confirm(
      'This action is PERMANENT and cannot be undone. All your data including chat history, mood entries, and journal entries will be permanently deleted. Are you absolutely sure?'
    );
    
    if (!confirmed) return;

    setIsDeleting(true);

    try {
      // Delete user data from all tables
      const userId = user.id;
      
      await Promise.all([
        supabase.from('chat_history').delete().eq('user_id', userId),
        supabase.from('mood_entries').delete().eq('user_id', userId),
        supabase.from('journal_entries').delete().eq('user_id', userId),
        supabase.from('feedback').delete().eq('user_id', userId),
        supabase.from('push_subscriptions').delete().eq('user_id', userId),
        supabase.from('referrals').delete().eq('referrer_id', userId),
      ]);

      // Delete profile
      await supabase.from('profiles').delete().eq('id', userId);

      // Sign out the user
      await signOut();

      toast({ 
        title: 'Account deleted', 
        description: 'Your account and all associated data have been permanently deleted.' 
      });

      // Redirect to home
      window.location.href = '/';
    } catch (error) {
      console.error('Error deleting account:', error);
      toast({ 
        title: 'Failed to delete account', 
        description: 'Please try again or contact support.',
        variant: 'destructive' 
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Delete Account</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-6">
        {user ? (
          // Authenticated user - show delete form
          <>
            <Card className="border-destructive/50">
              <CardHeader>
                <div className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  <CardTitle className="text-destructive">Danger Zone</CardTitle>
                </div>
                <CardDescription>
                  Deleting your account is permanent and cannot be undone.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground space-y-2">
                  <p>This will permanently delete:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Your profile and account information</li>
                    <li>All chat history and conversations</li>
                    <li>All mood entries and tracking data</li>
                    <li>All journal entries</li>
                    <li>Any referral rewards and premium status</li>
                    <li>Push notification subscriptions</li>
                  </ul>
                </div>

                <div className="pt-4 border-t space-y-3">
                  <p className="text-sm font-medium">
                    To confirm, please enter your email address:
                  </p>
                  <p className="text-sm text-muted-foreground font-mono bg-muted px-2 py-1 rounded">
                    {user.email}
                  </p>
                  <Input
                    type="email"
                    placeholder="Enter your email to confirm"
                    value={confirmEmail}
                    onChange={(e) => setConfirmEmail(e.target.value)}
                    className="max-w-sm"
                  />
                </div>

                <Button 
                  variant="destructive" 
                  onClick={handleDeleteAccount}
                  disabled={isDeleting || confirmEmail !== user.email}
                  className="w-full sm:w-auto"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {isDeleting ? 'Deleting...' : 'Permanently Delete My Account'}
                </Button>
              </CardContent>
            </Card>
          </>
        ) : (
          // Not authenticated - show instructions
          <Card>
            <CardHeader>
              <CardTitle>Delete Your Account</CardTitle>
              <CardDescription>
                To delete your ReliefAnchor account and all associated data, please follow the instructions below.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 text-sm">
                <p className="font-medium">Option 1: Delete from the app</p>
                <ol className="list-decimal list-inside space-y-2 ml-2 text-muted-foreground">
                  <li>Sign in to your ReliefAnchor account</li>
                  <li>Return to this page while signed in</li>
                  <li>Follow the deletion process</li>
                </ol>
              </div>

              <div className="space-y-3 text-sm pt-4 border-t">
                <p className="font-medium">Option 2: Contact us</p>
                <p className="text-muted-foreground">
                  Send us an email from the address associated with your account, and we'll process your deletion request within 48 hours.
                </p>
                <a 
                  href="mailto:arindamsen.2024@outlook.com?subject=Account%20Deletion%20Request"
                  className="inline-flex items-center gap-2 text-primary hover:underline"
                >
                  <Mail className="h-4 w-4" />
                  arindamsen.2024@outlook.com
                </a>
              </div>

              <div className="pt-4 border-t">
                <Button onClick={onClose} variant="outline">
                  Go Back
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

export default DeleteAccountPage;
