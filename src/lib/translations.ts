import { Language } from '@/types';

type TranslationKey = 
  | 'appName'
  | 'home'
  | 'chat'
  | 'mood'
  | 'tools'
  | 'settings'
  | 'welcome'
  | 'welcomeSubtitle'
  | 'talkToAnya'
  | 'trackMood'
  | 'wellnessTools'
  | 'breathing'
  | 'grounding'
  | 'sounds'
  | 'journal'
  | 'premium'
  | 'getPremium'
  | 'unlockFeatures'
  | 'messagesRemaining'
  | 'upgradeNow'
  | 'typeMessage'
  | 'send'
  | 'howAreYou'
  | 'addNote'
  | 'logMood'
  | 'moodHistory'
  | 'last7Days'
  | 'last30Days'
  | 'breathingExercise'
  | 'groundingExercise'
  | 'ambientSounds'
  | 'journalPrompt'
  | 'writeHere'
  | 'save'
  | 'region'
  | 'language'
  | 'india'
  | 'global'
  | 'english'
  | 'hindi'
  | 'apiKey'
  | 'geminiApiKey'
  | 'enterApiKey'
  | 'crisisHelp'
  | 'needHelp'
  | 'happy'
  | 'calm'
  | 'sad'
  | 'anxious'
  | 'angry'
  | 'rain'
  | 'forest'
  | 'brownNoise'
  | 'inhale'
  | 'hold'
  | 'exhale'
  | 'startBreathing'
  | 'stopBreathing';

const translations: Record<Language, Record<TranslationKey, string>> = {
  en: {
    appName: 'ReliefAnchor',
    home: 'Home',
    chat: 'Chat',
    mood: 'Mood',
    tools: 'Tools',
    settings: 'Settings',
    welcome: 'Welcome to ReliefAnchor',
    welcomeSubtitle: 'Your safe space for mental wellness',
    talkToAnya: 'Talk to Anya',
    trackMood: 'Track Mood',
    wellnessTools: 'Wellness Tools',
    breathing: 'Breathing',
    grounding: 'Grounding',
    sounds: 'Sounds',
    journal: 'Journal',
    premium: 'Premium',
    getPremium: 'Get Premium',
    unlockFeatures: 'Unlock unlimited messages and weekly insights',
    messagesRemaining: 'messages remaining today',
    upgradeNow: 'Upgrade Now',
    typeMessage: 'Type your message...',
    send: 'Send',
    howAreYou: 'How are you feeling?',
    addNote: 'Add a note (optional)',
    logMood: 'Log Mood',
    moodHistory: 'Mood History',
    last7Days: 'Last 7 Days',
    last30Days: 'Last 30 Days',
    breathingExercise: '4-7-8 Breathing',
    groundingExercise: '5-4-3-2-1 Grounding',
    ambientSounds: 'Ambient Sounds',
    journalPrompt: 'Journal Prompt',
    writeHere: 'Write your thoughts here...',
    save: 'Save',
    region: 'Region',
    language: 'Language',
    india: 'India',
    global: 'Global',
    english: 'English',
    hindi: 'हिंदी',
    apiKey: 'API Key',
    geminiApiKey: 'Gemini API Key',
    enterApiKey: 'Enter your Gemini API key',
    crisisHelp: 'Crisis Helplines',
    needHelp: 'Need immediate help?',
    happy: 'Happy',
    calm: 'Calm',
    sad: 'Sad',
    anxious: 'Anxious',
    angry: 'Angry',
    rain: 'Rain',
    forest: 'Forest',
    brownNoise: 'Brown Noise',
    inhale: 'Inhale',
    hold: 'Hold',
    exhale: 'Exhale',
    startBreathing: 'Start',
    stopBreathing: 'Stop',
  },
  hi: {
    appName: 'रिलीफ़ एंकर',
    home: 'होम',
    chat: 'चैट',
    mood: 'मूड',
    tools: 'टूल्स',
    settings: 'सेटिंग्स',
    welcome: 'रिलीफ़ एंकर में स्वागत है',
    welcomeSubtitle: 'मानसिक स्वास्थ्य के लिए आपका सुरक्षित स्थान',
    talkToAnya: 'अन्या से बात करें',
    trackMood: 'मूड ट्रैक करें',
    wellnessTools: 'वेलनेस टूल्स',
    breathing: 'सांस लेना',
    grounding: 'ग्राउंडिंग',
    sounds: 'ध्वनियाँ',
    journal: 'जर्नल',
    premium: 'प्रीमियम',
    getPremium: 'प्रीमियम लें',
    unlockFeatures: 'असीमित संदेश और साप्ताहिक अंतर्दृष्टि अनलॉक करें',
    messagesRemaining: 'आज के संदेश शेष',
    upgradeNow: 'अभी अपग्रेड करें',
    typeMessage: 'अपना संदेश लिखें...',
    send: 'भेजें',
    howAreYou: 'आप कैसा महसूस कर रहे हैं?',
    addNote: 'नोट जोड़ें (वैकल्पिक)',
    logMood: 'मूड लॉग करें',
    moodHistory: 'मूड इतिहास',
    last7Days: 'पिछले 7 दिन',
    last30Days: 'पिछले 30 दिन',
    breathingExercise: '4-7-8 श्वास',
    groundingExercise: '5-4-3-2-1 ग्राउंडिंग',
    ambientSounds: 'परिवेश ध्वनियाँ',
    journalPrompt: 'जर्नल प्रॉम्प्ट',
    writeHere: 'यहाँ अपने विचार लिखें...',
    save: 'सहेजें',
    region: 'क्षेत्र',
    language: 'भाषा',
    india: 'भारत',
    global: 'वैश्विक',
    english: 'English',
    hindi: 'हिंदी',
    apiKey: 'API कुंजी',
    geminiApiKey: 'Gemini API कुंजी',
    enterApiKey: 'अपनी Gemini API कुंजी दर्ज करें',
    crisisHelp: 'संकट हेल्पलाइन',
    needHelp: 'तत्काल मदद चाहिए?',
    happy: 'खुश',
    calm: 'शांत',
    sad: 'उदास',
    anxious: 'चिंतित',
    angry: 'गुस्सा',
    rain: 'बारिश',
    forest: 'जंगल',
    brownNoise: 'ब्राउन नॉइज़',
    inhale: 'श्वास लें',
    hold: 'रोकें',
    exhale: 'छोड़ें',
    startBreathing: 'शुरू करें',
    stopBreathing: 'रोकें',
  },
};

export function useTranslation(language: Language) {
  return {
    t: (key: TranslationKey): string => translations[language][key] || key,
  };
}

export const t = (key: TranslationKey, language: Language): string => {
  return translations[language][key] || key;
};
