const INTERVAL_MS = 20_000;

const countdown = document.querySelector("#countdown");
const toggleButton = document.querySelector("#toggleButton");
const testButton = document.querySelector("#testButton");
const status = document.querySelector("#status");
const ringCount = document.querySelector("#ringCount");

let audioContext;
let timerId;
let running = false;
let nextRingAt = 0;
let rings = 0;

function getAudioContext() {
  audioContext ??= new (window.AudioContext || window.webkitAudioContext)();
  return audioContext;
}

// Web Audio APIで短い二音のチャイムを作るため、音声ファイルは不要です。
async function chime() {
  const context = getAudioContext();
  if (context.state === "suspended") await context.resume();

  [880, 1175].forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const start = context.currentTime + index * 0.13;
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.22, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.42);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + 0.45);
  });
}

function updateDisplay() {
  if (!running) return;
  const remaining = Math.max(0, Math.ceil((nextRingAt - Date.now()) / 1000));
  countdown.textContent = remaining;

  if (Date.now() >= nextRingAt) {
    chime();
    rings += 1;
    ringCount.textContent = rings;
    // 実時間基準で次回を決め、画面描画の遅延で周期がずれないようにします。
    do nextRingAt += INTERVAL_MS;
    while (nextRingAt <= Date.now());
  }
}

async function start() {
  // 最初の操作で音声コンテキストを有効化します。開始直後には鳴らしません。
  const context = getAudioContext();
  if (context.state === "suspended") await context.resume();
  running = true;
  nextRingAt = Date.now() + INTERVAL_MS;
  timerId = window.setInterval(updateDisplay, 250);
  updateDisplay();
  toggleButton.textContent = "停止";
  status.textContent = "20秒ごとに時報を鳴らしています";
}

function stop() {
  running = false;
  window.clearInterval(timerId);
  countdown.textContent = "20";
  toggleButton.textContent = "開始";
  status.textContent = "停止中";
}

toggleButton.addEventListener("click", () => running ? stop() : start());
testButton.addEventListener("click", chime);
