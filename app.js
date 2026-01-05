const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const startBtn = document.getElementById("startBtn");
const resetBtn = document.getElementById("resetBtn");
const speedSlider = document.getElementById("speedSlider");
const algorithmSelect = document.getElementById("algorithmSelect");

const rows = 20;
const cols = 20;
const cellSize = 30;

canvas.width = cols * cellSize;
canvas.height = rows * cellSize;

let grid = [];
let start = null;
let goal = null;

let openSet = [];
let closedSet = [];
let intervalId = null;
let isRunning = false;

let visitedCount = 0;
let startTime = 0;

/* ================= NODE ================= */

class Node {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.wall = false;
    this.g = Infinity;
    this.f = Infinity;
    this.parent = null;
  }
}

/* ================= GRID ================= */

function createGrid() {
  grid = [];
  for (let y = 0; y < rows; y++) {
    let row = [];
    for (let x = 0; x < cols; x++) {
      row.push(new Node(x, y));
    }
    grid.push(row);
  }
}

createGrid();

/* ================= HELPERS ================= */

function heuristic(a, b) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function neighbors(n) {
  const dirs = [
    [1, 0], [-1, 0], [0, 1], [0, -1]
  ];
  return dirs
    .map(([dx, dy]) => grid[n.y + dy]?.[n.x + dx])
    .filter(Boolean);
}

function resetAlgo() {
  openSet = [];
  closedSet = [];
  visitedCount = 0;
  startTime = Date.now();

  for (let row of grid) {
    for (let n of row) {
      n.g = Infinity;
      n.f = Infinity;
      n.parent = null;
    }
  }
}

/* ================= DRAW ================= */

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let row of grid) {
    for (let n of row) {
      ctx.strokeStyle = "#ccc";
      ctx.strokeRect(n.x * cellSize, n.y * cellSize, cellSize, cellSize);

      if (n.wall) {
        ctx.fillStyle = "#000";
        ctx.fillRect(n.x * cellSize, n.y * cellSize, cellSize, cellSize);
      }
    }
  }

  for (let n of closedSet) {
    ctx.fillStyle = "#cce5ff";
    ctx.fillRect(n.x * cellSize, n.y * cellSize, cellSize, cellSize);
  }

  for (let n of openSet) {
    ctx.fillStyle = "#99ccff";
    ctx.fillRect(n.x * cellSize, n.y * cellSize, cellSize, cellSize);
  }

  if (start) {
    ctx.fillStyle = "green";
    ctx.fillRect(start.x * cellSize, start.y * cellSize, cellSize, cellSize);
  }

  if (goal) {
    ctx.fillStyle = "red";
    ctx.fillRect(goal.x * cellSize, goal.y * cellSize, cellSize, cellSize);
  }
}

/* ================= FINISH ================= */

function finish() {
  clearInterval(intervalId);
  isRunning = false;

  let current = goal;
  while (current.parent) {
    ctx.fillStyle = "yellow";
    ctx.fillRect(
      current.x * cellSize,
      current.y * cellSize,
      cellSize,
      cellSize
    );
    current = current.parent;
  }
}

/* ================= BFS ================= */

function startBFS() {
  resetAlgo();
  openSet.push(start);
  intervalId = setInterval(stepBFS, speedSlider.value);
}

function stepBFS() {
  if (!openSet.length) {
    clearInterval(intervalId);
    isRunning = false;
    alert("Yol bulunamadı.");
    return;
  }

  let current = openSet.shift();
  visitedCount++;

  if (current === goal) {
    finish();
    return;
  }

  closedSet.push(current);

  for (let n of neighbors(current)) {
    if (n.wall || closedSet.includes(n) || openSet.includes(n)) continue;
    n.parent = current;
    openSet.push(n);
  }

  draw();
}

/* ================= DIJKSTRA ================= */

function startDijkstra() {
  resetAlgo();
  start.g = 0;
  openSet.push(start);
  intervalId = setInterval(stepDijkstra, speedSlider.value);
}

function stepDijkstra() {
  if (!openSet.length) {
    clearInterval(intervalId);
    isRunning = false;
    alert("Yol bulunamadı.");
    return;
  }

  openSet.sort((a, b) => a.g - b.g);
  let current = openSet.shift();
  visitedCount++;

  if (current === goal) {
    finish();
    return;
  }

  closedSet.push(current);

  for (let n of neighbors(current)) {
    if (n.wall || closedSet.includes(n)) continue;

    let g = current.g + 1;
    if (g < n.g) {
      n.g = g;
      n.parent = current;
      if (!openSet.includes(n)) openSet.push(n);
    }
  }

  draw();
}

/* ================= A* ================= */

function startAStar() {
  resetAlgo();
  start.g = 0;
  start.f = heuristic(start, goal);
  openSet.push(start);
  intervalId = setInterval(stepAStar, speedSlider.value);
}

function stepAStar() {
  if (!openSet.length) {
    clearInterval(intervalId);
    isRunning = false;
    alert("Yol bulunamadı.");
    return;
  }

  openSet.sort((a, b) => a.f - b.f);
  let current = openSet.shift();
  visitedCount++;

  if (current === goal) {
    finish();
    return;
  }

  closedSet.push(current);

  for (let n of neighbors(current)) {
    if (n.wall || closedSet.includes(n)) continue;

    let g = current.g + 1;
    if (g < n.g) {
      n.g = g;
      n.f = g + heuristic(n, goal);
      n.parent = current;
      if (!openSet.includes(n)) openSet.push(n);
    }
  }

  draw();
}

/* ================= MOUSE ================= */

let isMouseDown = false;

canvas.addEventListener("mousedown", e => {
  isMouseDown = true;
  handleMouse(e);
});

canvas.addEventListener("mousemove", e => {
  if (isMouseDown) handleMouse(e);
});

window.addEventListener("mouseup", () => {
  isMouseDown = false;
});

function handleMouse(e) {
  let rect = canvas.getBoundingClientRect();
  let x = Math.floor((e.clientX - rect.left) / cellSize);
  let y = Math.floor((e.clientY - rect.top) / cellSize);
  let n = grid[y]?.[x];
  if (!n) return;

  if (isRunning) {
    clearInterval(intervalId);
    isRunning = false;
    resetAlgo();
  }

  if (!start) start = n;
  else if (!goal && n !== start) goal = n;
  else if (n !== start && n !== goal) n.wall = true;

  draw();
}

/* ================= BUTTONS ================= */

startBtn.addEventListener("click", () => {
  if (!start || !goal) {
    alert("Başlangıç ve hedef seçmelisiniz.");
    return;
  }

  if (intervalId) clearInterval(intervalId);
  isRunning = true;

  const algo = algorithmSelect.value;
  if (algo === "bfs") startBFS();
  if (algo === "dijkstra") startDijkstra();
  if (algo === "astar") startAStar();
});

resetBtn.addEventListener("click", () => {
  clearInterval(intervalId);
  isRunning = false;

  start = null;
  goal = null;

  openSet = [];
  closedSet = [];
  visitedCount = 0;
  startTime = 0;

  createGrid();

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  draw();
});
