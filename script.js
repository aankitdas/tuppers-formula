const drawSection = document.getElementById("drawSection");
const textSection = document.getElementById("textSection");
const drawModeBtn = document.getElementById("drawModeBtn");
const textModeBtn = document.getElementById("textModeBtn");

drawModeBtn.addEventListener("click", () => {
  drawSection.style.display = "block";
  textSection.style.display = "none";
  drawModeBtn.classList.add("active");
  textModeBtn.classList.remove("active");
});

textModeBtn.addEventListener("click", () => {
  drawSection.style.display = "none";
  textSection.style.display = "block";
  textModeBtn.classList.add("active");
  drawModeBtn.classList.remove("active");
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
      ctx.fillStyle = grid[y][x] ? "#4a90e2" : "#2b2b2b"; // dark mode colors
      ctx.fillRect(x * scale, y * scale, scale, scale);
      ctx.strokeStyle = "#444";
      ctx.strokeRect(x * scale, y * scale, scale, scale);
    }
  }
}

// Mouse events
canvas.addEventListener("mousedown", () => drawing = true);
canvas.addEventListener("mouseup", () => drawing = false);
canvas.addEventListener("mouseleave", () => drawing = false);
canvas.addEventListener("mousemove", drawPixel);

// Touch events for mobile
canvas.addEventListener("touchstart", (e) => {
  e.preventDefault();
  drawing = true;
  const touch = e.touches[0];
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor((touch.clientX - rect.left) / scale);
  const y = Math.floor((touch.clientY - rect.top) / scale);
  if (x >= 0 && x < colsGraph && y >= 0 && y < rowsGraph) {
    grid[y][x] = 1;
    drawGrid();
  }
});

canvas.addEventListener("touchmove", (e) => {
  e.preventDefault();
  if (!drawing) return;
  const touch = e.touches[0];
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor((touch.clientX - rect.left) / scale);
  const y = Math.floor((touch.clientY - rect.top) / scale);
  if (x >= 0 && x < colsGraph && y >= 0 && y < rowsGraph) {
    grid[y][x] = 1;
    drawGrid();
  }
});

canvas.addEventListener("touchend", () => drawing = false);
canvas.addEventListener("touchcancel", () => drawing = false);


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
  ctx.font = "16px monospace";
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
      grid[y][x] = (r + g + b) / 3 < 128 ? 1 : 0;
    }
  }

  return grid.reverse();
}

// Generate k from grid
function generateKFromGrid(grid) {
  let k = BigInt(0);
  for (let x = 0; x < grid[0].length; x++) {
    for (let y = 0; y < grid.length; y++) {
      k += BigInt(grid[y][x]) << BigInt(y + rowsGraph * x);
    }
  }
  return k;
}

// ===== BUTTONS =====
// Copy k from drawing
document.getElementById("copyKBtn").addEventListener("click", () => {
  const kValue = document.getElementById("kOutput").value;
  if (kValue) {
    navigator.clipboard.writeText(kValue)
      .then(() => {
        // Optional: temporary button text change
        const btn = document.getElementById("copyKBtn");
        const original = btn.textContent;
        btn.textContent = "Copied!";
        setTimeout(() => btn.textContent = original, 1000);
      })
      .catch(err => console.error("Failed to copy:", err));
  }
});

// Copy k from text
document.getElementById("copyTextKBtn").addEventListener("click", () => {
  const kValue = document.getElementById("textKOutput").value;
  if (kValue) {
    navigator.clipboard.writeText(kValue)
      .then(() => {
        const btn = document.getElementById("copyTextKBtn");
        const original = btn.textContent;
        btn.textContent = "Copied!";
        setTimeout(() => btn.textContent = original, 1000);
      })
      .catch(err => console.error("Failed to copy:", err));
  }
});
document.getElementById("generateKBtn").addEventListener("click", () => {
  const reversedGrid = [...grid].reverse();
  const k = generateKFromGrid(reversedGrid);
  document.getElementById("kOutput").value = k.toString();
});

document.getElementById("textToKBtn").addEventListener("click", () => {
  const text = document.getElementById("textInput").value;
  const textGrid = textToBitmap(text);
  const k = generateKFromGrid(textGrid);
  document.getElementById("textKOutput").value = k.toString();
});

// ===== FORMULA PLOTTING =====
const graphCanvas = document.getElementById("formulaGraph");
const graphCtx = graphCanvas.getContext("2d");

function drawAxes(maxCols = colsGraph, maxRows = rowsGraph) {
  graphCtx.clearRect(0, 0, graphCanvas.width, graphCanvas.height);

  graphCtx.strokeStyle = "#888";
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

  graphCtx.fillStyle = "#fff";
  graphCtx.font = "12px monospace";

  const xTicks = 10;
  const yTicks = 5;

  for (let i = 0; i <= xTicks; i++) {
    const x = (i / xTicks) * graphCanvas.width;
    const label = Math.round((i / xTicks) * (maxCols - 1));
    graphCtx.fillText(label, x - 10, graphCanvas.height + 15);
  }

  for (let i = 0; i <= yTicks; i++) {
    const y = graphCanvas.height - (i / yTicks) * graphCanvas.height;
    const label = Math.round((i / yTicks) * (maxRows - 1));
    graphCtx.fillText(label, 8, y + 4);
  }
}
function getColsFromK(k) {
  // Each column has 17 bits (rows)
  const totalBits = k.toString(2).length;
  return Math.ceil(totalBits / rowsGraph);
}

function plotFormulaGraph(kValue) {
  let k = BigInt(kValue);

  // Dynamically compute columns from k
  const cols = getColsFromK(k);
  const rows = rowsGraph; // fixed rows

  // Dynamically adjust canvas size
  graphCanvas.width = Math.max(600, cols * 5 + 20);
  graphCanvas.height = Math.max(200, rows * 5 + 20);

  // Calculate plot scale
  const scaleX = graphCanvas.width / cols;
  const scaleY = graphCanvas.height / rows;
  const plotScale = Math.min(scaleX, scaleY);

  drawAxes(cols, rows);

  for (let x = 0; x < cols; x++) {
    for (let y = 0; y < rows; y++) {
      const bit = (k >> BigInt(y + rows * x)) & BigInt(1);
      if (bit === BigInt(1)) {
        graphCtx.fillStyle = "#4a90e2";
        graphCtx.fillRect(
          x * plotScale,
          graphCanvas.height - (y + 1) * plotScale,
          plotScale,
          plotScale
        );
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
