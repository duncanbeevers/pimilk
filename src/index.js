import butterchurn from "butterchurn";
import butterchurnPresets from "butterchurn-presets";

async function start() {
  const canvas = document.getElementsByTagName("canvas")[0];
  const audioContext = new window.AudioContext();
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: false,
  });

  const gainNode = new GainNode(audioContext);
  const microphoneStream = audioContext.createMediaStreamSource(stream);
  microphoneStream.connect(gainNode);

  const size = {
    width: canvas.clientWidth,
    height: canvas.clientHeight,
  };

  const presets = Object.values(butterchurnPresets.getPresets());
  const preset = presets[Math.floor(Math.random() * presets.length)];

  const visualizer = butterchurn.createVisualizer(audioContext, canvas, size);
  visualizer.connectAudio(gainNode);
  visualizer.loadPreset(preset, 0.0);

  window.addEventListener(
    "resize",
    () =>
      visualizer &&
      visualizer.setRendererSize(canvas.clientWidth, canvas.clientHeight)
  );

  function scheduleRender() {
    window.requestAnimationFrame(() => {
      visualizer && visualizer.render();
      scheduleRender();
    });
  }

  scheduleRender();
}

start();
