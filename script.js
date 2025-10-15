const drawSection = document.getElementById("drawSection");
const textSection = document.getElementById("textSection");
const drawModeBtn = document.getElementById("drawModeBtn");
const textModeBtn = document.getElementById("textModeBtn");

drawModeBtn.addEventListener("click", () => {
  drawSection.style.display = "block";
  textSection.style.display = "none";
});

textModeBtn.addEventListener("click", () => {
  drawSection.style.display = "none";
  textSection.style.display = "block";
});

// ===== SETTINGS =====
const colsGraph = 106;
const rowsGraph = 17;
const scale = 5; // for canvas drawing

// ===== DRAWING LOGIC =====
const canvas = document.getElementById("drawingCanvas");
const ctx = canvas.getContext("2d");

let grid = Array.from({ length: rowsGraph }, () => Array(colsGraph).fill(0));
let drawing = false;

function drawGrid() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let y = 0; y < rowsGraph; y++) {
    for (let x = 0; x < colsGraph; x++) {
      ctx.fillStyle = grid[y][x] ? "#000" : "#fff";
      ctx.fillRect(x * scale, y * scale, scale, scale);
      ctx.strokeStyle = "#ccc";
      ctx.strokeRect(x * scale, y * scale, scale, scale);
    }
  }
}

// Mouse events
canvas.addEventListener("mousedown", () => drawing = true);
canvas.addEventListener("mouseup", () => drawing = false);
canvas.addEventListener("mouseleave", () => drawing = false);
canvas.addEventListener("mousemove", drawPixel);

function drawPixel(e) {
  if (!drawing) return;
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor((e.clientX - rect.left) / scale);
  const y = Math.floor((e.clientY - rect.top) / scale);
  if (x >= 0 && x < colsGraph && y >= 0 && y < rowsGraph) {
    grid[y][x] = 1;
    drawGrid();
  }
}

// Clear drawing
document.getElementById("clearBtn").addEventListener("click", () => {
  grid = Array.from({ length: rowsGraph }, () => Array(colsGraph).fill(0));
  drawGrid();
});

// ===== TEXT TO BITMAP USING HIDDEN CANVAS =====
function textToBitmap(text) {
  const offCanvas = document.createElement("canvas");
  offCanvas.width = colsGraph;
  offCanvas.height = rowsGraph;
  const ctx = offCanvas.getContext("2d");

  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, colsGraph, rowsGraph);

  ctx.fillStyle = "#000";
  ctx.font = "16px monospace"; // tweak to fit 106x17
  ctx.textBaseline = "top";
  ctx.fillText(text, 0, 0);

  const imageData = ctx.getImageData(0, 0, colsGraph, rowsGraph);
  const grid = Array.from({ length: rowsGraph }, () => Array(colsGraph).fill(0));

  for (let y = 0; y < rowsGraph; y++) {
    for (let x = 0; x < colsGraph; x++) {
      const index = (y * colsGraph + x) * 4;
      const r = imageData.data[index];
      const g = imageData.data[index + 1];
      const b = imageData.data[index + 2];
      grid[y][x] = (r + g + b) / 3 < 128 ? 1 : 0; // black pixel = 1
    }
  }

  return grid.reverse(); // bottom-up for Tupper
}

// Generate k from grid
function generateKFromGrid(grid) {
  let k = BigInt(0);
  for (let x = 0; x < colsGraph; x++) {
    for (let y = 0; y < rowsGraph; y++) {
      k += BigInt(grid[y][x]) << BigInt(y + 17 * x);
    }
  }
  return k;
}

// ===== BUTTONS =====

// Generate k from drawing
document.getElementById("generateKBtn").addEventListener("click", () => {
  const reversedGrid = [...grid].reverse(); // reverse the rows for Tupper
  const k = generateKFromGrid(reversedGrid);
  document.getElementById("kOutput").value = k.toString();
});

// Generate k from text input
document.getElementById("textToKBtn").addEventListener("click", () => {
  const text = document.getElementById("textInput").value;
  const textGrid = textToBitmap(text);
  const k = generateKFromGrid(textGrid);
  document.getElementById("textKOutput").value = k.toString();
});

// ===== FORMULA PLOTTING =====
const graphCanvas = document.getElementById("formulaGraph");
const graphCtx = graphCanvas.getContext("2d");

function drawAxes() {
  graphCtx.clearRect(0, 0, graphCanvas.width, graphCanvas.height);

  graphCtx.strokeStyle = "#333";
  graphCtx.lineWidth = 1;

  // X-axis
  graphCtx.beginPath();
  graphCtx.moveTo(0, graphCanvas.height);
  graphCtx.lineTo(graphCanvas.width, graphCanvas.height);
  graphCtx.stroke();

  // Y-axis
  graphCtx.beginPath();
  graphCtx.moveTo(0, 0);
  graphCtx.lineTo(0, graphCanvas.height);
  graphCtx.stroke();

  // Tick marks and labels
  graphCtx.fillStyle = "#333";
  graphCtx.font = "12px Arial";

  const xTicks = 10;
  const yTicks = 5;

  for (let i = 0; i <= xTicks; i++) {
    const x = (i / xTicks) * graphCanvas.width;
    graphCtx.beginPath();
    graphCtx.moveTo(x, graphCanvas.height);
    graphCtx.lineTo(x, graphCanvas.height - 5);
    graphCtx.stroke();
    graphCtx.fillText(Math.round((i / xTicks) * colsGraph), x - 5, graphCanvas.height + 15);
  }

  for (let i = 0; i <= yTicks; i++) {
    const y = graphCanvas.height - (i / yTicks) * graphCanvas.height;
    graphCtx.beginPath();
    graphCtx.moveTo(0, y);
    graphCtx.lineTo(5, y);
    graphCtx.stroke();
    graphCtx.fillText(Math.round((i / yTicks) * rowsGraph), 8, y + 4);
  }
}

function plotFormulaGraph(kValue) {
  drawAxes();

  let k = BigInt(kValue);

  for (let x = 0; x < colsGraph; x++) {
    for (let y = 0; y < rowsGraph; y++) {
      const bit = (k >> BigInt(y + 17 * x)) & BigInt(1);
      if (bit === BigInt(1)) {
        graphCtx.fillStyle = "#000";
        graphCtx.fillRect(x * scale, graphCanvas.height - (y + 1) * scale, scale, scale);
      }
    }
  }
}

// Plot k from input
document.getElementById("plotKBtn").addEventListener("click", () => {
  const kValue = document.getElementById("plotKInput").value.trim();
  if (kValue) plotFormulaGraph(kValue);
});

// Clear plot
document.getElementById("clearGraphBtn").addEventListener("click", () => {
  graphCtx.clearRect(0, 0, graphCanvas.width, graphCanvas.height);
  drawAxes();
});

// ===== INITIALIZATION =====
drawGrid();
drawAxes();
