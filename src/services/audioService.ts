type NoiseType = 'rain' | 'forest' | 'brown' | 'campfire';

interface AudioNodes {
  context: AudioContext;
  masterGain: GainNode;
  sources: AudioBufferSourceNode[];
  oscillators: OscillatorNode[];
  intervals: ReturnType<typeof setInterval>[];
  timeouts: ReturnType<typeof setTimeout>[];
}

let audioNodes: AudioNodes | null = null;
let currentNoise: NoiseType | null = null;

// Generate white noise buffer
function createWhiteNoiseBuffer(context: AudioContext, seconds: number): AudioBuffer {
  const bufferSize = seconds * context.sampleRate;
  const buffer = context.createBuffer(2, bufferSize, context.sampleRate);
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);
  
  for (let i = 0; i < bufferSize; i++) {
    left[i] = Math.random() * 2 - 1;
    right[i] = Math.random() * 2 - 1;
  }
  
  return buffer;
}

// Create a lowpass filtered noise (for brown/pink noise effect)
function createFilteredNoise(
  context: AudioContext, 
  buffer: AudioBuffer, 
  frequency: number,
  gain: number
): { source: AudioBufferSourceNode; filter: BiquadFilterNode } {
  const source = context.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  
  const filter = context.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = frequency;
  filter.Q.value = 0.5;
  
  const gainNode = context.createGain();
  gainNode.gain.value = gain;
  
  source.connect(filter);
  filter.connect(gainNode);
  
  return { source, filter };
}

// Rain sound - filtered noise with occasional droplet variations
function createRainSound(context: AudioContext, masterGain: GainNode): AudioBufferSourceNode[] {
  const sources: AudioBufferSourceNode[] = [];
  const noiseBuffer = createWhiteNoiseBuffer(context, 4);
  
  // Base rain layer - low filtered noise
  const baseSource = context.createBufferSource();
  baseSource.buffer = noiseBuffer;
  baseSource.loop = true;
  
  const baseFilter = context.createBiquadFilter();
  baseFilter.type = 'lowpass';
  baseFilter.frequency.value = 800;
  baseFilter.Q.value = 0.7;
  
  const baseGain = context.createGain();
  baseGain.gain.value = 0.15;
  
  baseSource.connect(baseFilter);
  baseFilter.connect(baseGain);
  baseGain.connect(masterGain);
  baseSource.start();
  sources.push(baseSource);
  
  // High frequency rain texture
  const highSource = context.createBufferSource();
  highSource.buffer = noiseBuffer;
  highSource.loop = true;
  
  const highFilter = context.createBiquadFilter();
  highFilter.type = 'bandpass';
  highFilter.frequency.value = 3000;
  highFilter.Q.value = 0.5;
  
  const highGain = context.createGain();
  highGain.gain.value = 0.05;
  
  highSource.connect(highFilter);
  highFilter.connect(highGain);
  highGain.connect(masterGain);
  highSource.start();
  sources.push(highSource);
  
  return sources;
}

// Forest sound - layered oscillators with slow modulation
function createForestSound(context: AudioContext, masterGain: GainNode): { sources: AudioBufferSourceNode[], oscillators: OscillatorNode[] } {
  const sources: AudioBufferSourceNode[] = [];
  const oscillators: OscillatorNode[] = [];
  const noiseBuffer = createWhiteNoiseBuffer(context, 4);
  
  // Soft wind base
  const windSource = context.createBufferSource();
  windSource.buffer = noiseBuffer;
  windSource.loop = true;
  
  const windFilter = context.createBiquadFilter();
  windFilter.type = 'lowpass';
  windFilter.frequency.value = 400;
  windFilter.Q.value = 1;
  
  const windGain = context.createGain();
  windGain.gain.value = 0.08;
  
  // Modulate the wind
  const windLFO = context.createOscillator();
  windLFO.frequency.value = 0.1;
  const windLFOGain = context.createGain();
  windLFOGain.gain.value = 150;
  windLFO.connect(windLFOGain);
  windLFOGain.connect(windFilter.frequency);
  windLFO.start();
  oscillators.push(windLFO);
  
  windSource.connect(windFilter);
  windFilter.connect(windGain);
  windGain.connect(masterGain);
  windSource.start();
  sources.push(windSource);
  
  // Bird-like tones (soft sine waves)
  [520, 660, 880].forEach((freq, i) => {
    const osc = context.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    
    const oscGain = context.createGain();
    oscGain.gain.value = 0;
    
    // Amplitude modulation for chirping effect
    const ampLFO = context.createOscillator();
    ampLFO.frequency.value = 0.3 + i * 0.1;
    const ampLFOGain = context.createGain();
    ampLFOGain.gain.value = 0.008;
    
    ampLFO.connect(ampLFOGain);
    ampLFOGain.connect(oscGain.gain);
    ampLFO.start();
    
    osc.connect(oscGain);
    oscGain.connect(masterGain);
    osc.start();
    
    oscillators.push(osc, ampLFO);
  });
  
  return { sources, oscillators };
}

// Brown noise - heavily filtered for deep rumble
function createBrownSound(context: AudioContext, masterGain: GainNode): AudioBufferSourceNode[] {
  const sources: AudioBufferSourceNode[] = [];
  const noiseBuffer = createWhiteNoiseBuffer(context, 4);
  
  // Deep brown noise
  const source = context.createBufferSource();
  source.buffer = noiseBuffer;
  source.loop = true;
  
  const filter1 = context.createBiquadFilter();
  filter1.type = 'lowpass';
  filter1.frequency.value = 200;
  filter1.Q.value = 0.5;
  
  const filter2 = context.createBiquadFilter();
  filter2.type = 'lowpass';
  filter2.frequency.value = 150;
  filter2.Q.value = 0.5;
  
  const gainNode = context.createGain();
  gainNode.gain.value = 0.4;
  
  source.connect(filter1);
  filter1.connect(filter2);
  filter2.connect(gainNode);
  gainNode.connect(masterGain);
  source.start();
  sources.push(source);
  
  // Subtle mid layer
  const midSource = context.createBufferSource();
  midSource.buffer = noiseBuffer;
  midSource.loop = true;
  
  const midFilter = context.createBiquadFilter();
  midFilter.type = 'bandpass';
  midFilter.frequency.value = 100;
  midFilter.Q.value = 1;
  
  const midGain = context.createGain();
  midGain.gain.value = 0.1;
  
  midSource.connect(midFilter);
  midFilter.connect(midGain);
  midGain.connect(masterGain);
  midSource.start();
  sources.push(midSource);
  
  return sources;
}

// Campfire - layered crackle and warmth
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
  
  const noiseBuffer = createWhiteNoiseBuffer(context, 6);
  
  // Fire crackle base - filtered noise
  const crackleSource = context.createBufferSource();
  crackleSource.buffer = noiseBuffer;
  crackleSource.loop = true;
  
  const crackleFilter = context.createBiquadFilter();
  crackleFilter.type = 'bandpass';
  crackleFilter.frequency.value = 600;
  crackleFilter.Q.value = 2;
  
  // Modulate for crackle effect
  const crackleLFO = context.createOscillator();
  crackleLFO.frequency.value = 8;
  const crackleLFOGain = context.createGain();
  crackleLFOGain.gain.value = 300;
  crackleLFO.connect(crackleLFOGain);
  crackleLFOGain.connect(crackleFilter.frequency);
  crackleLFO.start();
  oscillators.push(crackleLFO);
  
  const crackleGain = context.createGain();
  crackleGain.gain.value = 0.06;
  
  crackleSource.connect(crackleFilter);
  crackleFilter.connect(crackleGain);
  crackleGain.connect(masterGain);
  crackleSource.start();
  sources.push(crackleSource);
  
  // Deep fire rumble
  const rumbleSource = context.createBufferSource();
  rumbleSource.buffer = noiseBuffer;
  rumbleSource.loop = true;
  
  const rumbleFilter = context.createBiquadFilter();
  rumbleFilter.type = 'lowpass';
  rumbleFilter.frequency.value = 150;
  rumbleFilter.Q.value = 1;
  
  const rumbleGain = context.createGain();
  rumbleGain.gain.value = 0.12;
  
  // Slow modulation for breathing effect
  const rumbleLFO = context.createOscillator();
  rumbleLFO.frequency.value = 0.15;
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
  
  // Gentle rain in background
  const rainSource = context.createBufferSource();
  rainSource.buffer = noiseBuffer;
  rainSource.loop = true;
  
  const rainFilter = context.createBiquadFilter();
  rainFilter.type = 'highpass';
  rainFilter.frequency.value = 2000;
  
  const rainGain = context.createGain();
  rainGain.gain.value = 0.02;
  
  rainSource.connect(rainFilter);
  rainFilter.connect(rainGain);
  rainGain.connect(masterGain);
  rainSource.start();
  sources.push(rainSource);
  
  // Random pops/crackles
  const createPop = () => {
    if (!audioNodes || currentNoise !== 'campfire') return;
    
    const popOsc = context.createOscillator();
    popOsc.frequency.value = 200 + Math.random() * 400;
    popOsc.type = 'sine';
    
    const popGain = context.createGain();
    const now = context.currentTime;
    popGain.gain.setValueAtTime(0, now);
    popGain.gain.linearRampToValueAtTime(0.03 + Math.random() * 0.02, now + 0.01);
    popGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05 + Math.random() * 0.1);
    
    popOsc.connect(popGain);
    popGain.connect(masterGain);
    popOsc.start(now);
    popOsc.stop(now + 0.2);
  };
  
  // Schedule random pops
  const popInterval = setInterval(() => {
    if (Math.random() < 0.4) createPop();
  }, 300);
  intervals.push(popInterval);
  
  // Night ambient - subtle wind
  const windOsc = context.createOscillator();
  windOsc.type = 'sine';
  windOsc.frequency.value = 80;
  
  const windOscGain = context.createGain();
  windOscGain.gain.value = 0.015;
  
  const windLFO = context.createOscillator();
  windLFO.frequency.value = 0.08;
  const windLFOGain = context.createGain();
  windLFOGain.gain.value = 20;
  windLFO.connect(windLFOGain);
  windLFOGain.connect(windOsc.frequency);
  windLFO.start();
  
  windOsc.connect(windOscGain);
  windOscGain.connect(masterGain);
  windOsc.start();
  oscillators.push(windOsc, windLFO);
  
  return { sources, oscillators, intervals, timeouts };
}

export const audioService = {
  async playNoise(type: NoiseType, volume: number = 0.3): Promise<void> {
    // Stop existing audio first
    this.stopNoise();
    
    try {
      const context = new AudioContext();
      
      if (context.state === 'suspended') {
        await context.resume();
      }
      
      // Master gain with fade-in
      const masterGain = context.createGain();
      masterGain.gain.setValueAtTime(0, context.currentTime);
      masterGain.gain.linearRampToValueAtTime(Math.min(volume, 0.5), context.currentTime + 0.5);
      masterGain.connect(context.destination);
      
      audioNodes = { 
        context, 
        masterGain, 
        sources: [], 
        oscillators: [], 
        intervals: [],
        timeouts: []
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
      // Clear timers first
      intervals.forEach(id => clearInterval(id));
      timeouts.forEach(id => clearTimeout(id));
      
      // Fade out before stopping
      const now = context.currentTime;
      masterGain.gain.setValueAtTime(masterGain.gain.value, now);
      masterGain.gain.linearRampToValueAtTime(0, now + 0.3);
      
      // Stop everything after fade
      setTimeout(() => {
        sources.forEach(s => { try { s.stop(); } catch {} });
        oscillators.forEach(o => { try { o.stop(); } catch {} });
        try { context.close(); } catch {}
      }, 350);
      
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
        audioNodes.context.currentTime + 0.1
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
