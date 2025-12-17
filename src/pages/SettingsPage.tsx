import { Globe, Languages, Phone } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useTranslation } from '@/lib/translations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CRISIS_HELPLINES, Region, Language } from '@/types';

export function SettingsPage() {
  const { settings, setRegion, setLanguage } = useApp();
  const { t } = useTranslation(settings.language);
  const helplines = CRISIS_HELPLINES[settings.region];

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto safe-top">
      <div className="pt-4"><h1 className="text-xl font-semibold">{t('settings')}</h1></div>

      <Card><CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Globe className="h-4 w-4" />{t('region')}</CardTitle></CardHeader>
        <CardContent className="flex gap-2">
          {(['india', 'global'] as Region[]).map((r) => (
            <Button key={r} variant={settings.region === r ? 'default' : 'outline'} className="flex-1" onClick={() => setRegion(r)}>{t(r)}</Button>
          ))}
        </CardContent>
      </Card>

      <Card><CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Languages className="h-4 w-4" />{t('language')}</CardTitle></CardHeader>
        <CardContent className="flex gap-2">
          {(['en', 'hi'] as Language[]).map((l) => (
            <Button key={l} variant={settings.language === l ? 'default' : 'outline'} className="flex-1" onClick={() => setLanguage(l)}>{l === 'en' ? 'English' : 'हिंदी'}</Button>
          ))}
        </CardContent>
      </Card>

      <Card><CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Phone className="h-4 w-4" />{t('crisisHelp')}</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {helplines.map((line) => (
            <a key={line.phone} href={`tel:${line.phone.replace(/\D/g, '')}`} className="flex items-center justify-between p-2 rounded-lg bg-muted hover:bg-muted/80">
              <div><p className="text-sm font-medium">{line.name}</p><p className="text-xs text-muted-foreground">{line.description}</p></div>
              <span className="text-sm text-primary font-medium">{line.phone}</span>
            </a>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
