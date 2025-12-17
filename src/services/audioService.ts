type NoiseType = 'rain' | 'forest' | 'brown';

interface AudioNodes {
  context: AudioContext;
  gainNode: GainNode;
  noiseNode?: AudioBufferSourceNode;
  oscillators?: OscillatorNode[];
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
    output[i] *= 3.5;
  }
  
  return buffer;
}

function createRainNoise(context: AudioContext): AudioBuffer {
  const bufferSize = 2 * context.sampleRate;
  const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
  const output = buffer.getChannelData(0);
  
  for (let i = 0; i < bufferSize; i++) {
    // White noise with low-pass characteristics
    const white = Math.random() * 2 - 1;
    output[i] = white * 0.5;
    
    // Add occasional louder "drops"
    if (Math.random() < 0.001) {
      for (let j = 0; j < 100 && i + j < bufferSize; j++) {
        output[i + j] = (Math.random() * 2 - 1) * (1 - j / 100);
      }
    }
  }
  
  return buffer;
}

function createForestNoise(context: AudioContext, gainNode: GainNode): OscillatorNode[] {
  const oscillators: OscillatorNode[] = [];
  
  // Wind-like sound using multiple detuned oscillators
  const frequencies = [80, 120, 160, 200];
  frequencies.forEach(freq => {
    const osc = context.createOscillator();
    const oscGain = context.createGain();
    
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.frequency.setValueAtTime(freq, context.currentTime);
    
    // Random modulation for natural feel
    const lfo = context.createOscillator();
    const lfoGain = context.createGain();
    lfo.frequency.value = 0.1 + Math.random() * 0.2;
    lfoGain.gain.value = 5;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    lfo.start();
    
    oscGain.gain.value = 0.05;
    osc.connect(oscGain);
    oscGain.connect(gainNode);
    osc.start();
    
    oscillators.push(osc);
  });
  
  return oscillators;
}

export const audioService = {
  async playNoise(type: NoiseType, volume: number = 0.3): Promise<void> {
    // Stop current noise if playing different type
    if (currentNoise && currentNoise !== type) {
      this.stopNoise();
    }
    
    if (currentNoise === type) {
      // Already playing this noise, just adjust volume
      if (audioNodes) {
        audioNodes.gainNode.gain.value = volume;
      }
      return;
    }
    
    const context = new AudioContext();
    const gainNode = context.createGain();
    gainNode.gain.value = volume;
    gainNode.connect(context.destination);
    
    audioNodes = { context, gainNode };
    currentNoise = type;
    
    if (type === 'brown') {
      const buffer = createBrownNoise(context);
      const noiseNode = context.createBufferSource();
      noiseNode.buffer = buffer;
      noiseNode.loop = true;
      noiseNode.connect(gainNode);
      noiseNode.start();
      audioNodes.noiseNode = noiseNode;
    } else if (type === 'rain') {
      const buffer = createRainNoise(context);
      const noiseNode = context.createBufferSource();
      noiseNode.buffer = buffer;
      noiseNode.loop = true;
      noiseNode.connect(gainNode);
      noiseNode.start();
      audioNodes.noiseNode = noiseNode;
    } else if (type === 'forest') {
      const oscillators = createForestNoise(context, gainNode);
      audioNodes.oscillators = oscillators;
      
      // Add subtle white noise for texture
      const buffer = createBrownNoise(context);
      const noiseNode = context.createBufferSource();
      noiseNode.buffer = buffer;
      noiseNode.loop = true;
      const noiseGain = context.createGain();
      noiseGain.gain.value = 0.1;
      noiseNode.connect(noiseGain);
      noiseGain.connect(gainNode);
      noiseNode.start();
      audioNodes.noiseNode = noiseNode;
    }
  },
  
  stopNoise(): void {
    if (!audioNodes) return;
    
    try {
      audioNodes.noiseNode?.stop();
      audioNodes.oscillators?.forEach(osc => osc.stop());
      audioNodes.context.close();
    } catch (e) {
      // Ignore errors from already stopped nodes
    }
    
    audioNodes = null;
    currentNoise = null;
  },
  
  setVolume(volume: number): void {
    if (audioNodes) {
      audioNodes.gainNode.gain.value = volume;
    }
  },
  
  getCurrentNoise(): NoiseType | null {
    return currentNoise;
  },
  
  isPlaying(): boolean {
    return audioNodes !== null;
  },
};
