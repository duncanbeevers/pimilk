import butterchurn from "butterchurn";
import butterchurnPresets from "butterchurn-presets";

function log(message) {
  const ele = window.document.createElement('pre');
  ele.classList.add('logLine');
  ele.textContent = typeof message ==='string' ? message : JSON.stringify(message, null, 2);
  window.DOM_NODE_LOG.appendChild(ele);
}

async function main() {
  const canvas = window.DOM_NODE_VIZ_CANVAS;

  log('creating audio context');
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();

  log('awaiting getUserMedia audio: true')
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: false,
  });

  log('creating audio node graph gain node');
  const gainNode = audioContext.createGain();

  log('creating microphone stream');
  const microphoneStream = audioContext.createMediaStreamSource(stream);

  log('creating microphone analyzer');
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = 512;
  const analyserDataArray = new Uint8Array(analyser.frequencyBinCount);

  log('connecting microphone stream to gain node and analyser');
  microphoneStream.connect(gainNode);
  microphoneStream.connect(analyser);

  log('creating visualizer');
  const presets = Object.values(butterchurnPresets.getPresets());
  function getRandomPreset() {
    return presets[Math.floor(Math.random() * presets.length)];
  }

  const visualizer = butterchurn.createVisualizer(audioContext, canvas, {
    width: canvas.clientWidth,
    height: canvas.clientHeight,
  });

  log('attaching gain node to visualizer');
  visualizer.connectAudio(gainNode);

  log('loading initial visualizer preset');
  visualizer.loadPreset(getRandomPreset(), 0.0);

  window.addEventListener("resize", () =>
    visualizer.setRendererSize(canvas.clientWidth, canvas.clientHeight)
  );

  setInterval(() => {
    log('interval elapsed, picking new random visualizer preset');
    visualizer.loadPreset(getRandomPreset(), 1.0);
  }, 10000);

  function renderMicData() {
    const micCanvas = window.DOM_NODE_MIC_CANVAS;
    const width = micCanvas.clientWidth;
    const height = micCanvas.clientHeight;
    micCanvas.width = width;
    micCanvas.height = height;

    analyser.getByteTimeDomainData(analyserDataArray);
    const widthScalar = width / analyser.frequencyBinCount;
    const heightScalar = height / 256;

    const canvasContext = micCanvas.getContext("2d");
    if (!canvasContext) {
      return;
    }

    canvasContext.clearRect(0, 0, width, height);
    canvasContext.lineWidth = 8;
    canvasContext.strokeStyle = "rgb(0, 0, 0)";
    canvasContext.beginPath();

    for (let i = 0; i < analyser.frequencyBinCount - 1; i++) {
      const x = i * widthScalar;
      const y = analyserDataArray[i] * heightScalar;

      if (i === 0) {
        canvasContext.moveTo(x, y);
      } else {
        canvasContext.lineTo(x, y);
      }
    }
    canvasContext.lineTo(
      analyserDataArray.length * widthScalar,
      analyserDataArray[analyser.frequencyBinCount - 1] * heightScalar
    );
    canvasContext.stroke();

    canvasContext.lineWidth = 3;
    canvasContext.strokeStyle = "rgb(0, 255, 0)";
    canvasContext.beginPath();

    for (let i = 0; i < analyser.frequencyBinCount - 1; i++) {
      const x = i * widthScalar;
      const y = analyserDataArray[i] * heightScalar;

      if (i === 0) {
        canvasContext.moveTo(x, y);
      } else {
        canvasContext.lineTo(x, y);
      }
    }

    canvasContext.lineTo(
      analyserDataArray.length * widthScalar,
      analyserDataArray[analyser.frequencyBinCount - 1] * heightScalar
    );
    canvasContext.stroke();
  }

  function drawMicrophone() {
    window.requestAnimationFrame(() => {
      renderMicData();
      drawMicrophone();
    });
  }

  drawMicrophone();

  while (true) {
    if (audioContext.state === "running") {
      await new Promise((resolve, reject) => {
        window.requestAnimationFrame(() => {
          visualizer.render();
          resolve();
        });
      });
    } else {
      await new Promise((resolve, reject) => {
        window.requestAnimationFrame(() => {
          audioContext.resume();
          resolve();
        });
      });
    }
  }
}

log('invoking main()');

main();
