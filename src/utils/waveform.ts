/**
 * Extracts normalized peak values from an AudioBuffer for fast, smooth canvas waveform rendering.
 */
export function extractWaveformData(
  buffer: AudioBuffer,
  peaksCount = 400
): Float32Array {
  const channelData = buffer.getChannelData(0);
  const totalSamples = channelData.length;
  const blockSize = Math.floor(totalSamples / peaksCount);
  const peaks = new Float32Array(peaksCount);

  for (let i = 0; i < peaksCount; i++) {
    const start = i * blockSize;
    const end = Math.min(start + blockSize, totalSamples);
    let max = 0;
    for (let j = start; j < end; j++) {
      const val = Math.abs(channelData[j]);
      if (val > max) max = val;
    }
    peaks[i] = max;
  }

  return peaks;
}

/**
 * Formats time in seconds to mm:ss.ms
 */
export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00.00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);

  const mm = mins.toString().padStart(2, '0');
  const ss = secs.toString().padStart(2, '0');
  const mms = ms.toString().padStart(2, '0');

  return `${mm}:${ss}.${mms}`;
}

/**
 * Formats gain multiplier to decibels (e.g. 1.0 -> 0.0 dB)
 */
export function gainToDb(gain: number): string {
  if (gain <= 0.0001) return '-inf dB';
  const db = 20 * Math.log10(gain);
  return `${db >= 0 ? '+' : ''}${db.toFixed(1)} dB`;
}
