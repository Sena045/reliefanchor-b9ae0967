type NoiseType = 'rain' | 'forest' | 'brown' | 'campfire';

interface AudioNodes {
  context: AudioContext;
  gainNode: GainNode;
  sourceNodes: AudioBufferSourceNode[];
  oscillators: OscillatorNode[];
  intervals: ReturnType<typeof setInterval>[];
}

let audioNodes: AudioNodes | null = null;
let currentNoise: NoiseType | null = null;

function createBrownNoise(context: AudioContext): AudioBuffer {
  const bufferSize = 2 * context.sampleRate;
  const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
  const output = buffer.getChannelData(0);
  
  let lastOut = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    output[i] = (lastOut + 0.02 * white) / 1.02;
    lastOut = output[i];
    output[i] *= 1.5; // Reduced from 3.5
  }
  
  return buffer;
}

function createRainNoise(context: AudioContext): AudioBuffer {
  const bufferSize = 2 * context.sampleRate;
  const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
  const output = buffer.getChannelData(0);
  
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    output[i] = white * 0.25; // Reduced from 0.5
    
    if (Math.random() < 0.001) {
      for (let j = 0; j < 100 && i + j < bufferSize; j++) {
        output[i + j] = (Math.random() * 2 - 1) * (1 - j / 100) * 0.4;
      }
    }
  }
  
  return buffer;
}

function createForestNoise(context: AudioContext, gainNode: GainNode): OscillatorNode[] {
  const oscillators: OscillatorNode[] = [];
  
  const frequencies = [80, 120, 160, 200];
  frequencies.forEach(freq => {
    const osc = context.createOscillator();
    const oscGain = context.createGain();
    
    osc.type = 'sine';
    osc.frequency.value = freq;
    
    const lfo = context.createOscillator();
    const lfoGain = context.createGain();
    lfo.frequency.value = 0.1 + Math.random() * 0.2;
    lfoGain.gain.value = 5;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    lfo.start();
    
    oscGain.gain.value = 0.02; // Reduced from 0.05
    osc.connect(oscGain);
    oscGain.connect(gainNode);
    osc.start();
    
    oscillators.push(osc, lfo);
  });
  
  return oscillators;
}

// Campfire soundscape layers
function createRainOnTent(context: AudioContext, masterGain: GainNode): AudioBufferSourceNode {
  const bufferSize = 4 * context.sampleRate;
  const buffer = context.createBuffer(2, bufferSize, context.sampleRate);
  const leftChannel = buffer.getChannelData(0);
  const rightChannel = buffer.getChannelData(1);
  
  let lastL = 0, lastR = 0;
  for (let i = 0; i < bufferSize; i++) {
    const whiteL = Math.random() * 2 - 1;
    const whiteR = Math.random() * 2 - 1;
    lastL = (lastL + 0.1 * whiteL) / 1.1;
    lastR = (lastR + 0.1 * whiteR) / 1.1;
    
    leftChannel[i] = lastL * 0.15; // Reduced from 0.4
    rightChannel[i] = lastR * 0.15;
    
    if (Math.random() < 0.002) {
      const dropLength = 50 + Math.random() * 100;
      for (let j = 0; j < dropLength && i + j < bufferSize; j++) {
        const decay = 1 - j / dropLength;
        const drop = (Math.random() * 2 - 1) * decay * 0.2; // Reduced from 0.6
        leftChannel[i + j] += drop * (0.5 + Math.random() * 0.5);
        rightChannel[i + j] += drop * (0.5 + Math.random() * 0.5);
      }
    }
  }
  
  const rainGain = context.createGain();
  rainGain.gain.value = 0.2; // Reduced from 0.35
  
  const noiseNode = context.createBufferSource();
  noiseNode.buffer = buffer;
  noiseNode.loop = true;
  noiseNode.connect(rainGain);
  rainGain.connect(masterGain);
  noiseNode.start();
  
  return noiseNode;
}

function createCampfireCrackle(context: AudioContext, masterGain: GainNode): AudioBufferSourceNode {
  const bufferSize = 6 * context.sampleRate;
  const buffer = context.createBuffer(2, bufferSize, context.sampleRate);
  const leftChannel = buffer.getChannelData(0);
  const rightChannel = buffer.getChannelData(1);
  
  let lastOut = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    lastOut = (lastOut + 0.03 * white) / 1.03;
    leftChannel[i] = lastOut * 0.08; // Reduced from 0.15
    rightChannel[i] = lastOut * 0.08;
    
    if (Math.random() < 0.0006) {
      const crackleLength = 20 + Math.random() * 80;
      const intensity = 0.15 + Math.random() * 0.2; // Reduced from 0.3-0.8
      for (let j = 0; j < crackleLength && i + j < bufferSize; j++) {
        const decay = Math.pow(1 - j / crackleLength, 2);
        const crackle = (Math.random() * 2 - 1) * decay * intensity;
        leftChannel[i + j] += crackle;
        rightChannel[i + j] += crackle * 0.8;
      }
    }
    
    if (Math.random() < 0.0001) {
      const popLength = 100 + Math.random() * 200;
      for (let j = 0; j < popLength && i + j < bufferSize; j++) {
        const decay = Math.pow(1 - j / popLength, 1.5);
        const pop = (Math.random() * 2 - 1) * decay * 0.3; // Reduced from 0.7
        leftChannel[i + j] += pop;
        rightChannel[i + j] += pop;
      }
    }
  }
  
  const fireGain = context.createGain();
  fireGain.gain.value = 0.25; // Reduced from 0.5
  
  const noiseNode = context.createBufferSource();
  noiseNode.buffer = buffer;
  noiseNode.loop = true;
  noiseNode.connect(fireGain);
  fireGain.connect(masterGain);
  noiseNode.start();
  
  return noiseNode;
}

function createVinylCrackle(context: AudioContext, masterGain: GainNode): AudioBufferSourceNode {
  const bufferSize = 3 * context.sampleRate;
  const buffer = context.createBuffer(2, bufferSize, context.sampleRate);
  const leftChannel = buffer.getChannelData(0);
  const rightChannel = buffer.getChannelData(1);
  
  for (let i = 0; i < bufferSize; i++) {
    const hiss = (Math.random() * 2 - 1) * 0.01; // Reduced from 0.02
    leftChannel[i] = hiss;
    rightChannel[i] = hiss;
    
    if (Math.random() < 0.0003) {
      const clickLength = 5 + Math.random() * 15;
      for (let j = 0; j < clickLength && i + j < bufferSize; j++) {
        const decay = 1 - j / clickLength;
        const click = (Math.random() > 0.5 ? 1 : -1) * decay * 0.08; // Reduced from 0.15
        leftChannel[i + j] += click;
        rightChannel[i + j] += click;
      }
    }
  }
  
  const vinylGain = context.createGain();
  vinylGain.gain.value = 0.12; // Reduced from 0.25
  
  const noiseNode = context.createBufferSource();
  noiseNode.buffer = buffer;
  noiseNode.loop = true;
  noiseNode.connect(vinylGain);
  vinylGain.connect(masterGain);
  noiseNode.start();
  
  return noiseNode;
}

function createWindInTrees(context: AudioContext, masterGain: GainNode): OscillatorNode[] {
  const oscillators: OscillatorNode[] = [];
  
  [40, 60, 90, 130].forEach((freq, idx) => {
    const osc = context.createOscillator();
    const oscGain = context.createGain();
    
    osc.type = 'sine';
    osc.frequency.value = freq;
    
    const lfo = context.createOscillator();
    const lfoGain = context.createGain();
    lfo.frequency.value = 0.05 + Math.random() * 0.1;
    lfoGain.gain.value = freq * 0.3;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    lfo.start();
    
    oscGain.gain.value = 0.008 - idx * 0.001; // Reduced from 0.015
    osc.connect(oscGain);
    oscGain.connect(masterGain);
    osc.start();
    
    oscillators.push(osc, lfo);
  });
  
  return oscillators;
}

function playThunder(context: AudioContext, masterGain: GainNode): AudioBufferSourceNode {
  const duration = 3 + Math.random() * 2;
  const bufferSize = Math.floor(duration * context.sampleRate);
  const buffer = context.createBuffer(2, bufferSize, context.sampleRate);
  const leftChannel = buffer.getChannelData(0);
  const rightChannel = buffer.getChannelData(1);
  
  let lastOut = 0;
  for (let i = 0; i < bufferSize; i++) {
    const progress = i / bufferSize;
    const envelope = Math.sin(progress * Math.PI) * Math.pow(1 - progress, 0.5);
    
    const white = Math.random() * 2 - 1;
    lastOut = (lastOut + 0.05 * white) / 1.05;
    
    leftChannel[i] = lastOut * envelope * 0.2; // Reduced from 0.4
    rightChannel[i] = lastOut * envelope * 0.18;
  }
  
  const thunderGain = context.createGain();
  thunderGain.gain.value = 0.15; // Reduced from 0.3
  
  const thunderNode = context.createBufferSource();
  thunderNode.buffer = buffer;
  thunderNode.connect(thunderGain);
  thunderGain.connect(masterGain);
  thunderNode.start();
  
  return thunderNode;
}

function playOwl(context: AudioContext, masterGain: GainNode): OscillatorNode[] {
  const oscillators: OscillatorNode[] = [];
  
  [0, 0.6].forEach((delay) => {
    setTimeout(() => {
      if (!audioNodes || currentNoise !== 'campfire') return;
      
      const osc = context.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = delay === 0 ? 420 : 340;
      
      const noteGain = context.createGain();
      noteGain.gain.setValueAtTime(0, context.currentTime);
      noteGain.gain.linearRampToValueAtTime(0.04, context.currentTime + 0.05); // Reduced from 0.08
      noteGain.gain.linearRampToValueAtTime(0.03, context.currentTime + 0.3);
      noteGain.gain.linearRampToValueAtTime(0, context.currentTime + 0.5);
      
      osc.connect(noteGain);
      noteGain.connect(masterGain);
      osc.start();
      osc.stop(context.currentTime + 0.5);
      
      oscillators.push(osc);
    }, delay * 1000);
  });
  
  return oscillators;
}

function createCampfireSoundscape(context: AudioContext, masterGain: GainNode): { 
  sourceNodes: AudioBufferSourceNode[], 
  oscillators: OscillatorNode[], 
  intervals: ReturnType<typeof setInterval>[] 
} {
  const sourceNodes: AudioBufferSourceNode[] = [];
  const oscillators: OscillatorNode[] = [];
  const intervals: ReturnType<typeof setInterval>[] = [];
  
  // Start all layers and track nodes
  sourceNodes.push(createRainOnTent(context, masterGain));
  sourceNodes.push(createCampfireCrackle(context, masterGain));
  sourceNodes.push(createVinylCrackle(context, masterGain));
  oscillators.push(...createWindInTrees(context, masterGain));
  
  // Schedule thunder every 45-70 seconds
  const thunderInterval = setInterval(() => {
    if (audioNodes && currentNoise === 'campfire') {
      const node = playThunder(context, masterGain);
      audioNodes.sourceNodes.push(node);
    }
  }, 45000 + Math.random() * 25000);
  intervals.push(thunderInterval);
  
  // Initial thunder after 8 seconds
  setTimeout(() => {
    if (audioNodes && currentNoise === 'campfire') {
      const node = playThunder(context, masterGain);
      audioNodes.sourceNodes.push(node);
    }
  }, 8000);
  
  // Schedule owl hoots every 40-100 seconds
  const owlInterval = setInterval(() => {
    if (audioNodes && currentNoise === 'campfire') {
      playOwl(context, masterGain);
    }
  }, 40000 + Math.random() * 60000);
  intervals.push(owlInterval);
  
  // Initial owl after 20 seconds
  setTimeout(() => {
    if (audioNodes && currentNoise === 'campfire') {
      playOwl(context, masterGain);
    }
  }, 20000);
  
  return { sourceNodes, oscillators, intervals };
}

export const audioService = {
  async playNoise(type: NoiseType, volume: number = 0.3): Promise<void> {
    // Stop existing audio first
    if (audioNodes) {
      this.stopNoise();
    }
    
    try {
      const context = new AudioContext();
      
      // Resume context if suspended (required for some browsers)
      if (context.state === 'suspended') {
        await context.resume();
      }
      
      const gainNode = context.createGain();
      gainNode.gain.value = Math.min(volume, 0.5); // Cap max volume
      gainNode.connect(context.destination);
      
      audioNodes = { context, gainNode, sourceNodes: [], oscillators: [], intervals: [] };
      currentNoise = type;
      
      if (type === 'brown') {
        const buffer = createBrownNoise(context);
        const noiseNode = context.createBufferSource();
        noiseNode.buffer = buffer;
        noiseNode.loop = true;
        noiseNode.connect(gainNode);
        noiseNode.start();
        audioNodes.sourceNodes.push(noiseNode);
      } else if (type === 'rain') {
        const buffer = createRainNoise(context);
        const noiseNode = context.createBufferSource();
        noiseNode.buffer = buffer;
        noiseNode.loop = true;
        noiseNode.connect(gainNode);
        noiseNode.start();
        audioNodes.sourceNodes.push(noiseNode);
      } else if (type === 'forest') {
        const oscillators = createForestNoise(context, gainNode);
        audioNodes.oscillators = oscillators;
        
        const buffer = createBrownNoise(context);
        const noiseNode = context.createBufferSource();
        noiseNode.buffer = buffer;
        noiseNode.loop = true;
        const noiseGain = context.createGain();
        noiseGain.gain.value = 0.05; // Reduced from 0.1
        noiseNode.connect(noiseGain);
        noiseGain.connect(gainNode);
        noiseNode.start();
        audioNodes.sourceNodes.push(noiseNode);
      } else if (type === 'campfire') {
        const { sourceNodes, oscillators, intervals } = createCampfireSoundscape(context, gainNode);
        audioNodes.sourceNodes = sourceNodes;
        audioNodes.oscillators = oscillators;
        audioNodes.intervals = intervals;
      }
    } catch (e) {
      console.error('Error starting audio:', e);
      this.stopNoise();
    }
  },
  
  stopNoise(): void {
    if (!audioNodes) return;
    
    try {
      // Clear intervals first
      audioNodes.intervals.forEach(interval => clearInterval(interval));
      
      // Stop all source nodes
      audioNodes.sourceNodes.forEach(node => {
        try { node.stop(); } catch {}
      });
      
      // Stop all oscillators
      audioNodes.oscillators.forEach(osc => {
        try { osc.stop(); } catch {}
      });
      
      // Close context
      audioNodes.context.close();
    } catch (e) {
      console.error('Error stopping audio:', e);
    }
    
    audioNodes = null;
    currentNoise = null;
  },
  
  setVolume(volume: number): void {
    if (audioNodes) {
      audioNodes.gainNode.gain.value = Math.min(volume, 0.5); // Cap max volume
    }
  },
  
  getCurrentNoise(): NoiseType | null {
    return currentNoise;
  },
  
  isPlaying(): boolean {
    return audioNodes !== null;
  },
};
