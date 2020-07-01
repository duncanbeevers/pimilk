import butterchurn from "butterchurn";
import butterchurnPresets from "butterchurn-presets";

function addInteractionEventListeners(node, handler) {
  node.addEventListener('click', handler);
}

function removeInteractionEventListeners(node, handler) {
  node.removeEventListener('click', handler);
}

async function getUserInput() {
  return new Promise((resolve, reject) => {
    const overlayNode = window.DOM_NODE_OVERLAY;
    if (!overlayNode) {
      reject();
      return;
    }

    function onInteract() {
      overlayNode.classList.remove('visible');
      removeInteractionEventListeners(overlayNode, onInteract);
      resolve();
    }

    addInteractionEventListeners(overlayNode, onInteract);

    overlayNode.classList.add('visible');
  });
}

async function main() {
  const canvas = document.getElementsByTagName("canvas")[0];
  const audioContext = new window.AudioContext();
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: false,
  });

  const gainNode = new GainNode(audioContext);
  const microphoneStream = audioContext.createMediaStreamSource(stream);
  microphoneStream.connect(gainNode);

  const presets = Object.values(butterchurnPresets.getPresets());
  function getRandomPreset() {
    return presets[Math.floor(Math.random() * presets.length)];
  }

  const visualizer = butterchurn.createVisualizer(audioContext, canvas, {
    width: canvas.clientWidth,
    height: canvas.clientHeight,
  });

  visualizer.connectAudio(gainNode);
  visualizer.loadPreset(getRandomPreset(), 0.0);

  window.addEventListener(
    "resize",
    () =>
      visualizer.setRendererSize(canvas.clientWidth, canvas.clientHeight)
  );

  setInterval(() => {
    visualizer.loadPreset(getRandomPreset(), 1.0);
  }, 10000);

  while (true) {
    if (audioContext.state === 'running') {
      await new Promise((resolve, reject) => {
        window.requestAnimationFrame(() => {
          visualizer.render();
          resolve();
        });
      })
    } else {
      await getUserInput();
      await audioContext.resume();
    }
  }
}

main();
