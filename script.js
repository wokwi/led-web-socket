/**
 * LED Web Socket Transmitter
 *
 * Copyright (c) 2020 Uri Shaked
 *
 * Released under the MIT license.
 */

let socket;
let frameCounter = 0;

const urlParams = new URL(location.href).searchParams;
const defaultUrl = urlParams.get('url');
if (defaultUrl) {
  document.querySelector('#url').value = defaultUrl;
}

function updateStatus(status, className = '') {
  const statusSpan = document.querySelector('#status');
  statusSpan.textContent = status;
  statusSpan.className = className;
}

function connect() {
  const url = document.querySelector('#url').value;
  updateStatus('Connecting...');
  frameCounter = 0;
  socket = new WebSocket(url);
  socket.onopen = () => {
    updateStatus('Connected!', 'status-ok');
    parent.postMessage({ app: 'wokwi', command: 'listen', version: 1 }, 'https://wokwi.com');
  };
  socket.onclose = (e) => {
    if (socket) {
      updateStatus('Disconnected', '');
      socket = null;
    }
  };
  socket.onerror = (e) => {
    updateStatus(`Error establishing connection to ${url}`, 'status-error');
    socket = null;
  };
}

window.addEventListener('message', ({ data }) => {
  if (data.neopixels) {
    const { neopixels } = data;

    /*
      The data format depends on the part type:
      - For wokwi-neopixel-strip, we simply get an array with the RGBA values.
      - For wokwi-neopixel-matrix, we get an object with the following fields:
        {
          pixels: Uint32Array;   // rows*cols entries
          rows: number;
          cols: number;
          layout: string;        // '' or 'serpentine'
          brightness: number;    // 1.0 for normal brightness
        }
    */
    const pixels = neopixels.pixels || neopixels;
    if (socket) {
      const bytes = new Uint8Array(pixels.length * 3);
      for (let i = 0; i < pixels.length; i++) {
        const value = pixels[i];
        const b = value & 0xff;
        const r = (value >> 8) & 0xff;
        const g = (value >> 16) & 0xff;
        bytes[i * 3] = r;
        bytes[i * 3 + 1] = g;
        bytes[i * 3 + 2] = b;
      }
      socket.send(bytes);
      frameCounter++;
      updateStatus(`${frameCounter} frames sent`, 'status-ok');
    }
  }
});
