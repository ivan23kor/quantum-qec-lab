const stepList = document.getElementById("step-list");
const qubitRow = document.getElementById("qubit-row");
const explain = document.getElementById("explain");
const stateTag = document.getElementById("state-tag");

const s1El = document.getElementById("s1");
const s2El = document.getElementById("s2");
const decoderEl = document.getElementById("decoder");
const logicalOutEl = document.getElementById("logical-out");

const errorRateInput = document.getElementById("error-rate");
const pValue = document.getElementById("p-value");
const shotsInput = document.getElementById("shots");
const shotsValue = document.getElementById("shots-value");
const logicalInput = document.getElementById("logical-input");
const errorModel = document.getElementById("error-model");

const stepBtn = document.getElementById("step-btn");
const rerunBtn = document.getElementById("rerun-btn");
const experimentBtn = document.getElementById("experiment-btn");

const plainBar = document.getElementById("plain-bar");
const qecBar = document.getElementById("qec-bar");
const gainBar = document.getElementById("gain-bar");
const plainLabel = document.getElementById("plain-label");
const qecLabel = document.getElementById("qec-label");
const gainLabel = document.getElementById("gain-label");

const STEPS = ["encode", "noise", "syndrome", "decode"];
const syndromeToError = {
  "10": 0,
  "11": 1,
  "01": 2
};

let currentCycle = null;
let currentStepIdx = -1;

function rand() {
  return Math.random();
}

function makeCycle() {
  const logical = Number(logicalInput.value);
  const p = Number(errorRateInput.value);
  const model = errorModel.value;

  const encoded = [logical, logical, logical];
  const errored = [...encoded];
  const errorMask = [0, 0, 0];

  const adjustedP = model === "biased" ? [p * 0.7, Math.min(0.8, p * 1.5), p * 0.7] : [p, p, p];

  for (let i = 0; i < 3; i += 1) {
    if (rand() < adjustedP[i]) {
      errored[i] ^= 1;
      errorMask[i] = 1;
    }
  }

  const s1 = errored[0] ^ errored[1];
  const s2 = errored[1] ^ errored[2];
  const syndrome = `${s1}${s2}`;

  const corrected = [...errored];
  let decoderAction = "No correction needed";
  if (syndrome in syndromeToError) {
    const idx = syndromeToError[syndrome];
    corrected[idx] ^= 1;
    decoderAction = `Apply X on q${idx + 1}`;
  }

  const ones = corrected[0] + corrected[1] + corrected[2];
  const logicalOut = ones >= 2 ? 1 : 0;

  return {
    logical,
    encoded,
    errored,
    corrected,
    errorMask,
    syndrome,
    decoderAction,
    logicalOut
  };
}

function setStep(stepName) {
  [...stepList.children].forEach((el) => {
    el.classList.toggle("active", el.dataset.step === stepName);
  });
}

function qubitCard(value, idx, flipped) {
  const bitClass = value === 0 ? "zero" : "one";
  const flipClass = flipped ? "flipped" : "";
  return `
    <div class="qubit">
      <div class="disk ${bitClass} ${flipClass}">${value}</div>
      <p>q${idx + 1}</p>
    </div>
  `;
}

function renderByStep() {
  if (!currentCycle) return;

  const step = STEPS[currentStepIdx] ?? "idle";
  setStep(step);

  if (step === "encode") {
    qubitRow.innerHTML = currentCycle.encoded.map((v, i) => qubitCard(v, i, false)).join("");
    stateTag.textContent = "Encoded";
    explain.textContent = "Logical information is spread across three physical qubits: |0>L -> 000, |1>L -> 111.";
    s1El.textContent = "-";
    s2El.textContent = "-";
    decoderEl.textContent = "-";
    logicalOutEl.textContent = "-";
  }

  if (step === "noise") {
    qubitRow.innerHTML = currentCycle.errored
      .map((v, i) => qubitCard(v, i, currentCycle.errorMask[i] === 1))
      .join("");
    stateTag.textContent = "Noise Applied";
    explain.textContent = "Random X errors flip some physical qubits. A single flip is usually recoverable.";
  }

  if (step === "syndrome") {
    qubitRow.innerHTML = currentCycle.errored
      .map((v, i) => qubitCard(v, i, currentCycle.errorMask[i] === 1))
      .join("");
    stateTag.textContent = "Syndrome Measured";
    s1El.textContent = currentCycle.syndrome[0];
    s2El.textContent = currentCycle.syndrome[1];
    explain.textContent = "Parity checks locate where the bit-flip likely happened without reading logical value directly.";
  }

  if (step === "decode") {
    qubitRow.innerHTML = currentCycle.corrected.map((v, i) => qubitCard(v, i, false)).join("");
    stateTag.textContent = "Decoded + Corrected";
    s1El.textContent = currentCycle.syndrome[0];
    s2El.textContent = currentCycle.syndrome[1];
    decoderEl.textContent = currentCycle.decoderAction;
    logicalOutEl.textContent = `${currentCycle.logicalOut} ${currentCycle.logicalOut === currentCycle.logical ? "(success)" : "(logical error)"}`;
    explain.textContent = "Majority vote and syndrome-based correction recover the logical bit unless multiple physical errors occurred.";
  }
}

function newCycle(resetStep = true) {
  currentCycle = makeCycle();
  if (resetStep) {
    currentStepIdx = -1;
    setStep("idle");
    qubitRow.innerHTML = "";
    stateTag.textContent = "Ready";
    explain.textContent = "Press “Step Through One Cycle” to animate encode, noise, syndrome, and correction.";
    s1El.textContent = "-";
    s2El.textContent = "-";
    decoderEl.textContent = "-";
    logicalOutEl.textContent = "-";
  }
}

function stepCycle() {
  if (!currentCycle) {
    newCycle(false);
  }
  currentStepIdx += 1;
  if (currentStepIdx >= STEPS.length) {
    newCycle(false);
    currentStepIdx = 0;
  }
  renderByStep();
}

function runExperiment() {
  const shots = Number(shotsInput.value);
  const p = Number(errorRateInput.value);
  const logical = Number(logicalInput.value);
  const model = errorModel.value;

  let plainSuccess = 0;
  let qecSuccess = 0;

  for (let i = 0; i < shots; i += 1) {
    const plain = rand() < p ? logical ^ 1 : logical;
    if (plain === logical) plainSuccess += 1;

    const adjustedP = model === "biased" ? [p * 0.7, Math.min(0.8, p * 1.5), p * 0.7] : [p, p, p];
    const bits = [logical, logical, logical];

    for (let j = 0; j < 3; j += 1) {
      if (rand() < adjustedP[j]) bits[j] ^= 1;
    }

    const s1 = bits[0] ^ bits[1];
    const s2 = bits[1] ^ bits[2];
    const syn = `${s1}${s2}`;

    if (syn in syndromeToError) {
      bits[syndromeToError[syn]] ^= 1;
    }

    const out = bits[0] + bits[1] + bits[2] >= 2 ? 1 : 0;
    if (out === logical) qecSuccess += 1;
  }

  const plainPct = (plainSuccess / shots) * 100;
  const qecPct = (qecSuccess / shots) * 100;
  const gain = qecPct - plainPct;

  plainBar.style.width = `${plainPct.toFixed(1)}%`;
  qecBar.style.width = `${qecPct.toFixed(1)}%`;
  gainBar.style.width = `${Math.max(0, Math.min(100, Math.abs(gain) * 2)).toFixed(1)}%`;

  plainLabel.textContent = `${plainPct.toFixed(1)}%`;
  qecLabel.textContent = `${qecPct.toFixed(1)}%`;
  gainLabel.textContent = `${gain >= 0 ? "+" : ""}${gain.toFixed(1)} pts`;
}

errorRateInput.addEventListener("input", () => {
  pValue.textContent = Number(errorRateInput.value).toFixed(2);
  newCycle(true);
});

shotsInput.addEventListener("input", () => {
  shotsValue.textContent = shotsInput.value;
});

logicalInput.addEventListener("change", () => newCycle(true));
errorModel.addEventListener("change", () => newCycle(true));

stepBtn.addEventListener("click", stepCycle);
rerunBtn.addEventListener("click", () => {
  newCycle(false);
  currentStepIdx = STEPS.length - 1;
  stepCycle();
});
experimentBtn.addEventListener("click", runExperiment);

newCycle(true);
runExperiment();
