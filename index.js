document.addEventListener("DOMContentLoaded", () => {
  init();
});

const fruits = [
  { img: "assets/orange.png", mult: 10 },
  { img: "assets/cherries.png", mult: 6 },
  { img: "assets/seven.png", mult: 37 },
  { img: "assets/watermelon.png", mult: 9 },
  { img: "assets/lemon.png", mult: 10 },
  { img: "assets/eggplant.png", mult: 10 }
];

const paylines = [
  { name: "Top Row",       pattern: [[0, 0], [1, 0], [2, 0]] },
  { name: "Middle Row",    pattern: [[0, 1], [1, 1], [2, 1]] },
  { name: "Bottom Row",    pattern: [[0, 2], [1, 2], [2, 2]] },
  { name: "V-Shape Up",    pattern: [[0, 0], [1, 1], [2, 0]] },
  { name: "V-Shape Down",  pattern: [[0, 2], [1, 1], [2, 2]] }
];

const uiImages = {
  blueFrame: "assets/blue_frame.png",
  reelFrame: "assets/reel_frame.png",
  statsBar: "assets/stats_bar.png",
  spinButton: "assets/spin_button.png"
};

const REEL_COUNT = 3;
const ROW_COUNT = 3;
const SYMBOL_GAP = 8;
const SYMBOL_SIZE = 85;
const STRIP_PADDING = 12;
const REELS_PADDING = 20;

const GAME_WIDTH = 480;
const GAME_HEIGHT = 746;
const GAME_PADDING_X = 30;

const TITLE_Y = 40;
const REELS_Y = 90;
const REELS_HEIGHT = 340;

const STATS_Y = 450;
const STATS_HEIGHT = 90;

const BET_ROW_Y = 560;
const BET_BUTTON_SIZE = 32;

const MESSAGE_Y = 602;

const SPIN_BUTTON_Y = 636;
const SPIN_BUTTON_WIDTH = 220;
const SPIN_BUTTON_HEIGHT = 70;

const colWidth = 121;
const rowHeight = 100;

let balance = 1000, bet = 10, isSpinning = false;
let state = [[], [], []];

const rand = () => fruits[Math.floor(Math.random() * fruits.length)];

let app, gameContainer;
let reelsContainer, reelsGroup;
let symbolSprites = [];
let winHighlights, paylineGraphics;
let reelStrips = [];
let winnerBannerText;
let balanceText, winText, betText;
let messageText;
let spinButtonSprite;
let betMinusButton, betPlusButton;

let particleContainer;
let activeParticles = [];
let flowerTextures = [];

async function init() {
  setupApp();
  await loadAssets();
  buildScene();
  createInitialReels();
  setupReelStrips();
}

function setupApp() {
  app = new PIXI.Application({
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: 0x000000,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
    resizeTo: window
  });

  document.body.appendChild(app.view);

  app.ticker.add(updateParticles);
  app.ticker.add(updateTweening);

  window.addEventListener('resize', centerGameContainer);
}

async function loadAssets() {
  const urls = [
    ...fruits.map(item => item.img),
    uiImages.blueFrame,
    uiImages.reelFrame,
    uiImages.statsBar,
    uiImages.spinButton
  ];
  await PIXI.Assets.load(urls);
}

function buildScene() {
  gameContainer = new PIXI.Container();
  gameContainer.name = 'gameContainer';
  app.stage.addChild(gameContainer);

  addBackground();
  addTitle();
  addReelFrame();
  addReelsContainer();
  addWinnerBanner();
  addStatsBar();
  addBetButtons();
  addMessageText();
  addSpinButton();

  particleContainer = new PIXI.Container();
  particleContainer.name = 'particleContainer';
  app.stage.addChild(particleContainer);

  const flowers = ['🌸', '🌺', '🌻', '🌹', '🌼', '🌷', '✨'];
  flowerTextures = flowers.map(createPixiFlowerTexture);

  centerGameContainer();
}

function centerGameContainer() {
  const scale = Math.min(1, window.innerWidth / GAME_WIDTH, window.innerHeight / GAME_HEIGHT);
  gameContainer.scale.set(scale);
  gameContainer.x = (window.innerWidth - GAME_WIDTH * scale) / 2;
  gameContainer.y = (window.innerHeight - GAME_HEIGHT * scale) / 2;
}

function addBackground() {
  const background = new PIXI.Sprite(PIXI.Texture.from(uiImages.blueFrame));
  background.name = 'background';
  background.width = GAME_WIDTH;
  background.height = GAME_HEIGHT;
  gameContainer.addChild(background);
}

function addTitle() {
  const title = new PIXI.Text('🍊 FRUIT SLOT 🍉', {
    fontFamily: 'Arial', fontSize: 28, fontWeight: 'bold', fill: '#ffffff'
  });
  title.name = 'title';
  title.anchor.set(0.5, 0);
  title.x = GAME_WIDTH / 2;
  title.y = TITLE_Y;
  gameContainer.addChild(title);
}

function addReelFrame() {
  const frame = new PIXI.Sprite(PIXI.Texture.from(uiImages.reelFrame));
  frame.name = 'reelFrame';
  frame.x = GAME_PADDING_X;
  frame.y = REELS_Y;
  frame.width = GAME_WIDTH - GAME_PADDING_X * 2;
  frame.height = REELS_HEIGHT;
  gameContainer.addChild(frame);
}

function addReelsContainer() {
  reelsContainer = new PIXI.Container();
  reelsContainer.name = 'reelsContainer';
  reelsContainer.x = GAME_PADDING_X + REELS_PADDING;
  reelsContainer.y = REELS_Y + REELS_PADDING;
  gameContainer.addChild(reelsContainer);

  winHighlights = new PIXI.Graphics();
  winHighlights.name = 'winHighlights';
  reelsContainer.addChild(winHighlights);

  reelsGroup = new PIXI.Container();
  reelsGroup.name = 'reelsGroup';
  reelsContainer.addChild(reelsGroup);

  paylineGraphics = new PIXI.Graphics();
  paylineGraphics.name = 'paylineGraphics';
  reelsContainer.addChild(paylineGraphics);
}

function addWinnerBanner() {
  winnerBannerText = new PIXI.Text('', {
    fontFamily: 'Arial', fontSize: 26, fontWeight: '900', fill: '#fff200',
    stroke: '#ff0000', strokeThickness: 4, align: 'center'
  });
  winnerBannerText.name = 'winnerBanner';
  winnerBannerText.anchor.set(0.5);
  winnerBannerText.x = GAME_WIDTH / 2;
  winnerBannerText.y = REELS_Y + REELS_HEIGHT / 2;
  winnerBannerText.visible = false;
  gameContainer.addChild(winnerBannerText);
}

function addStatsBar() {
  const background = new PIXI.Sprite(PIXI.Texture.from(uiImages.statsBar));
  background.name = 'statsBar';
  background.x = GAME_PADDING_X;
  background.y = STATS_Y;
  background.width = GAME_WIDTH - GAME_PADDING_X * 2;
  background.height = STATS_HEIGHT;
  gameContainer.addChild(background);

  const centerY = STATS_Y + STATS_HEIGHT / 2;
  const columnWidth = (GAME_WIDTH - GAME_PADDING_X * 2) / 3;

  balanceText = addStatColumn('BALANCE', '$' + balance, GAME_PADDING_X + columnWidth * 0.5, centerY, '#ffffff');
  winText = addStatColumn('WIN', '$0', GAME_PADDING_X + columnWidth * 1.5, centerY, '#30df88');
  betText = addStatColumn('BET', '$' + bet, GAME_PADDING_X + columnWidth * 2.5, centerY, '#ffffff');
}

function addStatColumn(label, value, x, y, valueColor) {
  const labelText = new PIXI.Text(label, {
    fontFamily: 'Arial', fontSize: 13, fontWeight: 'bold', fill: '#ffffff'
  });
  labelText.anchor.set(0.5, 1);
  labelText.x = x;
  labelText.y = y - 2;
  gameContainer.addChild(labelText);

  const valueText = new PIXI.Text(value, {
    fontFamily: 'Arial', fontSize: 16, fontWeight: 'bold', fill: valueColor
  });
  valueText.anchor.set(0.5, 0);
  valueText.x = x;
  valueText.y = y + 4;
  gameContainer.addChild(valueText);

  return valueText;
}

function addBetButtons() {
  const centerX = GAME_WIDTH / 2;
  const y = BET_ROW_Y + BET_BUTTON_SIZE / 2;

  betMinusButton = createBetButton('−', centerX - 60, y, () => changeBet(-5));
  betPlusButton = createBetButton('+', centerX + 60, y, () => changeBet(5));

  const label = new PIXI.Text('BET', {
    fontFamily: 'Arial', fontSize: 14, fontWeight: 'bold', fill: '#ffffff'
  });
  label.anchor.set(0.5);
  label.x = centerX;
  label.y = y;
  gameContainer.addChild(label);
}

function createBetButton(label, x, y, onClick) {
  const button = new PIXI.Container();
  button.name = `betButton-${label}`;
  button.x = x;
  button.y = y;

  const background = new PIXI.Graphics();
  background.beginFill(0xf3f38e);
  background.lineStyle(2, 0xff0000);
  background.drawRoundedRect(-BET_BUTTON_SIZE / 2, -BET_BUTTON_SIZE / 2, BET_BUTTON_SIZE, BET_BUTTON_SIZE, 5);
  background.endFill();
  button.addChild(background);

  const text = new PIXI.Text(label, {
    fontFamily: 'Arial', fontSize: 18, fontWeight: 'bold', fill: '#ff0000'
  });
  text.anchor.set(0.5);
  button.addChild(text);

  button.eventMode = 'static';
  button.cursor = 'pointer';
  button.on('pointertap', onClick);

  gameContainer.addChild(button);
  return button;
}

function addMessageText() {
  messageText = new PIXI.Text('SET BET & SPIN!', {
    fontFamily: 'Arial', fontSize: 14, fontWeight: 'bold', fill: '#ffd52f'
  });
  messageText.name = 'message';
  messageText.anchor.set(0.5, 0);
  messageText.x = GAME_WIDTH / 2;
  messageText.y = MESSAGE_Y;
  gameContainer.addChild(messageText);
}

function addSpinButton() {
  spinButtonSprite = new PIXI.Sprite(PIXI.Texture.from(uiImages.spinButton));
  spinButtonSprite.name = 'spinButton';
  spinButtonSprite.x = GAME_WIDTH / 2 - SPIN_BUTTON_WIDTH / 2;
  spinButtonSprite.y = SPIN_BUTTON_Y;
  spinButtonSprite.width = SPIN_BUTTON_WIDTH;
  spinButtonSprite.height = SPIN_BUTTON_HEIGHT;
  spinButtonSprite.eventMode = 'static';
  spinButtonSprite.cursor = 'pointer';
  spinButtonSprite.on('pointertap', spin);
  gameContainer.addChild(spinButtonSprite);
}

function setSpinButtonEnabled(enabled) {
  spinButtonSprite.eventMode = enabled ? 'static' : 'none';
  spinButtonSprite.cursor = enabled ? 'pointer' : 'default';
  spinButtonSprite.alpha = enabled ? 1 : 0.5;
}

function fitSpriteToBox(sprite, boxSize) {
  const scale = Math.min(boxSize / sprite.texture.width, boxSize / sprite.texture.height);
  sprite.baseScale = scale;
  sprite.scale.set(scale);
}

function setSymbolTexture(sprite, fruit) {
  sprite.texture = PIXI.Texture.from(fruit.img);
  fitSpriteToBox(sprite, SYMBOL_SIZE);
}

function createInitialReels() {
  symbolSprites = [];
  for (let reelIndex = 0; reelIndex < REEL_COUNT; reelIndex++) {
    state[reelIndex] = [rand(), rand(), rand()];
    symbolSprites[reelIndex] = [];

    for (let rowIndex = 0; rowIndex < ROW_COUNT; rowIndex++) {
      const sprite = new PIXI.Sprite();
      sprite.name = `symbol-${reelIndex}-${rowIndex}`;
      sprite.anchor.set(0.5);
      sprite.x = reelIndex * (colWidth + SYMBOL_GAP) + colWidth / 2;
      sprite.y = rowIndex * rowHeight + rowHeight / 2;
      setSymbolTexture(sprite, state[reelIndex][rowIndex]);

      reelsGroup.addChild(sprite);
      symbolSprites[reelIndex][rowIndex] = sprite;
    }
  }
}

function clearWinAnimations() {
  winHighlights.clear();
  paylineGraphics.clear();
  symbolSprites.flat().forEach(sprite => sprite.scale.set(sprite.baseScale));
  hideWinnerBanner();
}

function setupReelStrips() {
  reelStrips = [];
  for (let reelIndex = 0; reelIndex < REEL_COUNT; reelIndex++) {
    const mask = new PIXI.Graphics();
    mask.name = `reelMask-${reelIndex}`;
    mask.beginFill(0xffffff);
    mask.drawRect(reelIndex * (colWidth + SYMBOL_GAP), 0, colWidth, rowHeight * ROW_COUNT);
    mask.endFill();
    reelsGroup.addChild(mask);

    const container = new PIXI.Container();
    container.name = `reelStrip-${reelIndex}`;
    container.x = reelIndex * (colWidth + SYMBOL_GAP);
    container.mask = mask;
    container.visible = false;
    reelsGroup.addChild(container);

    const blur = new PIXI.filters.BlurFilter();
    blur.blurX = 0;
    blur.blurY = 0;
    container.filters = [blur];

    reelStrips[reelIndex] = { container, blur, previousY: 0 };
  }
}

function buildReelStrip(oldOutcome, finalOutcome) {
  const padding = [];
  for (let i = 0; i < STRIP_PADDING; i++) padding.push(rand());
  return [...finalOutcome, ...padding, ...oldOutcome];
}

function showReelStrip(reelIndex, strip) {
  const reel = reelStrips[reelIndex];

  reel.container.removeChildren();
  reel.container.y = -(strip.length - ROW_COUNT) * rowHeight;

  strip.forEach((fruit, index) => {
    const sprite = new PIXI.Sprite();
    sprite.name = `stripSymbol-${reelIndex}-${index}`;
    sprite.anchor.set(0.5);
    sprite.x = colWidth / 2;
    sprite.y = index * rowHeight + rowHeight / 2;
    setSymbolTexture(sprite, fruit);
    reel.container.addChild(sprite);
  });

  reel.container.visible = true;

  for (let rowIndex = 0; rowIndex < ROW_COUNT; rowIndex++) {
    symbolSprites[reelIndex][rowIndex].visible = false;
  }
}

function hideReelStrip(reelIndex) {
  const reel = reelStrips[reelIndex];
  reel.blur.blurY = 0;
  reel.container.visible = false;
  reel.container.removeChildren();

  for (let rowIndex = 0; rowIndex < ROW_COUNT; rowIndex++) {
    symbolSprites[reelIndex][rowIndex].visible = true;
  }
}

function updateReelBlur(reel) {
  const currentY = reel.container.y;
  reel.blur.blurY = Math.min(20, Math.abs(currentY - reel.previousY) * 0.5);
  reel.previousY = currentY;
}

function stopReel(reelIndex) {
  return new Promise((resolve) => {
    const finalOutcome = [rand(), rand(), rand()];
    const strip = buildReelStrip(state[reelIndex], finalOutcome);
    const reel = reelStrips[reelIndex];

    showReelStrip(reelIndex, strip);
    reel.previousY = reel.container.y;

    const targetY = 0;
    const duration = 1000 + reelIndex * 300;

    tweenTo(reel.container, 'y', targetY, duration, backout(0.5), () => updateReelBlur(reel), () => {
      state[reelIndex] = finalOutcome;

      for (let rowIndex = 0; rowIndex < ROW_COUNT; rowIndex++) {
        setSymbolTexture(symbolSprites[reelIndex][rowIndex], finalOutcome[rowIndex]);
      }

      hideReelStrip(reelIndex);
      resolve();
    });
  });
}

async function spin() {
  if (isSpinning) return;
  if (balance < bet) return showMessage('NOT ENOUGH BALANCE');

  clearWinAnimations();
  isSpinning = true;
  setSpinButtonEnabled(false);
  balance -= bet;
  updateStatsDisplay();
  winText.text = '$0';
  showMessage('SPINNING...');

  await Promise.all([stopReel(0), stopReel(1), stopReel(2)]);

  setTimeout(() => {
    checkWin();
  }, 100);
}

function checkWin() {
  let basePrize = 0;
  let winningPatterns = [];

  paylines.forEach(line => {
    const p = line.pattern;

    const sym0 = state[p[0][0]] ? state[p[0][0]][p[0][1]] : null;
    const sym1 = state[p[1][0]] ? state[p[1][0]][p[1][1]] : null;
    const sym2 = state[p[2][0]] ? state[p[2][0]][p[2][1]] : null;

    if (!sym0 || !sym1 || !sym2) return;

    const img0 = (sym0.img || "").toLowerCase().trim();
    const img1 = (sym1.img || "").toLowerCase().trim();
    const img2 = (sym2.img || "").toLowerCase().trim();

    if (img0 !== "" && img0 === img1 && img1 === img2) {
      const mult = Number(sym0.mult) || 10;
      basePrize += bet * mult;
      winningPatterns.push(line);
    }
  });

  const matchCount = winningPatterns.length;
  let comboMultiplier = 1.0;

  if (matchCount === 2) comboMultiplier = 1.5;
  else if (matchCount === 3) comboMultiplier = 2.0;
  else if (matchCount >= 4) comboMultiplier = 2.5;

  const finalPrize = Math.floor(basePrize * comboMultiplier);

  balance += finalPrize;
  winText.text = '$' + finalPrize;
  updateStatsDisplay();

  if (finalPrize > 0) {
    const msgText = matchCount > 1
      ? `🔥 ${matchCount} MATCH COMBO! (${comboMultiplier}x) 🔥`
      : "🏆 WINNER! 🏆";

    showMessage(msgText);
    triggerWinEffects(winningPatterns, finalPrize, comboMultiplier, matchCount);
  } else {
    showMessage('TRY AGAIN!');
    isSpinning = false;
    setSpinButtonEnabled(true);
  }
}

function triggerWinEffects(winningPatterns, prize, comboMultiplier, matchCount) {
  showWinnerBanner(matchCount, prize, comboMultiplier);

  winHighlights.clear();
  paylineGraphics.clear();

  winningPatterns.forEach(line => {
    const points = [];

    line.pattern.forEach(([col, row]) => {
      const sprite = symbolSprites[col] && symbolSprites[col][row];
      if (!sprite) return;

      sprite.scale.set(sprite.baseScale * 1.15);

      winHighlights.lineStyle(3, 0xffd700, 1);
      winHighlights.beginFill(0xffd700, 0.25);
      winHighlights.drawRoundedRect(
        sprite.x - colWidth / 2 + 4,
        sprite.y - rowHeight / 2 + 4,
        colWidth - 8,
        rowHeight - 8,
        8
      );
      winHighlights.endFill();

      points.push(sprite.x, sprite.y);
    });

    if (points.length === 6) {
      paylineGraphics.lineStyle(6, 0xffd700, 1);
      paylineGraphics.moveTo(points[0], points[1]);
      paylineGraphics.lineTo(points[2], points[3]);
      paylineGraphics.lineTo(points[4], points[5]);
    }
  });

  triggerPixiFlowerBurst();

  setTimeout(() => {
    isSpinning = false;
    setSpinButtonEnabled(true);
  }, 1200);
}

function showWinnerBanner(matchCount, prize, comboMultiplier) {
  winnerBannerText.text = matchCount > 1
    ? `${matchCount} MATCHES!\n$${prize}\n(${comboMultiplier}x BONUS)`
    : `WIN\n$${prize}`;
  winnerBannerText.visible = true;
}

function hideWinnerBanner() {
  winnerBannerText.visible = false;
}

function showMessage(text) {
  messageText.text = text;
}

function updateStatsDisplay() {
  balanceText.text = '$' + balance;
  betText.text = '$' + bet;
}

function changeBet(n) {
  if (isSpinning) return;
  bet = Math.max(5, Math.min(100, bet + n));
  updateStatsDisplay();
}

function createPixiFlowerTexture(emoji) {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.font = '48px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(emoji, 32, 32);
  return PIXI.Texture.from(canvas);
}

function updateParticles(delta) {
  for (let i = activeParticles.length - 1; i >= 0; i--) {
    const p = activeParticles[i];
    p.x += p.vx * delta;
    p.y += p.vy * delta;
    p.vy += p.gravity * delta;
    p.rotation += p.rotationSpeed * delta;
    p.alpha -= p.decay * delta;
    p.scale.x = Math.max(0, p.scale.x - 0.005 * delta);
    p.scale.y = p.scale.x;

    if (p.alpha <= 0) {
      particleContainer.removeChild(p);
      activeParticles.splice(i, 1);
    }
  }
}

function triggerPixiFlowerBurst() {
  const center = gameContainer.toGlobal({ x: GAME_WIDTH / 2, y: GAME_HEIGHT / 2 });

  for (let i = 0; i < 45; i++) {
    const texture = flowerTextures[Math.floor(Math.random() * flowerTextures.length)];
    const p = new PIXI.Sprite(texture);
    p.name = 'flowerParticle';
    p.anchor.set(0.5);
    p.x = center.x;
    p.y = center.y;

    const angle = Math.random() * Math.PI * 2;
    const speed = 4 + Math.random() * 8;
    p.vx = Math.cos(angle) * speed;
    p.vy = Math.sin(angle) * speed - 2;
    p.gravity = 0.15;
    p.rotationSpeed = (Math.random() - 0.5) * 0.1;
    p.decay = 0.012 + Math.random() * 0.008;

    particleContainer.addChild(p);
    activeParticles.push(p);
  }
}

const tweening = [];

function tweenTo(object, property, target, time, easing, onchange, oncomplete) {
  const tween = {
    object,
    property,
    propertyBeginValue: object[property],
    target,
    easing,
    time,
    change: onchange,
    complete: oncomplete,
    start: Date.now()
  };

  tweening.push(tween);
  return tween;
}

function updateTweening() {
  const now = Date.now();
  const remove = [];

  for (let i = 0; i < tweening.length; i++) {
    const t = tweening[i];
    const phase = Math.min(1, (now - t.start) / t.time);

    t.object[t.property] = lerp(t.propertyBeginValue, t.target, t.easing(phase));
    if (t.change) t.change(t);
    if (phase === 1) {
      t.object[t.property] = t.target;
      if (t.complete) t.complete(t);
      remove.push(t);
    }
  }

  for (let i = 0; i < remove.length; i++) {
    tweening.splice(tweening.indexOf(remove[i]), 1);
  }
}

function lerp(a, b, t) {
  return a * (1 - t) + b * t;
}

function backout(amount) {
  return (t) => --t * t * ((amount + 1) * t + amount) + 1;
}
