let gameLoopId;

class EventEmitter {
  constructor() {
    this.listeners = {};
  }

  on(message, listener) {
    if (!this.listeners[message]) {
      this.listeners[message] = [];
    }
    this.listeners[message].push(listener);
  }

  emit(message, payload = null) {
    if (this.listeners[message]) {
      this.listeners[message].forEach((l) => l(message, payload));
    }
  }

  clear() {
    this.listeners = {};
  }
}

const Messages = {
  KEY_EVENT_UP: "KEY_EVENT_UP",
  KEY_EVENT_DOWN: "KEY_EVENT_DOWN",
  KEY_EVENT_LEFT: "KEY_EVENT_LEFT",
  KEY_EVENT_RIGHT: "KEY_EVENT_RIGHT",

  KEY_EVENT_SPACE: "KEY_EVENT_SPACE",
  COLLISION_ENEMY_LASER: "COLLISION_ENEMY_LASER",
  COLLISION_ENEMY_HERO: "COLLISION_ENEMY_HERO",

  GAME_END_LOSS: "GAME_END_LOSS",
  GAME_END_WIN: "GAME_END_WIN",

  KEY_EVENT_ENTER: "KEY_EVENT_ENTER",
};

let heroImg, //initializing variables
  enemyImg,
  laserImg,
  lifeImg,
  explosionImg,
  boostImg,
  canvas,
  ctx,
  gameObjects = [],
  hero,
  eventEmitter = new EventEmitter();

class GameObject {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.dead = false;
    this.type = "";
    this.width = 0;
    this.height = 0;
    this.img = undefined;
  }

  draw(ctx) {
    ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
  }

  rectFromGameObject() {
    return {
      top: this.y,
      left: this.x,
      bottom: this.y + this.height,
      right: this.x + this.width,
    };
  }
}

class Hero extends GameObject {
  constructor(x, y) {
    super(x, y);
    (this.width = 99), (this.height = 75);
    this.type = "Hero";
    this.speed = { x: 0, y: 0 };
    this.cooldown = 0;
    this.life = 3;
    this.points = 0;
  }
  fire() {
    gameObjects.push(new Laser(this.x + 45, this.y - 10));
    this.cooldown = 300;
    console.log(this.cooldown);

    let id = setInterval(() => {
      if (this.cooldown > 0) {
        this.cooldown -= 100;
        if(this.cooldown === 0) {
          clearInterval(id);
        }
      }
    }, 150);
  }
  canFire() {
    return this.cooldown === 0;
  }
  decrementLife() {
    this.life--;
    if (this.life === 0) {
      this.dead = true;
    }
  }
  incrementPoints() {
    this.points += 100;
  }
  boostExpire() {
    let id = setTimeout(() => { //+1 permanent speed boost remains
      this.speed.x -= 4;
      this.speed.y -= 4;
    }, 2000);
  }
}

class Enemy extends GameObject {
  constructor(x, y) {
    super(x, y);
    (this.width = 98), (this.height = 50);
    this.type = "Enemy";
    let id = setInterval(() => {
      //game induced enemy movement
      if (this.y < canvas.height - this.height) {
        this.y += 5;
      } else {
        console.log("Stopped at", this.y);
        this.dead = true;
        clearInterval(id);
        
        if (isEnemiesDead()) {
          eventEmitter.emit(Messages.GAME_END_WIN);
        }
      }
    }, 175);
  }
}

class Laser extends GameObject {
  constructor(x, y) {
    super(x, y);
    (this.width = 9), (this.height = 33);
    this.type = "Laser";
    this.img = laserImg;
    let id = setInterval(() => {
      if (this.y > 0) {
        this.y -= 20;
      } else {
        this.dead = true;
        clearInterval(id);
      }
    }, 100);
  }
}

class Explosion extends GameObject {
  constructor(x, y) {
    super(x-60, y-40);
    (this.width = 120), (this.height = 100);
    this.type = "Explosion";
    this.img = explosionImg;
    let id = setInterval(() => { //makes explosions expand four times
      if(this.dead === true)
        clearInterval(id);
      this.width += 10;
      this.height += 10;
      this.x -= 5;
      this.y -= 5;
    }, 250);
    let id2 = setTimeout(() => {
      this.dead = true;
    }, 1000);
  }
}

class Boost extends GameObject {
  constructor(x, y) {
    super(x-40, y-40);
    (this.width = 80), (this.height = 80);
    this.type = "Boost";
    this.img = boostImg;
    let id2 = setTimeout(() => { //boost expires after 5 seconds
      this.dead = true;
    }, 5000);
  }
}

function loadTexture(path) {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = path;
    img.onload = () => {
      resolve(img);
    };
  });
}

//prevent default actions of special keys
let onKeyDown = function (e) {
  //console.log("Pressed keycode: " + e.keyCode);
  switch (e.keyCode) {
    case 37:
      eventEmitter.emit(Messages.KEY_EVENT_LEFT);
      e.preventDefault();
      break;
    case 39:
      eventEmitter.emit(Messages.KEY_EVENT_RIGHT);
      e.preventDefault();
      break;
    case 38:
      eventEmitter.emit(Messages.KEY_EVENT_UP);
      e.preventDefault();
      break;
    case 40: // Arrow keys
      eventEmitter.emit(Messages.KEY_EVENT_DOWN);
      e.preventDefault();
      break;
    case 32: // Space
      eventEmitter.emit(Messages.KEY_EVENT_SPACE);
      e.preventDefault();
      break;
    case 13: //Enter
      eventEmitter.emit(Messages.KEY_EVENT_ENTER);
      //e.preventDefault();
      break;
    default:
      break; // do not block other keys
  }
};
window.addEventListener("keydown", onKeyDown);

/*
//listens for keys and sends messages
window.addEventListener("keyup", (evt) => {
  if (evt.key === "ArrowUp") {
    eventEmitter.emit(Messages.KEY_EVENT_UP);
  } else if (evt.key === "ArrowDown") {
    eventEmitter.emit(Messages.KEY_EVENT_DOWN);
  } else if (evt.key === "ArrowLeft") {
    eventEmitter.emit(Messages.KEY_EVENT_LEFT);
  } else if (evt.key === "ArrowRight") {
    eventEmitter.emit(Messages.KEY_EVENT_RIGHT);
  } else if (evt.key === " ") {
    eventEmitter.emit(Messages.KEY_EVENT_SPACE);
  } else if(evt.key === "Enter") {
    eventEmitter.emit(Messages.KEY_EVENT_ENTER);
  }
  
});
*/

function createEnemies() {
  const MONSTER_TOTAL = 7;
  const MONSTER_WIDTH = MONSTER_TOTAL * 98;
  const START_X = (canvas.width - MONSTER_WIDTH) / 2;
  const STOP_X = START_X + MONSTER_WIDTH;
  const spacing = 10;

  for (let x = START_X; x < STOP_X; x += 98 + spacing) {
    for (let y = 0; y < 50 * 5; y += 50 + spacing) {
      const enemy = new Enemy(x, y);
      enemy.img = enemyImg;
      gameObjects.push(enemy);
    }
  }
}

function createHero() {
  hero = new Hero(canvas.width / 2 - 45, canvas.height - canvas.height / 4);
  hero.img = heroImg;
  gameObjects.push(hero);
}

function drawGameObjects(ctx) {
  gameObjects.forEach((go) => go.draw(ctx)); //draws all objects in gameObjects
}

function initGame() {
  gameObjects = []; //stores game objects to be drawn
  createEnemies();
  createHero();

  eventEmitter.on(Messages.KEY_EVENT_UP, () => {
    hero.y -= (10+hero.speed.y);
  });

  eventEmitter.on(Messages.KEY_EVENT_DOWN, () => {
    hero.y += (10+hero.speed.y);
  });

  eventEmitter.on(Messages.KEY_EVENT_LEFT, () => {
    hero.x -= (10+hero.speed.x);
  });

  eventEmitter.on(Messages.KEY_EVENT_RIGHT, () => {
    hero.x += (10+hero.speed.x);
  });

  eventEmitter.on(Messages.KEY_EVENT_SPACE, () => {
    if (hero.canFire()) {
      hero.fire();
    }
  });

  eventEmitter.on(Messages.COLLISION_ENEMY_LASER, (_, { first, second }) => {
    //first is laser, second is enemy
    gameObjects.push(new Explosion(first.x, first.y));
    if(Math.random() < 0.20) {
      gameObjects.push(new Boost(first.x, first.y));
    }
    first.dead = true;
    second.dead = true;
    hero.incrementPoints();

    if (isEnemiesDead()) {
      eventEmitter.emit(Messages.GAME_END_WIN);
    }
  });

  eventEmitter.on(Messages.COLLISION_ENEMY_HERO, (_, { enemy }) => {
    //gameObjects.push(new Explosion(enemy.x, enemy.y));
    enemy.dead = true;
    hero.decrementLife();
    if (isHeroDead())  {
      eventEmitter.emit(Messages.GAME_END_LOSS);
      return; // loss before victory
    }
    if (isEnemiesDead()) {
      eventEmitter.emit(Messages.GAME_END_WIN);
    }
  });

  eventEmitter.on(Messages.COLLISION_BOOST_HERO, (_, { boost }) => {
    boost.dead = true;
    hero.speed.x += 5;
    hero.speed.y += 5;
    hero.boostExpire();
  });
  
  eventEmitter.on(Messages.GAME_END_WIN, () => {
    endGame(true);
  });
  
  eventEmitter.on(Messages.GAME_END_LOSS, () => {
  endGame(false);
  });

  eventEmitter.on(Messages.KEY_EVENT_ENTER, () => {
    resetGame();
  });
}

window.onload = async () => {
  canvas = document.getElementById("canvas");
  ctx = canvas.getContext("2d");
  heroImg = await loadTexture("assets/player.png");
  enemyImg = await loadTexture("assets/enemyShip.png");
  laserImg = await loadTexture("assets/laserRed.png");
  explosionImg = await loadTexture("assets/explosion.png");
  boostImg = await loadTexture("assets/boost.png");
  lifeImg = await loadTexture("assets/life.png");

  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, 1024, 768);
  ctx.drawImage(
    heroImg,
    canvas.width / 2 - 45,
    canvas.height - canvas.height / 4
  );

  createEnemies(ctx, canvas, enemyImg);

  initGame();
  gameLoopId = setInterval(() => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawGameObjects(ctx);

    updateGameObjects();
    drawPoints();
    drawLife();
  }, 33);
};

function intersectRect(r1, r2) {
  return !(
    r2.left > r1.right ||
    r2.right < r1.left ||
    r2.top > r1.bottom ||
    r2.bottom < r1.top
  ); //returns true if anything is intersecting
}

function updateGameObjects() {
  const enemies = gameObjects.filter((go) => go.type === "Enemy");
  const lasers = gameObjects.filter((go) => go.type === "Laser");
  const boosts = gameObjects.filter((go) => go.type === "Boost");
  // enemy collisions
  enemies.forEach(enemy => {
    const heroRect = hero.rectFromGameObject();
    if (intersectRect(heroRect, enemy.rectFromGameObject())) {
      eventEmitter.emit(Messages.COLLISION_ENEMY_HERO, { enemy });
    }
  })
  // laser hit something
  lasers.forEach((l) => {
    enemies.forEach((m) => {
      if (intersectRect(l.rectFromGameObject(), m.rectFromGameObject())) {
        eventEmitter.emit(Messages.COLLISION_ENEMY_LASER, {
          first: l,
          second: m,
        });
      }
    });
    // boost collisions
    boosts.forEach(boost => {
      const heroRect = hero.rectFromGameObject();
      if (intersectRect(heroRect, boost.rectFromGameObject())) {
        eventEmitter.emit(Messages.COLLISION_BOOST_HERO, { boost });
      }
    })
  });

  gameObjects = gameObjects.filter((go) => !go.dead);
}

function drawLife() {
  const START_POS = canvas.width - 180;
  for(let i=0; i < hero.life; i++ ) {
    ctx.drawImage(
      lifeImg, 
      START_POS + (45 * (i+1) ), 
      canvas.height - 37);
  }
}

function drawPoints() {
  ctx.font = "30px Arial";
  ctx.fillStyle = "red";
  ctx.textAlign = "left";
  drawText("Points: " + hero.points, 10, canvas.height-20);
}

function drawText(message, x, y) {
  ctx.fillText(message, x, y);
}

function isHeroDead() {
  return hero.life <= 0;
}

function isEnemiesDead() {
  const enemies = gameObjects.filter((go) => go.type === "Enemy" && !go.dead);
  return enemies.length === 0;
}

function displayMessage(message, color = "red") {
  ctx.font = "30px Arial";
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.fillText(message, canvas.width / 2, canvas.height / 2);
}

function endGame(win) {
  clearInterval(gameLoopId);

  // set a delay so we are sure any paints have finished
  setTimeout(() => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (win) {
      displayMessage(
        "Victory!!! Pew Pew... - Press [Enter] to start a new game Captain Pew Pew",
        "green"
      );
    } else {
      displayMessage(
        "You died !!! Press [Enter] to start a new game Captain Pew Pew"
      );
    }
  }, 200)  
}

function resetGame() {
  if (gameLoopId) {
    clearInterval(gameLoopId);
    eventEmitter.clear();
    initGame();
    gameLoopId = setInterval(() => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      drawPoints();
      drawLife();
      updateGameObjects();
      drawGameObjects(ctx);
    }, 100);
  }
}