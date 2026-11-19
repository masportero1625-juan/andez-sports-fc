/* Dedicated Web Worker para codificación H.264 + MP4 fuera del hilo principal */
importScripts('https://cdn.jsdelivr.net/npm/mp4-muxer@5.2.2/build/mp4-muxer.min.js');

let muxer = null;
let encoder = null;
let isRunning = false;

self.onmessage = async (e) => {
  const msg = e.data;
  if (!msg || !msg.type) return;

  if (msg.type === 'init') {
    try {
      const { encoderConfig } = msg;
      muxer = new Mp4Muxer.Muxer({
        target: new Mp4Muxer.ArrayBufferTarget(),
        video: {
          codec: 'avc',
          width: encoderConfig.width,
          height: encoderConfig.height,
        },
        fastStart: 'in-memory',
      });

      encoder = new VideoEncoder({
        output: (chunk, meta) => {
          if (muxer) muxer.addVideoChunk(chunk, meta);
        },
        error: (err) => {
          self.postMessage({ type: 'error', message: err?.message || String(err) });
        },
      });

      encoder.configure(encoderConfig);
      isRunning = true;
      self.postMessage({ type: 'ready' });
    } catch (err) {
      self.postMessage({ type: 'error', message: err?.message || String(err) });
    }
    return;
  }

  if (msg.type === 'frame') {
    const { bitmap, timestampUs, durationUs, isKeyFrame } = msg;
    if (!isRunning || !encoder || encoder.state !== 'configured') {
      if (bitmap) bitmap.close();
      return;
    }

    // Control de cola dentro del Worker para evitar saturación de memoria
    if (encoder.encodeQueueSize > 6) {
      if (bitmap) bitmap.close();
      return;
    }

    try {
      const frame = new VideoFrame(bitmap, {
        timestamp: timestampUs,
        duration: durationUs,
      });
      bitmap.close();
      encoder.encode(frame, { keyFrame: isKeyFrame });
      frame.close();
    } catch (err) {
      if (bitmap) bitmap.close();
    }
    return;
  }

  if (msg.type === 'stop') {
    isRunning = false;
    try {
      if (encoder && encoder.state !== 'closed') {
        await encoder.flush();
        encoder.close();
      }
      if (muxer) {
        muxer.finalize();
        const buffer = muxer.target.buffer;
        self.postMessage({ type: 'done', buffer }, [buffer]);
      } else {
        self.postMessage({ type: 'error', message: 'Muxer no inicializado' });
      }
    } catch (err) {
      self.postMessage({ type: 'error', message: err?.message || String(err) });
    } finally {
      encoder = null;
      muxer = null;
    }
  }
};
