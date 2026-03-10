/**
 * WEB-BASED DIGITAL IC TESTER
 * Core Logic Script
 */

// --- IC DATABASE ---
const IC_DB = {
  "7400": {
    type: "Quad 2-Input NAND Gate",
    pins: 14,
    description: "Contains four independent 2-input NAND gates.",
    pinout: ["1A", "1B", "1Y", "2A", "2B", "2Y", "GND", "3Y", "3A", "3B", "4Y", "4A", "4B", "VCC"],
    truthTable: [
      ["A", "B", "Y"],
      ["0", "0", "1"],
      ["0", "1", "1"],
      ["1", "0", "1"],
      ["1", "1", "0"]
    ]
  },
  "7402": {
    type: "Quad 2-Input NOR Gate",
    pins: 14,
    description: "Contains four independent 2-input NOR gates.",
    pinout: ["1Y", "1A", "1B", "2Y", "2A", "2B", "GND", "3A", "3B", "3Y", "4A", "4B", "4Y", "VCC"],
    truthTable: [
      ["A", "B", "Y"],
      ["0", "0", "1"],
      ["0", "1", "0"],
      ["1", "0", "0"],
      ["1", "1", "0"]
    ]
  },
  "7404": {
    type: "Hex Inverter",
    pins: 14,
    description: "Contains six independent inverters.",
    pinout: ["1A", "1Y", "2A", "2Y", "3A", "3Y", "GND", "4Y", "4A", "5Y", "5A", "6Y", "6A", "VCC"],
    truthTable: [
      ["A", "Y"],
      ["0", "1"],
      ["1", "0"]
    ]
  },
  "7408": {
    type: "Quad 2-Input AND Gate",
    pins: 14,
    description: "Contains four independent 2-input AND gates.",
    pinout: ["1A", "1B", "1Y", "2A", "2B", "2Y", "GND", "3Y", "3A", "3B", "4Y", "4A", "4B", "VCC"],
    truthTable: [
      ["A", "B", "Y"],
      ["0", "0", "0"],
      ["0", "1", "0"],
      ["1", "0", "0"],
      ["1", "1", "1"]
    ]
  },
  "7432": {
    type: "Quad 2-Input OR Gate",
    pins: 14,
    description: "Contains four independent 2-input OR gates.",
    pinout: ["1A", "1B", "1Y", "2A", "2B", "2Y", "GND", "3Y", "3A", "3B", "4Y", "4A", "4B", "VCC"],
    truthTable: [
      ["A", "B", "Y"],
      ["0", "0", "0"],
      ["0", "1", "1"],
      ["1", "0", "1"],
      ["1", "1", "1"]
    ]
  },
  "7486": {
    type: "Quad 2-Input XOR Gate",
    pins: 14,
    description: "Contains four independent 2-input Exclusive-OR gates.",
    pinout: ["1A", "1B", "1Y", "2A", "2B", "2Y", "GND", "3Y", "3A", "3B", "4Y", "4A", "4B", "VCC"],
    truthTable: [
      ["A", "B", "Y"],
      ["0", "0", "0"],
      ["0", "1", "1"],
      ["1", "0", "1"],
      ["1", "1", "0"]
    ]
  },
  "7474": {
    type: "Dual D-Type Flip-Flop",
    pins: 14,
    description: "Contains two independent D-type flip-flops with preset and clear.",
    pinout: ["1CLR", "1D", "1CLK", "1PRE", "1Q", "1Q'", "GND", "2Q'", "2Q", "2PRE", "2CLK", "2D", "2CLR", "VCC"],
    truthTable: [
      ["D", "CLK", "Q", "Q'"],
      ["L", "↑", "L", "H"],
      ["H", "↑", "H", "L"]
    ]
  },
  "555": {
    type: "Timer",
    pins: 8,
    description: "Precision timer for producing oscillation or delays.",
    pinout: ["GND", "TRIG", "OUT", "RESET", "CTRL", "THR", "DIS", "VCC"],
    truthTable: [
      ["Mode", "Output"],
      ["Monostable", "Pulse"],
      ["Astable", "Wave"]
    ]
  },
  "4017": {
    type: "Decade Counter",
    pins: 16,
    description: "5-stage Johnson decade counter.",
    pinout: ["Q5", "Q1", "Q0", "Q2", "Q6", "Q7", "Q3", "GND", "Q8", "Q4", "Q9", "CO", "CE", "CLK", "RST", "VCC"],
    truthTable: [
      ["CLK", "RST", "Action"],
      ["↑", "L", "Count"],
      ["X", "H", "Reset"]
    ]
  },
  "LM741": {
    type: "Operational Amplifier",
    pins: 8,
    description: "General purpose operational amplifier.",
    pinout: ["OFF1", "IN-", "IN+", "V-", "OFF2", "OUT", "V+", "NC"],
    truthTable: [
      ["Function", "Pin"],
      ["Inverting", "2"],
      ["Non-Inv", "3"]
    ]
  }
};

// --- GLOBAL STATE ---
let serialPort = null;
let writer = null;
let reader = null;
let isConnected = false;
let currentIC = null;

// --- DOM ELEMENTS ---
const el = {
  landing: document.getElementById('landing-page'),
  modeSel: document.getElementById('mode-selection'),
  manual: document.getElementById('manual-test'),
  auto: document.getElementById('auto-identify'),
  connectBtn: document.getElementById('connect-btn'),
  statusText: document.getElementById('status-text'),
  statusLed: document.getElementById('status-led'),
  icList: document.getElementById('ic-list'),
  icSelect: document.getElementById('ic-select'),
  icSearch: document.getElementById('ic-search'),
  pinoutContainer: document.getElementById('pinout-diagram'),
  truthTable: document.getElementById('truth-table'),
  console: document.getElementById('console-output'),
  icName: document.getElementById('selected-ic-name'),
  icDesc: document.getElementById('selected-ic-desc'),
  runTestBtn: document.getElementById('run-test-btn'),
  scanResult: document.getElementById('scan-result'),
  detectedIc: document.getElementById('detected-ic')
};

// --- INITIALIZATION ---
function init() {
  populateICList();
  bindEvents();
  // Pre-select first IC if debug
  // selectIC("7400"); 
}

function bindEvents() {
  el.connectBtn.addEventListener('click', connectSerial);

  document.getElementById('btn-mode-manual').addEventListener('click', () => navigateTo('manual'));
  document.getElementById('btn-mode-auto').addEventListener('click', () => navigateTo('auto'));
  document.getElementById('back-from-manual').addEventListener('click', () => navigateTo('modeSel'));
  document.getElementById('back-from-auto').addEventListener('click', () => navigateTo('modeSel'));

  el.icSearch.addEventListener('input', (e) => filterICList(e.target.value));
  el.icSelect.addEventListener('change', (e) => selectIC(e.target.value));
  el.runTestBtn.addEventListener('click', runManualTest);
  document.getElementById('start-scan-btn').addEventListener('click', runAutoScan);
}

// --- NAVIGATION ---
function navigateTo(page) {
  document.querySelectorAll('section').forEach(s => s.classList.add('hidden-section'));
  document.querySelectorAll('section').forEach(s => s.classList.remove('active-section'));

  if (page === 'landing') el.landing.classList.remove('hidden-section');
  else if (page === 'modeSel') el.modeSel.classList.remove('hidden-section');
  else if (page === 'manual') el.manual.classList.remove('hidden-section');
  else if (page === 'auto') el.auto.classList.remove('hidden-section');
}

// --- SERIAL COMMUNICATION ---
async function connectSerial() {
  if (!navigator.serial) {
    logToConsole("Web Serial API not supported in this browser.", 'fail');
    return;
  }

  try {
    serialPort = await navigator.serial.requestPort();
    await serialPort.open({ baudRate: 9600 });

    isConnected = true;
    updateConnectionStatus(true);
    startReading();

    // Move to mode selection
    navigateTo('modeSel');
    logToConsole("Serial Port Connected. Baud: 9600", 'pass');

  } catch (err) {
    console.error(err);
    logToConsole(`Connection failed: ${err.message}`, 'fail');
    alert("Failed to connect: " + err.message);
  }
}

function updateConnectionStatus(connected) {
  el.statusText.innerText = connected ? "CONNECTED" : "DISCONNECTED";
  if (connected) el.statusLed.classList.add('connected');
  else el.statusLed.classList.remove('connected');
}

async function startReading() {
  const textDecoder = new TextDecoderStream();
  const readableStreamClosed = serialPort.readable.pipeTo(textDecoder.writable);
  const streamReader = textDecoder.readable.getReader();
  reader = streamReader;

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        // Reader has been canceled.
        break;
      }
      if (value) {
        handleSerialData(value.trim());
      }
    }
  } catch (error) {
    logToConsole(`Read Error: ${error}`, 'fail');
  } finally {
    reader.releaseLock();
  }
}

async function sendCommand(cmd) {
  if (!serialPort || !isConnected) {
    logToConsole("Error: Device not connected.", 'fail');
    return;
  }

  const textEncoder = new TextEncoderStream();
  const writableStreamClosed = textEncoder.readable.pipeTo(serialPort.writable);
  const writer = textEncoder.writable.getWriter();

  await writer.write(cmd + "\n");
  writer.releaseLock();
  logToConsole(`>> SENT: ${cmd}`, 'info');
}

function handleSerialData(data) {
  logToConsole(`<< RECV: ${data}`, 'pass');

  // Simple basic parsing
  if (data.startsWith("RES:")) {
    // e.g. RES:PASS
    handleTestResult(data.split(":")[1]);
  } else if (data.startsWith("ID:")) {
    // e.g. ID:7400
    handleAutoIdResult(data.split(":")[1]);
  }
}

// --- LOGIC: MANUAL TEST ---
function populateICList() {
  el.icSelect.innerHTML = "";
  el.icList.innerHTML = "";

  Object.keys(IC_DB).forEach(key => {
    // Option for select
    const option = document.createElement("option");
    option.value = key;
    option.innerText = `${key} - ${IC_DB[key].type}`;
    el.icSelect.appendChild(option);

    // Datalist option
    const dlOption = document.createElement("option");
    dlOption.value = key;
    el.icList.appendChild(dlOption);
  });
}

function filterICList(query) {
  const opts = el.icSelect.options;
  for (let i = 0; i < opts.length; i++) {
    const text = opts[i].text.toLowerCase();
    const val = opts[i].value.toLowerCase();
    const q = query.toLowerCase();

    if (text.includes(q) || val.includes(q)) {
      opts[i].style.display = "";
      if (val === q) opts[i].selected = true;
    } else {
      opts[i].style.display = "none";
    }
  }

  // Auto-select if match found
  if (IC_DB[query]) selectIC(query);
}

function selectIC(icKey) {
  if (!IC_DB[icKey]) return;

  currentIC = icKey;
  const data = IC_DB[icKey];

  el.icName.innerText = `IC ${icKey}`;
  el.icDesc.innerText = data.type + ". " + data.description;
  el.runTestBtn.disabled = false;
  el.runTestBtn.innerHTML = `<i class="fa-solid fa-play"></i> RUN TEST: ${icKey}`;

  renderPinout(data);
  renderTruthTable(data);
}

function renderPinout(data) {
  el.pinoutContainer.innerHTML = "";

  const chip = document.createElement("div");
  chip.classList.add("chip-body");

  // Notch
  const notch = document.createElement("div");
  notch.classList.add("chip-notch");
  chip.appendChild(notch);

  // Label
  const label = document.createElement("div");
  label.classList.add("chip-label");
  label.innerText = currentIC;
  chip.appendChild(label);

  // Pins
  const leftRow = document.createElement("div");
  leftRow.className = "pin-row left";

  const rightRow = document.createElement("div");
  rightRow.className = "pin-row right";

  const count = data.pins;
  const half = count / 2;

  data.pinout.forEach((pinName, index) => {
    const pin = document.createElement("div");
    pin.classList.add("pin");
    pin.dataset.pin = pinName; // Label attr

    const indicator = document.createElement("div");
    indicator.classList.add("pin-indicator");
    // Give unique ID for status updates
    indicator.id = `pin-status-${index + 1}`;

    pin.appendChild(indicator);

    // 1-indexed pin numbering logic
    // 1 to half -> Left Row (Top to Bottom)
    // half+1 to count -> Right Row (Bottom to Top)

    const pinNum = index + 1;

    if (pinNum <= half) {
      pin.classList.add("left");
      leftRow.appendChild(pin);
    } else {
      pin.classList.add("right");
      // Standard DIP numbering goes CCW.
      // Right row needs to be populated such that the standard rendering works?
      // Usually in HTML flex col, they go top down.
      // Pin half+1 is bottom right. Pin count is top right.
      // So we need to prepend to make top-right the last one?
      // Actually, let's just use flex-direction: column-reverse for right side?
      // OR just insert normally and let CSS handle order if we are careful.
      // Let's stick to standard flow: Right row top is pin N, bottom is pin N/2 + 1.
      // So we need to reverse the order of elements for the Right Row in visual DOM if we want 1...N/2...N

      // Wait, standard visual:
      // 1 -- U -- N
      // 2         N-1
      // ...       ...
      // N/2       N/2+1

      // Our array is linear: 1, 2... N.
      // So pins [half] to [count-1] are the right side.
      // But visually, pin [count] is TOP right. Pin [half+1] is BOTTOM right.
      // So we should PREPEND to rightRow container?
      rightRow.prepend(pin);
    }
  });

  chip.appendChild(leftRow);
  chip.appendChild(rightRow);
  el.pinoutContainer.appendChild(chip);
}

function renderTruthTable(data) {
  const tbody = el.truthTable.querySelector("tbody");
  const thead = el.truthTable.querySelector("thead");

  thead.innerHTML = "";
  tbody.innerHTML = "";

  // Headers
  const headerRow = document.createElement("tr");
  data.truthTable[0].forEach(h => {
    const th = document.createElement("th");
    th.innerText = h;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);

  // Rows
  for (let i = 1; i < data.truthTable.length; i++) {
    const row = document.createElement("tr");
    data.truthTable[i].forEach(cell => {
      const td = document.createElement("td");
      td.innerText = cell;
      row.appendChild(td);
    });
    tbody.appendChild(row);
  }
}

function runManualTest() {
  if (!currentIC) return;

  logToConsole(`Initializing test for ${currentIC}...`, 'info');
  // Clear previous results
  document.querySelectorAll('.pin-indicator').forEach(p => {
    p.style.backgroundColor = '#333';
    p.style.boxShadow = 'none';
  });

  sendCommand(`TEST:${currentIC}`);

  // Simulation for demo (if no hardware response immediately)
  // Uncomment below to simulate without hardware
  // setTimeout(() => simulateResult(currentIC), 1000);
}

function handleTestResult(resultCode) {
  // Expected format: PASS or FAIL or map string (e.g. 11101...)
  // For this demo, let's assume "PASS" or "FAIL" generic
  if (resultCode.includes("PASS")) {
    logToConsole("Result: INTEGRITY CONFIRMED (PASS)", 'pass');
    // Light all up green
    document.querySelectorAll('.pin-indicator').forEach(p => {
      p.style.backgroundColor = '#00ff41';
      p.style.boxShadow = '0 0 5px #00ff41';
    });
  } else {
    logToConsole("Result: INTEGRITY COMPROMISED (FAIL)", 'fail');
    // Light random pins red for effect
    document.querySelectorAll('.pin-indicator').forEach((p, i) => {
      if (i % 3 === 0) {
        p.style.backgroundColor = '#ff003c';
        p.style.boxShadow = '0 0 5px #ff003c';
      } else {
        p.style.backgroundColor = '#00ff41';
      }
    });
  }
}

// --- LOGIC: AUTO SCAN ---
function runAutoScan() {
  el.scanResult.classList.add('hidden');
  document.getElementById('scan-status').innerText = "SCANNING...";

  const scanner = document.querySelector('.scanner-circle');
  scanner.style.animationDuration = "0.5s"; // Fast spin

  logToConsole("Initiating Auto-Scan protocol...", 'info');
  sendCommand("SCAN:AUTO");

  // Simulation
  // setTimeout(() => handleAutoIdResult("7400"), 2000);
}

function handleAutoIdResult(id) {
  const scanner = document.querySelector('.scanner-circle');
  scanner.style.animationDuration = "2s"; // Normal spin

  el.scanResult.classList.remove('hidden');
  document.getElementById('scan-status').innerText = "SCAN COMPLETE";

  if (id && id !== "UNKNOWN") {
    el.detectedIc.innerText = id;
    document.getElementById('integrity-status').innerText = "Match Found in Database.";
    document.getElementById('integrity-status').style.color = "var(--neon-green)";
    logToConsole(`Identify Success: ${id}`, 'pass');
  } else {
    el.detectedIc.innerText = "UNKNOWN";
    el.detectedIc.style.color = "var(--neon-red)";
    document.getElementById('integrity-status').innerText = "Signature mismatch or component faulty.";
    document.getElementById('integrity-status').style.color = "var(--neon-red)";
    logToConsole("Identify Failed: Unknown Component", 'fail');
  }
}

// --- UTILS ---
function logToConsole(msg, type = 'info') {
  const time = new Date().toLocaleTimeString('en-US', { hour12: false });
  const div = document.createElement("div");
  div.classList.add("log-line");
  if (type === 'pass') div.classList.add("log-pass");
  if (type === 'fail') div.classList.add("log-fail");
  if (type === 'info') div.classList.add("log-info");

  div.innerText = `[${time}] ${msg}`;
  el.console.appendChild(div);
  el.console.scrollTop = el.console.scrollHeight;
}

// Start
init();
