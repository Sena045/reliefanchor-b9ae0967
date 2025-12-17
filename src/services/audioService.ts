type NoiseType = 'rain' | 'forest' | 'brown' | 'campfire';

interface AudioNodes {
  context: AudioContext;
  masterGain: GainNode;
  sources: AudioBufferSourceNode[];
  oscillators: OscillatorNode[];
  intervals: ReturnType<typeof setInterval>[];
  timeouts: ReturnType<typeof setTimeout>[];
  gainNodes: GainNode[];
}

let audioNodes: AudioNodes | null = null;
let currentNoise: NoiseType | null = null;

// Generate high-quality noise buffer with stereo variance
function createNoiseBuffer(context: AudioContext, seconds: number, type: 'white' | 'pink' | 'brown' = 'white'): AudioBuffer {
  const sampleRate = context.sampleRate;
  const bufferSize = seconds * sampleRate;
  const buffer = context.createBuffer(2, bufferSize, sampleRate);
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);
  
  // Pink/brown noise state
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  let lastOut = 0;
  
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    const whiteR = Math.random() * 2 - 1;
    
    if (type === 'pink') {
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      left[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
      right[i] = left[i] * 0.9 + whiteR * 0.1;
    } else if (type === 'brown') {
      lastOut = (lastOut + (0.02 * white)) / 1.02;
      left[i] = lastOut * 3.5;
      right[i] = left[i] * 0.95 + (Math.random() * 2 - 1) * 0.05;
    } else {
      left[i] = white;
      right[i] = whiteR * 0.8 + white * 0.2;
    }
  }
  
  return buffer;
}

// Production-quality rain with multiple layers
function createRainSound(context: AudioContext, masterGain: GainNode): AudioBufferSourceNode[] {
  const sources: AudioBufferSourceNode[] = [];
  const whiteNoise = createNoiseBuffer(context, 6, 'white');
  const pinkNoise = createNoiseBuffer(context, 6, 'pink');
  
  // Heavy rain base - filtered white noise
  const baseSource = context.createBufferSource();
  baseSource.buffer = whiteNoise;
  baseSource.loop = true;
  
  const baseLowpass = context.createBiquadFilter();
  baseLowpass.type = 'lowpass';
  baseLowpass.frequency.value = 1200;
  baseLowpass.Q.value = 0.5;
  
  const baseHighpass = context.createBiquadFilter();
  baseHighpass.type = 'highpass';
  baseHighpass.frequency.value = 200;
  baseHighpass.Q.value = 0.3;
  
  const baseGain = context.createGain();
  baseGain.gain.value = 0.18;
  
  baseSource.connect(baseLowpass);
  baseLowpass.connect(baseHighpass);
  baseHighpass.connect(baseGain);
  baseGain.connect(masterGain);
  baseSource.start();
  sources.push(baseSource);
  
  // Light drizzle texture - higher frequency
  const drizzleSource = context.createBufferSource();
  drizzleSource.buffer = pinkNoise;
  drizzleSource.loop = true;
  
  const drizzleBandpass = context.createBiquadFilter();
  drizzleBandpass.type = 'bandpass';
  drizzleBandpass.frequency.value = 4000;
  drizzleBandpass.Q.value = 0.8;
  
  const drizzleGain = context.createGain();
  drizzleGain.gain.value = 0.04;
  
  // Subtle modulation for natural variation
  const drizzleLFO = context.createOscillator();
  drizzleLFO.frequency.value = 0.15;
  const drizzleLFOGain = context.createGain();
  drizzleLFOGain.gain.value = 0.015;
  drizzleLFO.connect(drizzleLFOGain);
  drizzleLFOGain.connect(drizzleGain.gain);
  drizzleLFO.start();
  
  drizzleSource.connect(drizzleBandpass);
  drizzleBandpass.connect(drizzleGain);
  drizzleGain.connect(masterGain);
  drizzleSource.start();
  sources.push(drizzleSource);
  
  // Rain on window/surface texture
  const surfaceSource = context.createBufferSource();
  surfaceSource.buffer = whiteNoise;
  surfaceSource.loop = true;
  
  const surfaceFilter = context.createBiquadFilter();
  surfaceFilter.type = 'bandpass';
  surfaceFilter.frequency.value = 2200;
  surfaceFilter.Q.value = 1.5;
  
  const surfaceGain = context.createGain();
  surfaceGain.gain.value = 0.025;
  
  surfaceSource.connect(surfaceFilter);
  surfaceFilter.connect(surfaceGain);
  surfaceGain.connect(masterGain);
  surfaceSource.start();
  sources.push(surfaceSource);
  
  // Distant thunder rumble (very subtle)
  const thunderSource = context.createBufferSource();
  thunderSource.buffer = createNoiseBuffer(context, 8, 'brown');
  thunderSource.loop = true;
  
  const thunderFilter = context.createBiquadFilter();
  thunderFilter.type = 'lowpass';
  thunderFilter.frequency.value = 80;
  thunderFilter.Q.value = 0.7;
  
  const thunderGain = context.createGain();
  thunderGain.gain.value = 0.06;
  
  // Slow breathing modulation
  const thunderLFO = context.createOscillator();
  thunderLFO.frequency.value = 0.03;
  const thunderLFOGain = context.createGain();
  thunderLFOGain.gain.value = 0.03;
  thunderLFO.connect(thunderLFOGain);
  thunderLFOGain.connect(thunderGain.gain);
  thunderLFO.start();
  
  thunderSource.connect(thunderFilter);
  thunderFilter.connect(thunderGain);
  thunderGain.connect(masterGain);
  thunderSource.start();
  sources.push(thunderSource);
  
  return sources;
}

// Production forest with rich layering
function createForestSound(context: AudioContext, masterGain: GainNode): { sources: AudioBufferSourceNode[], oscillators: OscillatorNode[] } {
  const sources: AudioBufferSourceNode[] = [];
  const oscillators: OscillatorNode[] = [];
  const pinkNoise = createNoiseBuffer(context, 6, 'pink');
  
  // Gentle wind through leaves
  const windSource = context.createBufferSource();
  windSource.buffer = pinkNoise;
  windSource.loop = true;
  
  const windFilter = context.createBiquadFilter();
  windFilter.type = 'lowpass';
  windFilter.frequency.value = 500;
  windFilter.Q.value = 0.8;
  
  const windGain = context.createGain();
  windGain.gain.value = 0.1;
  
  // Natural wind variation
  const windLFO = context.createOscillator();
  windLFO.frequency.value = 0.08;
  const windLFOGain = context.createGain();
  windLFOGain.gain.value = 200;
  windLFO.connect(windLFOGain);
  windLFOGain.connect(windFilter.frequency);
  windLFO.start();
  oscillators.push(windLFO);
  
  windSource.connect(windFilter);
  windFilter.connect(windGain);
  windGain.connect(masterGain);
  windSource.start();
  sources.push(windSource);
  
  // Rustling leaves layer
  const rustleSource = context.createBufferSource();
  rustleSource.buffer = createNoiseBuffer(context, 4, 'white');
  rustleSource.loop = true;
  
  const rustleFilter = context.createBiquadFilter();
  rustleFilter.type = 'bandpass';
  rustleFilter.frequency.value = 3000;
  rustleFilter.Q.value = 2;
  
  const rustleGain = context.createGain();
  rustleGain.gain.value = 0.02;
  
  const rustleLFO = context.createOscillator();
  rustleLFO.frequency.value = 0.2;
  const rustleLFOGain = context.createGain();
  rustleLFOGain.gain.value = 0.015;
  rustleLFO.connect(rustleLFOGain);
  rustleLFOGain.connect(rustleGain.gain);
  rustleLFO.start();
  oscillators.push(rustleLFO);
  
  rustleSource.connect(rustleFilter);
  rustleFilter.connect(rustleGain);
  rustleGain.connect(masterGain);
  rustleSource.start();
  sources.push(rustleSource);
  
  // Bird songs - multiple melodic tones
  const birdFreqs = [
    { base: 2200, mod: 0.4, amp: 0.006 },
    { base: 2800, mod: 0.5, amp: 0.005 },
    { base: 3400, mod: 0.35, amp: 0.004 },
    { base: 1800, mod: 0.6, amp: 0.004 },
  ];
  
  birdFreqs.forEach(({ base, mod, amp }) => {
    const osc = context.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = base;
    
    const oscGain = context.createGain();
    oscGain.gain.value = 0;
    
    // Frequency warble
    const freqLFO = context.createOscillator();
    freqLFO.frequency.value = 6 + Math.random() * 4;
    const freqLFOGain = context.createGain();
    freqLFOGain.gain.value = base * 0.02;
    freqLFO.connect(freqLFOGain);
    freqLFOGain.connect(osc.frequency);
    freqLFO.start();
    oscillators.push(freqLFO);
    
    // Amplitude chirp pattern
    const ampLFO = context.createOscillator();
    ampLFO.frequency.value = mod;
    const ampLFOGain = context.createGain();
    ampLFOGain.gain.value = amp;
    ampLFO.connect(ampLFOGain);
    ampLFOGain.connect(oscGain.gain);
    ampLFO.start();
    oscillators.push(ampLFO);
    
    osc.connect(oscGain);
    oscGain.connect(masterGain);
    osc.start();
    oscillators.push(osc);
  });
  
  // Distant stream/water
  const streamSource = context.createBufferSource();
  streamSource.buffer = createNoiseBuffer(context, 5, 'pink');
  streamSource.loop = true;
  
  const streamFilter = context.createBiquadFilter();
  streamFilter.type = 'bandpass';
  streamFilter.frequency.value = 800;
  streamFilter.Q.value = 1.2;
  
  const streamGain = context.createGain();
  streamGain.gain.value = 0.03;
  
  streamSource.connect(streamFilter);
  streamFilter.connect(streamGain);
  streamGain.connect(masterGain);
  streamSource.start();
  sources.push(streamSource);
  
  return { sources, oscillators };
}

// Production brown noise - deep and smooth
function createBrownSound(context: AudioContext, masterGain: GainNode): AudioBufferSourceNode[] {
  const sources: AudioBufferSourceNode[] = [];
  const brownNoise = createNoiseBuffer(context, 8, 'brown');
  
  // Primary deep brown layer
  const mainSource = context.createBufferSource();
  mainSource.buffer = brownNoise;
  mainSource.loop = true;
  
  const mainFilter1 = context.createBiquadFilter();
  mainFilter1.type = 'lowpass';
  mainFilter1.frequency.value = 250;
  mainFilter1.Q.value = 0.4;
  
  const mainFilter2 = context.createBiquadFilter();
  mainFilter2.type = 'lowpass';
  mainFilter2.frequency.value = 180;
  mainFilter2.Q.value = 0.3;
  
  const mainGain = context.createGain();
  mainGain.gain.value = 0.35;
  
  mainSource.connect(mainFilter1);
  mainFilter1.connect(mainFilter2);
  mainFilter2.connect(mainGain);
  mainGain.connect(masterGain);
  mainSource.start();
  sources.push(mainSource);
  
  // Warmth layer - slightly higher frequency content
  const warmSource = context.createBufferSource();
  warmSource.buffer = brownNoise;
  warmSource.loop = true;
  
  const warmFilter = context.createBiquadFilter();
  warmFilter.type = 'bandpass';
  warmFilter.frequency.value = 120;
  warmFilter.Q.value = 0.8;
  
  const warmGain = context.createGain();
  warmGain.gain.value = 0.15;
  
  warmSource.connect(warmFilter);
  warmFilter.connect(warmGain);
  warmGain.connect(masterGain);
  warmSource.start();
  sources.push(warmSource);
  
  // Sub-bass rumble
  const subSource = context.createBufferSource();
  subSource.buffer = brownNoise;
  subSource.loop = true;
  
  const subFilter = context.createBiquadFilter();
  subFilter.type = 'lowpass';
  subFilter.frequency.value = 60;
  subFilter.Q.value = 0.5;
  
  const subGain = context.createGain();
  subGain.gain.value = 0.2;
  
  subSource.connect(subFilter);
  subFilter.connect(subGain);
  subGain.connect(masterGain);
  subSource.start();
  sources.push(subSource);
  
  return sources;
}

// Production campfire - cozy and immersive
function createCampfireSound(context: AudioContext, masterGain: GainNode): { 
  sources: AudioBufferSourceNode[], 
  oscillators: OscillatorNode[],
  intervals: ReturnType<typeof setInterval>[],
  timeouts: ReturnType<typeof setTimeout>[]
} {
  const sources: AudioBufferSourceNode[] = [];
  const oscillators: OscillatorNode[] = [];
  const intervals: ReturnType<typeof setInterval>[] = [];
  const timeouts: ReturnType<typeof setTimeout>[] = [];
  
  const whiteNoise = createNoiseBuffer(context, 6, 'white');
  const brownNoise = createNoiseBuffer(context, 6, 'brown');
  
  // Fire crackle - main texture
  const crackleSource = context.createBufferSource();
  crackleSource.buffer = whiteNoise;
  crackleSource.loop = true;
  
  const crackleBandpass = context.createBiquadFilter();
  crackleBandpass.type = 'bandpass';
  crackleBandpass.frequency.value = 800;
  crackleBandpass.Q.value = 2.5;
  
  const crackleHighpass = context.createBiquadFilter();
  crackleHighpass.type = 'highpass';
  crackleHighpass.frequency.value = 300;
  
  const crackleGain = context.createGain();
  crackleGain.gain.value = 0.05;
  
  // Modulate crackle for realism
  const crackleLFO = context.createOscillator();
  crackleLFO.frequency.value = 12;
  const crackleLFOGain = context.createGain();
  crackleLFOGain.gain.value = 400;
  crackleLFO.connect(crackleLFOGain);
  crackleLFOGain.connect(crackleBandpass.frequency);
  crackleLFO.start();
  oscillators.push(crackleLFO);
  
  crackleSource.connect(crackleBandpass);
  crackleBandpass.connect(crackleHighpass);
  crackleHighpass.connect(crackleGain);
  crackleGain.connect(masterGain);
  crackleSource.start();
  sources.push(crackleSource);
  
  // Deep fire rumble/roar
  const rumbleSource = context.createBufferSource();
  rumbleSource.buffer = brownNoise;
  rumbleSource.loop = true;
  
  const rumbleFilter = context.createBiquadFilter();
  rumbleFilter.type = 'lowpass';
  rumbleFilter.frequency.value = 200;
  rumbleFilter.Q.value = 0.8;
  
  const rumbleGain = context.createGain();
  rumbleGain.gain.value = 0.12;
  
  // Breathing/pulsing effect
  const rumbleLFO = context.createOscillator();
  rumbleLFO.frequency.value = 0.12;
  const rumbleLFOGain = context.createGain();
  rumbleLFOGain.gain.value = 0.04;
  rumbleLFO.connect(rumbleLFOGain);
  rumbleLFOGain.connect(rumbleGain.gain);
  rumbleLFO.start();
  oscillators.push(rumbleLFO);
  
  rumbleSource.connect(rumbleFilter);
  rumbleFilter.connect(rumbleGain);
  rumbleGain.connect(masterGain);
  rumbleSource.start();
  sources.push(rumbleSource);
  
  // Ember hiss - high frequency content
  const hissSource = context.createBufferSource();
  hissSource.buffer = createNoiseBuffer(context, 4, 'pink');
  hissSource.loop = true;
  
  const hissFilter = context.createBiquadFilter();
  hissFilter.type = 'highpass';
  hissFilter.frequency.value = 2500;
  
  const hissGain = context.createGain();
  hissGain.gain.value = 0.015;
  
  hissSource.connect(hissFilter);
  hissFilter.connect(hissGain);
  hissGain.connect(masterGain);
  hissSource.start();
  sources.push(hissSource);
  
  // Random pops and crackles
  const createPop = () => {
    if (!audioNodes || currentNoise !== 'campfire') return;
    
    const freq = 300 + Math.random() * 500;
    const duration = 0.03 + Math.random() * 0.08;
    
    const popOsc = context.createOscillator();
    popOsc.frequency.value = freq;
    popOsc.type = 'sine';
    
    const popNoise = context.createBufferSource();
    popNoise.buffer = createNoiseBuffer(context, 0.1, 'white');
    
    const popNoiseFilter = context.createBiquadFilter();
    popNoiseFilter.type = 'bandpass';
    popNoiseFilter.frequency.value = freq * 2;
    popNoiseFilter.Q.value = 3;
    
    const popGain = context.createGain();
    const now = context.currentTime;
    const volume = 0.02 + Math.random() * 0.025;
    
    popGain.gain.setValueAtTime(0, now);
    popGain.gain.linearRampToValueAtTime(volume, now + 0.005);
    popGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    
    popOsc.connect(popGain);
    popNoise.connect(popNoiseFilter);
    popNoiseFilter.connect(popGain);
    popGain.connect(masterGain);
    
    popOsc.start(now);
    popNoise.start(now);
    popOsc.stop(now + duration + 0.05);
    popNoise.stop(now + duration + 0.05);
  };
  
  // Schedule pops at varied intervals
  const popInterval = setInterval(() => {
    if (Math.random() < 0.5) createPop();
    if (Math.random() < 0.2) {
      setTimeout(createPop, 50 + Math.random() * 100);
    }
  }, 250);
  intervals.push(popInterval);
  
  // Night ambience - crickets simulation
  const cricketOsc = context.createOscillator();
  cricketOsc.type = 'sine';
  cricketOsc.frequency.value = 4500;
  
  const cricketGain = context.createGain();
  cricketGain.gain.value = 0;
  
  const cricketLFO = context.createOscillator();
  cricketLFO.frequency.value = 15;
  const cricketLFOGain = context.createGain();
  cricketLFOGain.gain.value = 0.003;
  cricketLFO.connect(cricketLFOGain);
  cricketLFOGain.connect(cricketGain.gain);
  cricketLFO.start();
  
  cricketOsc.connect(cricketGain);
  cricketGain.connect(masterGain);
  cricketOsc.start();
  oscillators.push(cricketOsc, cricketLFO);
  
  // Distant owl hoot (very occasional)
  const createOwl = () => {
    if (!audioNodes || currentNoise !== 'campfire') return;
    
    const now = context.currentTime;
    const owlOsc = context.createOscillator();
    owlOsc.type = 'sine';
    owlOsc.frequency.setValueAtTime(400, now);
    owlOsc.frequency.linearRampToValueAtTime(350, now + 0.3);
    owlOsc.frequency.linearRampToValueAtTime(380, now + 0.5);
    
    const owlGain = context.createGain();
    owlGain.gain.setValueAtTime(0, now);
    owlGain.gain.linearRampToValueAtTime(0.008, now + 0.05);
    owlGain.gain.setValueAtTime(0.008, now + 0.4);
    owlGain.gain.linearRampToValueAtTime(0, now + 0.6);
    
    owlOsc.connect(owlGain);
    owlGain.connect(masterGain);
    owlOsc.start(now);
    owlOsc.stop(now + 0.7);
  };
  
  // Random owl hoots
  const owlInterval = setInterval(() => {
    if (Math.random() < 0.08) createOwl();
  }, 8000);
  intervals.push(owlInterval);
  
  return { sources, oscillators, intervals, timeouts };
}

export const audioService = {
  async playNoise(type: NoiseType, volume: number = 0.3): Promise<void> {
    this.stopNoise();
    
    try {
      const context = new AudioContext();
      
      if (context.state === 'suspended') {
        await context.resume();
      }
      
      const masterGain = context.createGain();
      masterGain.gain.setValueAtTime(0, context.currentTime);
      masterGain.gain.linearRampToValueAtTime(Math.min(volume, 0.5), context.currentTime + 0.8);
      masterGain.connect(context.destination);
      
      audioNodes = { 
        context, 
        masterGain, 
        sources: [], 
        oscillators: [], 
        intervals: [],
        timeouts: [],
        gainNodes: []
      };
      currentNoise = type;
      
      if (type === 'rain') {
        audioNodes.sources = createRainSound(context, masterGain);
      } else if (type === 'forest') {
        const { sources, oscillators } = createForestSound(context, masterGain);
        audioNodes.sources = sources;
        audioNodes.oscillators = oscillators;
      } else if (type === 'brown') {
        audioNodes.sources = createBrownSound(context, masterGain);
      } else if (type === 'campfire') {
        const result = createCampfireSound(context, masterGain);
        audioNodes.sources = result.sources;
        audioNodes.oscillators = result.oscillators;
        audioNodes.intervals = result.intervals;
        audioNodes.timeouts = result.timeouts;
      }
    } catch (e) {
      console.error('Error starting audio:', e);
      this.stopNoise();
    }
  },
  
  stopNoise(): void {
    if (!audioNodes) return;
    
    const { context, masterGain, sources, oscillators, intervals, timeouts } = audioNodes;
    
    try {
      intervals.forEach(id => clearInterval(id));
      timeouts.forEach(id => clearTimeout(id));
      
      const now = context.currentTime;
      masterGain.gain.setValueAtTime(masterGain.gain.value, now);
      masterGain.gain.linearRampToValueAtTime(0, now + 0.5);
      
      setTimeout(() => {
        sources.forEach(s => { try { s.stop(); } catch {} });
        oscillators.forEach(o => { try { o.stop(); } catch {} });
        try { context.close(); } catch {}
      }, 550);
      
    } catch (e) {
      console.error('Error stopping audio:', e);
    }
    
    audioNodes = null;
    currentNoise = null;
  },
  
  setVolume(volume: number): void {
    if (audioNodes) {
      const clampedVolume = Math.min(Math.max(volume, 0), 0.5);
      audioNodes.masterGain.gain.linearRampToValueAtTime(
        clampedVolume, 
        audioNodes.context.currentTime + 0.15
      );
    }
  },
  
  getCurrentNoise(): NoiseType | null {
    return currentNoise;
  },
  
  isPlaying(): boolean {
    return audioNodes !== null;
  },
};
