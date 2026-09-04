/** Decodes an audio Blob/URL into peak data for drawing a waveform + lets callers slice a range for the AudioTrimmer. */

export type WaveformPeaks = {
  peaks: Float32Array; // one value per bucket, 0..1
  durationSec: number;
};

let sharedContext: AudioContext | null = null;
function getContext(): AudioContext {
  if (!sharedContext) sharedContext = new AudioContext();
  return sharedContext;
}

export async function decodeAudio(source: Blob | string): Promise<AudioBuffer> {
  const arrayBuffer =
    typeof source === "string" ? await (await fetch(source)).arrayBuffer() : await source.arrayBuffer();
  const ctx = getContext();
  return ctx.decodeAudioData(arrayBuffer.slice(0));
}

export function extractPeaks(buffer: AudioBuffer, bucketCount = 400): WaveformPeaks {
  const channel = buffer.getChannelData(0);
  const samplesPerBucket = Math.floor(channel.length / bucketCount) || 1;
  const peaks = new Float32Array(bucketCount);

  for (let i = 0; i < bucketCount; i++) {
    const start = i * samplesPerBucket;
    let max = 0;
    for (let j = 0; j < samplesPerBucket && start + j < channel.length; j++) {
      const v = Math.abs(channel[start + j]);
      if (v > max) max = v;
    }
    peaks[i] = max;
  }

  return { peaks, durationSec: buffer.duration };
}
