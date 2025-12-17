import { Languages, Crown, MessageCircle, BarChart3, Gamepad2, FileText, LogOut } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LANGUAGES } from '@/types';

export function SettingsPage() {
  const { profile, setLanguage, isPremium, premiumUntil } = useApp();
  const { signOut, user } = useAuth();

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto safe-top">
      <div className="pt-4"><h1 className="text-xl font-semibold">Settings</h1></div>

      {/* Account */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">{user?.email}</p>
          <Button variant="outline" size="sm" onClick={signOut} className="w-full">
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Languages className="h-4 w-4" />
            Language
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-2">
          {LANGUAGES.map((lang) => (
            <Button 
              key={lang.code} 
              variant={profile.language === lang.code ? 'default' : 'outline'} 
              className="justify-start"
              onClick={() => setLanguage(lang.code)}
            >
              {lang.native}
            </Button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Crown className="h-4 w-4 text-amber-500" />
            Premium Features
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isPremium ? (
            <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
              <p className="text-sm font-medium text-amber-600">✓ You have Premium access</p>
              {premiumUntil && (
                <p className="text-xs text-amber-600/80 mt-1">
                  Expires: {premiumUntil.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Upgrade to unlock all features
            </p>
          )}
          
          <div className="space-y-2">
            <FeatureItem 
              icon={MessageCircle} 
              title="Unlimited AI Chat" 
              description="Free: 5 messages/day" 
              isPremium={!isPremium}
            />
            <FeatureItem 
              icon={BarChart3} 
              title="Weekly Mood Insights" 
              description="Detailed analytics & trends" 
              isPremium={!isPremium}
            />
            <FeatureItem 
              icon={Gamepad2} 
              title="All Wellness Games" 
              description="Full access to all activities" 
              isPremium={!isPremium}
            />
            <FeatureItem 
              icon={FileText} 
              title="Export Journals" 
              description="Download your entries" 
              isPremium={!isPremium}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function FeatureItem({ 
  icon: Icon, 
  title, 
  description, 
  isPremium 
}: { 
  icon: typeof MessageCircle; 
  title: string; 
  description: string;
  isPremium: boolean;
}) {
  return (
    <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
      <Icon className="h-4 w-4 text-primary shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      {isPremium && (
        <span className="text-xs bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded">
          Premium
        </span>
      )}
    </div>
  );
}
