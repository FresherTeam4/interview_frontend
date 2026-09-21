class Pcm16CaptureProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    this.targetSampleRate = options.processorOptions?.targetSampleRate ?? 16000;
    this.chunkSamples = options.processorOptions?.chunkSamples ?? 320;
    this.ratio = sampleRate / this.targetSampleRate;
    this.phase = 0;
    this.lastInput = 0;
    this.pending = [];
  }

  process(inputs) {
    const input = inputs[0]?.[0];
    if (!input || input.length === 0) return true;

    // Linear interpolation resampling: produces clean, anti-aliased audio for AI transcription
    for (let i = 0; i < input.length; i++) {
      const current = input[i];
      while (this.phase < 1.0) {
        const interp = this.lastInput + (current - this.lastInput) * this.phase;
        const clamped = Math.max(-1, Math.min(1, interp));
        const pcm16 = clamped < 0 ? Math.round(clamped * 32768) : Math.round(clamped * 32767);
        this.pending.push(pcm16);

        if (this.pending.length >= this.chunkSamples) {
          this.flush();
        }
        this.phase += this.ratio;
      }
      this.phase -= 1.0;
      this.lastInput = current;
    }
    return true;
  }

  flush() {
    const pcm = new Int16Array(this.pending);
    this.pending = [];
    this.port.postMessage(pcm.buffer, [pcm.buffer]);
  }
}

registerProcessor("pcm16-capture", Pcm16CaptureProcessor);
