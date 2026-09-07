import lamejs from 'lamejs';
import { EffectChain, ExportMetadata, MasterChain } from '../types';

/**
 * Builds a WAV file ArrayBuffer from stereo AudioBuffer with embedded RIFF INFO metadata.
 */
export function audioBufferToWav(
  buffer: AudioBuffer,
  metadata?: ExportMetadata
): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const numFrames = buffer.length;
  const bytesPerSample = 2; // 16-bit PCM
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataByteCount = numFrames * blockAlign;

  // Build RIFF INFO Chunk for metadata if present
  let infoChunk: Uint8Array | null = null;
  if (metadata) {
    infoChunk = createRiffInfoChunk(metadata);
  }
  const infoChunkLength = infoChunk ? infoChunk.length : 0;

  const headerLength = 44;
  const totalLength = headerLength + dataByteCount + infoChunkLength;
  const arrayBuffer = new ArrayBuffer(totalLength);
  const view = new DataView(arrayBuffer);

  // Write RIFF Header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataByteCount + infoChunkLength, true);
  writeString(view, 8, 'WAVE');

  // fmt subchunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bytesPerSample * 8, true); // BitsPerSample (16)

  // data subchunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataByteCount, true);

  // Write PCM audio data
  const left = buffer.getChannelData(0);
  const right = numChannels > 1 ? buffer.getChannelData(1) : buffer.getChannelData(0);

  let offset = 44;
  for (let i = 0; i < numFrames; i++) {
    // Left channel
    let sampleL = Math.max(-1, Math.min(1, left[i]));
    const intSampleL = sampleL < 0 ? sampleL * 0x8000 : sampleL * 0x7fff;
    view.setInt16(offset, intSampleL, true);
    offset += 2;

    // Right channel
    if (numChannels > 1) {
      let sampleR = Math.max(-1, Math.min(1, right[i]));
      const intSampleR = sampleR < 0 ? sampleR * 0x8000 : sampleR * 0x7fff;
      view.setInt16(offset, intSampleR, true);
      offset += 2;
    }
  }

  // Append INFO chunk if present
  if (infoChunk) {
    const target = new Uint8Array(arrayBuffer, offset, infoChunk.length);
    target.set(infoChunk);
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

function createRiffInfoChunk(metadata: ExportMetadata): Uint8Array {
  const fields: { tag: string; value: string }[] = [];
  if (metadata.title) fields.push({ tag: 'INAM', value: metadata.title });
  if (metadata.artist) fields.push({ tag: 'IART', value: metadata.artist });
  if (metadata.album) fields.push({ tag: 'IPRD', value: metadata.album });
  if (metadata.genre) fields.push({ tag: 'IGNR', value: metadata.genre });
  if (metadata.year) fields.push({ tag: 'ICRD', value: metadata.year });
  if (metadata.trackNumber) fields.push({ tag: 'ITRK', value: metadata.trackNumber });
  if (metadata.comment) fields.push({ tag: 'ICMT', value: metadata.comment });

  if (fields.length === 0) return new Uint8Array(0);

  let totalSize = 4; // 'INFO' size
  const subchunks: { tag: string; data: Uint8Array }[] = [];

  for (const field of fields) {
    const encoder = new TextEncoder();
    const strData = encoder.encode(field.value);
    // Pad to word boundary (even number of bytes + 1 null terminator)
    const lenWithNull = strData.length + 1;
    const paddedLen = lenWithNull % 2 === 0 ? lenWithNull : lenWithNull + 1;
    const buf = new Uint8Array(paddedLen);
    buf.set(strData);
    buf[strData.length] = 0; // null terminator
    subchunks.push({ tag: field.tag, data: buf });
    totalSize += 8 + paddedLen;
  }

  const result = new Uint8Array(8 + totalSize);
  const view = new DataView(result.buffer);
  writeString(view, 0, 'LIST');
  view.setUint32(4, totalSize, true);
  writeString(view, 8, 'INFO');

  let offset = 12;
  for (const chunk of subchunks) {
    writeString(view, offset, chunk.tag);
    view.setUint32(offset + 4, chunk.data.length, true);
    result.set(chunk.data, offset + 8);
    offset += 8 + chunk.data.length;
  }

  return result;
}

/**
 * Encodes AudioBuffer into an MP3 Blob using lamejs.
 */
export function audioBufferToMp3(
  buffer: AudioBuffer,
  kbps = 256
): Blob {
  const channels = buffer.numberOfChannels >= 2 ? 2 : 1;
  const sampleRate = buffer.sampleRate;
  const mp3encoder = new (lamejs as any).Mp3Encoder(channels, sampleRate, kbps);

  const numFrames = buffer.length;
  const left = buffer.getChannelData(0);
  const right = channels > 1 ? buffer.getChannelData(1) : buffer.getChannelData(0);

  // Convert Float32 to Int16
  const leftInt16 = new Int16Array(numFrames);
  const rightInt16 = new Int16Array(numFrames);

  for (let i = 0; i < numFrames; i++) {
    const sl = Math.max(-1, Math.min(1, left[i]));
    leftInt16[i] = sl < 0 ? sl * 0x8000 : sl * 0x7fff;

    const sr = Math.max(-1, Math.min(1, right[i]));
    rightInt16[i] = sr < 0 ? sr * 0x8000 : sr * 0x7fff;
  }

  const mp3Data: Uint8Array[] = [];
  const chunkSize = 1152; // standard MP3 frame size

  for (let i = 0; i < numFrames; i += chunkSize) {
    const leftChunk = leftInt16.subarray(i, i + chunkSize);
    let mp3buf: Int8Array;
    if (channels === 2) {
      const rightChunk = rightInt16.subarray(i, i + chunkSize);
      mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk);
    } else {
      mp3buf = mp3encoder.encodeBuffer(leftChunk);
    }
    if (mp3buf.length > 0) {
      mp3Data.push(new Uint8Array(mp3buf));
    }
  }

  const endBuf = mp3encoder.flush();
  if (endBuf.length > 0) {
    mp3Data.push(new Uint8Array(endBuf));
  }

  return new Blob(mp3Data, { type: 'audio/mp3' });
}

/**
 * Mixes down tracks through OfflineAudioContext applying track levels, pan,
 * FX chains, and Master mastering chain.
 */
export async function renderMasterMixdown(
  tracks: {
    audioBuffer: AudioBuffer;
    volume: number;
    pan: number;
    muted: boolean;
    fxChain: EffectChain;
  }[],
  masterChain: MasterChain,
  masterVolume: number,
  sampleRate = 44100
): Promise<AudioBuffer> {
  const activeTracks = tracks.filter((t) => !t.muted && t.audioBuffer && t.volume > 0);
  if (activeTracks.length === 0) {
    // Return 1-second silence
    const offlineEmpty = new OfflineAudioContext(2, sampleRate, sampleRate);
    return offlineEmpty.startRendering();
  }

  // Find max duration
  let maxDuration = 0;
  for (const track of activeTracks) {
    if (track.audioBuffer.duration > maxDuration) {
      maxDuration = track.audioBuffer.duration;
    }
  }
  // Add 1 second for reverb/delay tail
  const renderDuration = maxDuration + 1.2;
  const lengthSamples = Math.ceil(renderDuration * sampleRate);

  const ctx = new OfflineAudioContext(2, lengthSamples, sampleRate);

  // Master bus input node
  const masterBus = ctx.createGain();

  // 1. Master LowCut 30Hz
  let masterEnd: AudioNode = masterBus;
  if (masterChain.lowCut30) {
    const lowCut = ctx.createBiquadFilter();
    lowCut.type = 'highpass';
    lowCut.frequency.value = 32;
    lowCut.Q.value = 0.7;
    masterEnd.connect(lowCut);
    masterEnd = lowCut;
  }

  // 2. Master Tape Warmth / Saturation
  if (masterChain.tapeWarmth > 0) {
    const shaper = ctx.createWaveShaper();
    shaper.curve = makeDistortionCurve(masterChain.tapeWarmth * 25);
    shaper.oversample = '4x';
    masterEnd.connect(shaper);
    masterEnd = shaper;
  }

  // 3. Master Bus Compressor
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = masterChain.busCompThreshold;
  comp.ratio.value = masterChain.busCompRatio;
  comp.attack.value = 0.03;
  comp.release.value = 0.15;
  masterEnd.connect(comp);
  masterEnd = comp;

  // 4. Master Air Shelf Boost
  if (masterChain.highAirBoost > 0) {
    const airFilter = ctx.createBiquadFilter();
    airFilter.type = 'highshelf';
    airFilter.frequency.value = 11000;
    airFilter.gain.value = masterChain.highAirBoost;
    masterEnd.connect(airFilter);
    masterEnd = airFilter;
  }

  // 5. Master Brickwall Limiter & Master Volume
  const masterGain = ctx.createGain();
  const linearVol = masterVolume * Math.pow(10, masterChain.ceiling / 20);
  masterGain.gain.value = linearVol;
  masterEnd.connect(masterGain);
  masterGain.connect(ctx.destination);

  // Connect each track to master bus
  for (const track of activeTracks) {
    const src = ctx.createBufferSource();
    src.buffer = track.audioBuffer;

    let trackChainEnd: AudioNode = src;

    // Track LowCut
    if (track.fxChain.lowCut.enabled) {
      const cut = ctx.createBiquadFilter();
      cut.type = 'highpass';
      cut.frequency.value = track.fxChain.lowCut.freq;
      trackChainEnd.connect(cut);
      trackChainEnd = cut;
    }

    // Track EQ
    if (track.fxChain.eq.enabled) {
      // Low shelf
      const eqLow = ctx.createBiquadFilter();
      eqLow.type = 'lowshelf';
      eqLow.frequency.value = track.fxChain.eq.lowFreq;
      eqLow.gain.value = track.fxChain.eq.lowGain;
      trackChainEnd.connect(eqLow);
      trackChainEnd = eqLow;

      // Mid peaking
      const eqMid = ctx.createBiquadFilter();
      eqMid.type = 'peaking';
      eqMid.frequency.value = track.fxChain.eq.midFreq;
      eqMid.Q.value = track.fxChain.eq.midQ;
      eqMid.gain.value = track.fxChain.eq.midGain;
      trackChainEnd.connect(eqMid);
      trackChainEnd = eqMid;

      // High peaking
      const eqHigh = ctx.createBiquadFilter();
      eqHigh.type = 'peaking';
      eqHigh.frequency.value = track.fxChain.eq.highFreq;
      eqHigh.Q.value = 1.0;
      eqHigh.gain.value = track.fxChain.eq.highGain;
      trackChainEnd.connect(eqHigh);
      trackChainEnd = eqHigh;

      // High air shelf
      const eqAir = ctx.createBiquadFilter();
      eqAir.type = 'highshelf';
      eqAir.frequency.value = track.fxChain.eq.highAirFreq;
      eqAir.gain.value = track.fxChain.eq.highAirGain;
      trackChainEnd.connect(eqAir);
      trackChainEnd = eqAir;
    }

    // Track Compressor
    if (track.fxChain.compressor.enabled) {
      const trackComp = ctx.createDynamicsCompressor();
      trackComp.threshold.value = track.fxChain.compressor.threshold;
      trackComp.ratio.value = track.fxChain.compressor.ratio;
      trackComp.attack.value = track.fxChain.compressor.attack;
      trackComp.release.value = track.fxChain.compressor.release;
      trackChainEnd.connect(trackComp);
      trackChainEnd = trackComp;

      if (track.fxChain.compressor.gain !== 0) {
        const makeup = ctx.createGain();
        makeup.gain.value = Math.pow(10, track.fxChain.compressor.gain / 20);
        trackChainEnd.connect(makeup);
        trackChainEnd = makeup;
      }
    }

    // Track Saturation
    if (track.fxChain.saturation.enabled && track.fxChain.saturation.drive > 0) {
      const sat = ctx.createWaveShaper();
      sat.curve = makeDistortionCurve(track.fxChain.saturation.drive * 40);
      sat.oversample = '2x';
      trackChainEnd.connect(sat);
      trackChainEnd = sat;
    }

    // Track Volume & Pan
    const trackGain = ctx.createGain();
    trackGain.gain.value = track.volume;

    const panner = ctx.createStereoPanner();
    panner.pan.value = track.pan;

    trackChainEnd.connect(trackGain);
    trackGain.connect(panner);
    panner.connect(masterBus);

    src.start(0);
  }

  return await ctx.startRendering();
}

function makeDistortionCurve(amount: number): Float32Array {
  const k = typeof amount === 'number' ? amount : 20;
  const nSamples = 44100;
  const curve = new Float32Array(nSamples);
  const deg = Math.PI / 180;
  for (let i = 0; i < nSamples; ++i) {
    const x = (i * 2) / nSamples - 1;
    curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
  }
  return curve;
}

/**
 * Triggers file download in browser
 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}
