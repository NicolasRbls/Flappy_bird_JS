/********************************************************
 * FLAPPY BIRD AMÉLIORÉ EN JAVASCRIPT PUR
 * ------------------------------------------------------
 * 1) Canvas plus grand (500 x 700).
 * 2) Oiseau qui tombe moins vite (gravité et saut modérés).
 * 3) Tuyaux moins fréquents et plus espacés au début.
 * 4) Difficulté progressive :
 *    - Le gap entre les tuyaux diminue à mesure que le score augmente.
 *    - La vitesse de défilement augmente progressivement avec le score.
 ********************************************************/

// --- Récupération du canvas et du contexte ---
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// --- Récupération des éléments d'interface ---
const gameOverModal = document.getElementById("gameOverModal");
const finalScoreText = document.getElementById("finalScore");
const restartButton = document.getElementById("restartButton");

// ========================================================
// CONSTANTES ET PARAMÈTRES DE JEU
// ========================================================

// Oiseau
const BIRD_SIZE = 20;      // Carré plus grand
const BIRD_X = 100;        // Position X fixe de l'oiseau
const BASE_GRAVITY = 0.15; // Gravité de base (réduite par rapport à 0.2)
const BASE_JUMP = -5;      // Force de saut légèrement plus grande pour compenser

// Tuyaux
const BASE_PIPE_WIDTH = 50;  // Largeur de chaque tuyau
const BASE_PIPE_GAP = 350;   // Espace vertical initial entre le haut et le bas
const MIN_PIPE_GAP = 100;    // Gap minimum (pour éviter d'être impossible)
const BASE_PIPE_SPEED = 1.2; // Vitesse initiale de défilement

// Apparition des tuyaux
const SPAWN_INTERVAL = 110;  // Intervalle (frames) pour spawner un tuyau

// ========================================================
// VARIABLES D'ÉTAT DU JEU
// ========================================================
let birdY;            // position Y de l'oiseau
let birdVelocity;     // vitesse verticale de l'oiseau
let pipes;            // tableau stockant les tuyaux
let frameCount;       // compteur de frames
let score;            // score du joueur
let gameOver;         // fin de partie ?

// ========================================================
// FONCTIONS PRINCIPALES
// ========================================================

/**
 * Initialise ou réinitialise le jeu.
 */
function initGame() {
  birdY = canvas.height / 2;
  birdVelocity = 0;
  pipes = [];
  frameCount = 0;
  score = 0;
  gameOver = false;
  gameOverModal.style.visibility = "hidden";
}

/**
 * Boucle d'update : appelée à chaque frame avant le dessin.
 */
function update() {
  // Gravité appliquée à l'oiseau
  birdVelocity += BASE_GRAVITY;
  birdY += birdVelocity;

  frameCount++;

  // Génération d'un nouveau tuyau à intervalle régulier
  if (frameCount % SPAWN_INTERVAL === 0) {
    spawnPipe();
  }

  // Mise à jour de chaque tuyau
  for (let pipe of pipes) {
    pipe.x -= getCurrentSpeed();  // Utilise une fonction pour vitesse dynamique

    // Incrémenter le score si on vient de passer le tuyau
    if (!pipe.passed && pipe.x + pipe.width < BIRD_X - BIRD_SIZE / 2) {
      pipe.passed = true;
      score++;
    }
  }

  // Supprimer les tuyaux sortis de l'écran
  pipes = pipes.filter(pipe => pipe.x + pipe.width > 0);

  // Vérifier les collisions
  checkCollisions();
}

/**
 * Boucle de rendu : dessine la scène à chaque frame.
 */
function draw() {
  // Effacer le canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Dessin de l'oiseau (carré jaune)
  ctx.fillStyle = "#FFD700";
  ctx.fillRect(
    BIRD_X - BIRD_SIZE / 2,
    birdY - BIRD_SIZE / 2,
    BIRD_SIZE,
    BIRD_SIZE
  );

  // Dessin des tuyaux (rectangles verts)
  ctx.fillStyle = "#0f9b0f";
  for (let pipe of pipes) {
    // Tuyau du haut
    ctx.fillRect(pipe.x, 0, pipe.width, pipe.topHeight);
    // Tuyau du bas
    const bottomY = pipe.topHeight + pipe.gap;
    const bottomHeight = canvas.height - bottomY;
    ctx.fillRect(pipe.x, bottomY, pipe.width, bottomHeight);
  }

  // Dessin du score
  ctx.fillStyle = "#fff";
  ctx.font = "24px Arial";
  ctx.fillText("Score : " + score, 10, 30);
}

/**
 * Boucle principale de jeu (env. 60 fois/sec).
 */
function gameLoop() {
  if (!gameOver) {
    update();
    draw();
    requestAnimationFrame(gameLoop);
  } else {
    endGame();
  }
}

// ========================================================
// GESTION DES TUYAUX ET DIFFICULTÉ PROGRESSIVE
// ========================================================

/**
 * Génère un tuyau (paire haut+bas) avec un gap dynamique,
 * ajusté à mesure que le score augmente.
 */
function spawnPipe() {
  const pipeGap = getCurrentGap();  // gap dynamique
  const pipeWidth = BASE_PIPE_WIDTH;

  // Calcul d'une hauteur aléatoire pour le tuyau du haut
  let minTopHeight = 50;
  let maxTopHeight = canvas.height - pipeGap - 50;
  let topHeight = Math.floor(
    Math.random() * (maxTopHeight - minTopHeight + 1) + minTopHeight
  );

  pipes.push({
    x: canvas.width,
    width: pipeWidth,
    gap: pipeGap,
    topHeight: topHeight,
    passed: false
  });
}

/**
 * Renvoie l'espace vertical (gap) entre le tuyau du haut et du bas.
 * Plus le score est élevé, plus le gap se réduit, jusqu'à un minimum.
 */
function getCurrentGap() {
  // Exemple : on retire 2 pixels de gap par point de score.
  // gap = BASE_PIPE_GAP - score*2, mais jamais en dessous de MIN_PIPE_GAP.
  const calculatedGap = BASE_PIPE_GAP - (score * 2);
  return Math.max(calculatedGap, MIN_PIPE_GAP);
}

/**
 * Renvoie la vitesse de défilement actuelle.
 * Plus le score est élevé, plus la vitesse augmente.
 */
function getCurrentSpeed() {
  // Exemple : on ajoute 0.02 à la vitesse par point de score
  // => Vitesse initiale 1.2, plus 0.02 * score
  return BASE_PIPE_SPEED + (score * 0.02);
}

// ========================================================
// GESTION DES COLLISIONS
// ========================================================
function checkCollisions() {
  // Collision avec le sol ou le plafond
  if (birdY - BIRD_SIZE / 2 <= 0 || birdY + BIRD_SIZE / 2 >= canvas.height) {
    gameOver = true;
    return;
  }

  // Collision avec un tuyau
  for (let pipe of pipes) {
    const birdLeft   = BIRD_X - BIRD_SIZE / 2;
    const birdRight  = BIRD_X + BIRD_SIZE / 2;
    const birdTop    = birdY - BIRD_SIZE / 2;
    const birdBottom = birdY + BIRD_SIZE / 2;

    // Tuyau du haut
    const pipeTopLeft   = pipe.x;
    const pipeTopRight  = pipe.x + pipe.width;
    const pipeTopBottom = pipe.topHeight;

    // Tuyau du bas
    const pipeBottomTop  = pipe.topHeight + pipe.gap;
    const pipeBottomLeft = pipe.x;
    const pipeBottomRight= pipe.x + pipe.width;

    // Collision avec le tuyau du haut ?
    if (
      birdRight > pipeTopLeft &&
      birdLeft < pipeTopRight &&
      birdTop < pipeTopBottom
    ) {
      gameOver = true;
      return;
    }

    // Collision avec le tuyau du bas ?
    if (
      birdRight > pipeBottomLeft &&
      birdLeft < pipeBottomRight &&
      birdBottom > pipeBottomTop
    ) {
      gameOver = true;
      return;
    }
  }
}

// ========================================================
// FONCTIONS DE FIN DE PARTIE ET SAUT
// ========================================================
function endGame() {
  gameOverModal.style.visibility = "visible";
  finalScoreText.innerText = "Votre score : " + score;
}

/**
 * Saut de l'oiseau.
 */
function jump() {
  birdVelocity = BASE_JUMP; // on applique la force de saut
}

// ========================================================
// GESTION DES ÉVÉNEMENTS
// ========================================================

// Clic sur le canvas => saut
canvas.addEventListener("click", () => {
  if (!gameOver) jump();
});

// Barre Espace => saut
document.addEventListener("keydown", (e) => {
  if (e.code === "Space" && !gameOver) {
    jump();
  }
});

// Bouton "Rejouer"
restartButton.addEventListener("click", () => {
  initGame();
  requestAnimationFrame(gameLoop);
});

// ========================================================
// LANCEMENT DU JEU
// ========================================================
initGame();
requestAnimationFrame(gameLoop);
