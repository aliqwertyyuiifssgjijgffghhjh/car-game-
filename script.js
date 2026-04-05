const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const bestEl = document.getElementById("best");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlayTitle");
const overlayText = document.getElementById("overlayText");
const startBtn = document.getElementById("startBtn");

const LANE_COUNT = 3;
const LANE_WIDTH = canvas.width / LANE_COUNT;
const ROAD_SPEED_START = 3.2;
const PLAYER_Y = canvas.height - 110;

let bestScore = Number(localStorage.getItem("car-game-best") || 0);
bestEl.textContent = String(bestScore);

let gameState = {
  running: false,
  score: 0,
  speed: ROAD_SPEED_START,
  playerLane: 1,
  roadOffset: 0,
  enemies: [],
  spawnCooldown: 0,
  gameOver: false,
};

function laneCenterX(laneIndex) {
  return laneIndex * LANE_WIDTH + LANE_WIDTH / 2;
}

function spawnEnemy() {
  const lane = Math.floor(Math.random() * LANE_COUNT);
  const width = 46;
  const height = 90;
  gameState.enemies.push({
    lane,
    x: laneCenterX(lane) - width / 2,
    y: -height - 20,
    w: width,
    h: height,
  });
}

function resetGame() {
  gameState = {
    running: true,
    score: 0,
    speed: ROAD_SPEED_START,
    playerLane: 1,
    roadOffset: 0,
    enemies: [],
    spawnCooldown: 0,
    gameOver: false,
  };
  scoreEl.textContent = "0";
  hideOverlay();
}

function showOverlay(title, text, buttonText = "Play again") {
  overlayTitle.textContent = title;
  overlayText.textContent = text;
  startBtn.textContent = buttonText;
  overlay.classList.remove("hidden");
}

function hideOverlay() {
  overlay.classList.add("hidden");
}

function drawRoad() {
  ctx.fillStyle = "#202637";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "#4f5975";
  ctx.lineWidth = 3;
  for (let i = 1; i < LANE_COUNT; i += 1) {
    ctx.beginPath();
    ctx.moveTo(i * LANE_WIDTH, 0);
    ctx.lineTo(i * LANE_WIDTH, canvas.height);
    ctx.stroke();
  }

  ctx.strokeStyle = "#f7f7f7";
  ctx.lineWidth = 4;
  const dashH = 38;
  const gap = 28;
  gameState.roadOffset = (gameState.roadOffset + gameState.speed) % (dashH + gap);

  for (let lane = 0; lane < LANE_COUNT; lane += 1) {
    const x = laneCenterX(lane);
    for (let y = -dashH; y < canvas.height + dashH; y += dashH + gap) {
      const drawY = y + gameState.roadOffset;
      ctx.beginPath();
      ctx.moveTo(x, drawY);
      ctx.lineTo(x, drawY + dashH);
      ctx.stroke();
    }
  }
}

function drawCar(x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 12);
  ctx.fill();

  ctx.fillStyle = "#d9ecff";
  ctx.fillRect(x + 8, y + 18, w - 16, 20);

  ctx.fillStyle = "#0f1016";
  ctx.fillRect(x + 7, y + h - 22, 12, 14);
  ctx.fillRect(x + w - 19, y + h - 22, 12, 14);
}

function drawPlayer() {
  const playerW = 48;
  const playerH = 94;
  const x = laneCenterX(gameState.playerLane) - playerW / 2;
  drawCar(x, PLAYER_Y, playerW, playerH, "#41a9ff");

  return { x, y: PLAYER_Y, w: playerW, h: playerH };
}

function collides(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

function updateEnemies(playerBox) {
  gameState.spawnCooldown -= 1;
  if (gameState.spawnCooldown <= 0) {
    spawnEnemy();
    const minCooldown = 38;
    const variance = 32;
    gameState.spawnCooldown =
      minCooldown + Math.floor(Math.random() * variance) - Math.floor(gameState.speed * 2);
  }

  for (let i = gameState.enemies.length - 1; i >= 0; i -= 1) {
    const enemy = gameState.enemies[i];
    enemy.y += gameState.speed + 1.6;
    drawCar(enemy.x, enemy.y, enemy.w, enemy.h, "#ff5f7a");

    if (collides(playerBox, enemy)) {
      endGame();
      return;
    }

    if (enemy.y > canvas.height + 100) {
      gameState.enemies.splice(i, 1);
      gameState.score += 1;
      scoreEl.textContent = String(gameState.score);
      gameState.speed = ROAD_SPEED_START + gameState.score * 0.07;
    }
  }
}

function endGame() {
  gameState.running = false;
  gameState.gameOver = true;

  if (gameState.score > bestScore) {
    bestScore = gameState.score;
    localStorage.setItem("car-game-best", String(bestScore));
    bestEl.textContent = String(bestScore);
  }

  showOverlay(
    "Crash!",
    `You scored ${gameState.score}. Press Space or click to try again.`,
    "Restart"
  );
}

function gameLoop() {
  drawRoad();

  const playerBox = drawPlayer();
  if (gameState.running) {
    updateEnemies(playerBox);
  }

  requestAnimationFrame(gameLoop);
}

function moveLeft() {
  gameState.playerLane = Math.max(0, gameState.playerLane - 1);
}

function moveRight() {
  gameState.playerLane = Math.min(LANE_COUNT - 1, gameState.playerLane + 1);
}

function handleInput(event) {
  const key = event.key.toLowerCase();

  if (["arrowleft", "a"].includes(key)) {
    moveLeft();
    return;
  }

  if (["arrowright", "d"].includes(key)) {
    moveRight();
    return;
  }

  if (key === " " && !gameState.running) {
    resetGame();
  }
}

document.addEventListener("keydown", handleInput);
startBtn.addEventListener("click", resetGame);
canvas.addEventListener("click", () => {
  if (!gameState.running) {
    resetGame();
  }
});

showOverlay("Ready?", "Press Space to start the race.", "Start");
gameLoop();
