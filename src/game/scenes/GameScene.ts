import Phaser from 'phaser';
import { SeededRandom, RunState } from '../../data/types';
import { getWeapon, getWeaponStats, WEAPONS, isEvolution } from '../../data/weapons';
import { ELITE_MODIFIERS, BOSSES, getEnemy, getSpawnableEnemies, getBossForTime } from '../../data/enemies';
import { getCharacter, UPGRADES, getUpgrade, GAME_EVENTS, ACHIEVEMENTS } from '../../data/upgrades';
import { PERMANENT_UPGRADES } from '../../data/meta';
import { saveService } from '../../services/SaveService';
import { audioService } from '../../services/AudioService';
import { xpToNextLevel, applyArmor, critMultiplier, calculateClout } from '../balance/formulas';
import { newlyMetAchievements } from '../balance/achievements';

// Constants
const TILE_SIZE = 64;
const MAP_WIDTH = 40;
const MAP_HEIGHT = 30;
const WORLD_WIDTH = MAP_WIDTH * TILE_SIZE;
const WORLD_HEIGHT = MAP_HEIGHT * TILE_SIZE;
const GAME_DURATION_MINUTES = 240; // 4 hours in-game (2AM to 6AM)
const REAL_DURATION_SECONDS = 18 * 60; // 18 real minutes
const TIME_SCALE = GAME_DURATION_MINUTES / REAL_DURATION_SECONDS; // in-game minutes per real second

interface EnemySprite extends Phaser.Physics.Arcade.Sprite {
  enemyId: string;
  health: number;
  maxHealth: number;
  damage: number;
  speed: number;
  xpValue: number;
  behavior: string;
  isElite: boolean;
  eliteModifier?: string;
  isBoss: boolean;
  bossPhase?: number;
  attackCooldown: number;
  lastAttack: number;
  behaviorTimer: number;
  targetX?: number;
  targetY?: number;
}

interface ProjectileSprite extends Phaser.Physics.Arcade.Sprite {
  weaponId: string;
  damage: number;
  piercing: number;
  hitTargets: Set<EnemySprite>;
  speed: number;
  lifetime: number;
}

interface OrbitalSprite extends Phaser.Physics.Arcade.Sprite {
  weaponId: string;
  damage: number;
  angle: number;
  orbitRadius: number;
  orbitSpeed: number;
  lastHitTime: Map<EnemySprite, number>;
}

interface AllySprite extends Phaser.Physics.Arcade.Sprite {
  damage: number;
  expiresAt: number;
  target?: EnemySprite;
  attackCooldown: number;
  lastAttack: number;
}

interface PickupSprite extends Phaser.Physics.Arcade.Sprite {
  pickupType: 'xp' | 'health';
  value: number;
}

export class GameScene extends Phaser.Scene {
  // Core state
  private runState!: RunState;
  private rng!: SeededRandom;
  private settings = saveService.getSettings();
  
  // Player
  private player!: Phaser.Physics.Arcade.Sprite;
  private playerSpeed = 200;
  private playerBaseSpeed = 200;
  private invulnerable = false;
  private invulnerableUntil = 0;
  private facingAngle = 0;
  
  // Input
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };
  private joystickInput = { x: 0, y: 0 };
  
  // Groups
  private enemies!: Phaser.Physics.Arcade.Group;
  private projectiles!: Phaser.Physics.Arcade.Group;
  private orbitals!: Phaser.GameObjects.Group;
  private allies!: Phaser.Physics.Arcade.Group;
  private pickups!: Phaser.Physics.Arcade.Group;
  
  // Weapon cooldowns
  private weaponCooldowns: Map<string, number> = new Map();
  
  // Map
  private mapLayer!: Phaser.GameObjects.TileSprite;
  private obstacles!: Phaser.Physics.Arcade.StaticGroup;
  
  // Stats tracking
  private lastSpawnTime = 0;
  private spawnInterval = 2000;
  private eliteChance = 0.05;
  private eventTimer = 0;
  private activeEvent: string | null = null;
  private eventEndTime = 0;
  private bossActive = false;
  private currentBoss: EnemySprite | null = null;
  
  // Camera
  private shakeIntensity = 0;
  
  // Run modifiers
  private pendingLevels = 0;
  private damageNumberCount = 0;
  private runXp = 0;
  private reachedMaxWeapon = false;
  private flawlessBoss = false;
  private tookDamageThisBoss = false;
  private eventMods = {
    xp: 1,
    spawnRate: 1,
    enemySpeed: 1,
    playerSpeed: 1,
    healthDrop: 0.05,
  };
  private darkness: Phaser.GameObjects.Rectangle | null = null;
  
  // Debug
  private debugMode = false;
  private runEnded = false;
  
  constructor() {
    super({ key: 'GameScene' });
  }
  
  init(data: { characterId: string }): void {
    const seed = Date.now();
    this.rng = new SeededRandom(seed);
    
    const character = getCharacter(data.characterId) || getCharacter('promoter')!;
    
    // Initialize run state
    this.runState = {
      seed,
      characterId: data.characterId,
      gameTime: 0,
      inGameTime: 0,
      level: 1,
      xp: 0,
      xpToLevel: 10,
      health: 100,
      maxHealth: 100,
      weapons: new Map([[character.startingWeapon, 1]]),
      passives: new Map(),
      kills: 0,
      damageDealt: 0,
      elitesDefeated: 0,
      bossesDefeated: 0,
      hype: 0,
      isPaused: false,
      isLevelingUp: false,
    };
    
    // Apply character bonuses
    for (const bonus of character.bonuses) {
      if (bonus.stat === 'maxHealth') {
        this.runState.maxHealth += bonus.value;
        this.runState.health = this.runState.maxHealth;
      }
    }

    const stamina = saveService.getPermanentUpgradeLevel('stamina');
    this.runState.maxHealth += 8 * stamina;
    this.runState.health = this.runState.maxHealth;
    
    this.settings = saveService.getSettings();
  }
  
  create(): void {
    // Create map
    this.createMap();
    
    // Create player
    this.createPlayer();
    
    // Create groups
    this.enemies = this.physics.add.group({ runChildUpdate: true });
    this.projectiles = this.physics.add.group({ runChildUpdate: true });
    this.orbitals = this.add.group();
    this.allies = this.physics.add.group({ runChildUpdate: true });
    this.pickups = this.physics.add.group({ runChildUpdate: true });
    
    // Setup collisions
    this.setupCollisions();
    
    // Setup input
    this.setupInput();
    
    // Setup camera
    this.setupCamera();
    
    // Create initial orbitals
    this.updateOrbitals();
    
    // Setup debug
    this.setupDebug();
    
    // A few guests are already on the floor
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const dist = 260 + (i % 3) * 40;
      const x = Phaser.Math.Clamp(this.player.x + Math.cos(angle) * dist, 80, WORLD_WIDTH - 80);
      const y = Phaser.Math.Clamp(this.player.y + Math.sin(angle) * dist, 80, WORLD_HEIGHT - 80);
      this.createEnemy('party-crasher', x, y, false);
    }
    
    // Emit initial state
    this.emitState();
    
    // Start stats tracking
    saveService.addToStats('totalRuns', 1);
  }
  
  private createMap(): void {
    // Set world bounds
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    
    // Create base floor
    this.mapLayer = this.add.tileSprite(0, 0, WORLD_WIDTH, WORLD_HEIGHT, 'tile-floor');
    this.mapLayer.setOrigin(0, 0);
    
    // Create dance floor in center
    const danceFloor = this.add.image(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, 'dance-floor');
    danceFloor.setDepth(1);
    
    // Create VIP area
    const vipArea = this.add.tileSprite(
      WORLD_WIDTH - 400,
      100,
      350, 300,
      'tile-vip'
    );
    vipArea.setOrigin(0, 0);
    
    // Obstacles
    this.obstacles = this.physics.add.staticGroup();
    
    // Bar counter
    this.createObstacle(150, WORLD_HEIGHT / 2, 'bar-counter', 256, 40);
    
    // DJ booth
    this.createObstacle(WORLD_WIDTH / 2, 80, 'dj-booth', 160, 80);
    
    // Tables scattered around
    const tablePositions = [
      [300, 400], [500, 600], [700, 300],
      [WORLD_WIDTH - 300, 500], [WORLD_WIDTH - 500, 700],
    ];
    for (const [x, y] of tablePositions) {
      this.createObstacle(x, y, 'table', 48, 48);
    }
    
    // Speakers
    this.createObstacle(100, 100, 'speaker', 32, 48);
    this.createObstacle(WORLD_WIDTH - 100, 100, 'speaker', 32, 48);
    
    // Walls (boundaries)
    this.createWalls();
    
    // Decorative neon signs
    this.createNeonSigns();
    
    // Colored lighting
    this.createLighting();
  }
  
  private createObstacle(x: number, y: number, texture: string, width: number, height: number): void {
    const obstacle = this.obstacles.create(x, y, texture) as Phaser.Physics.Arcade.Sprite;
    obstacle.setSize(width * 0.8, height * 0.8);
    obstacle.setDepth(4);
    obstacle.refreshBody();
  }
  
  private createWalls(): void {
    // Top wall
    const topWall = this.obstacles.create(WORLD_WIDTH / 2, 16, 'tile-wall');
    topWall.setDisplaySize(WORLD_WIDTH, 32);
    topWall.refreshBody();
    
    // Bottom wall
    const bottomWall = this.obstacles.create(WORLD_WIDTH / 2, WORLD_HEIGHT - 16, 'tile-wall');
    bottomWall.setDisplaySize(WORLD_WIDTH, 32);
    bottomWall.refreshBody();
    
    // Left wall
    const leftWall = this.obstacles.create(16, WORLD_HEIGHT / 2, 'tile-wall');
    leftWall.setDisplaySize(32, WORLD_HEIGHT);
    leftWall.refreshBody();
    
    // Right wall
    const rightWall = this.obstacles.create(WORLD_WIDTH - 16, WORLD_HEIGHT / 2, 'tile-wall');
    rightWall.setDisplaySize(32, WORLD_HEIGHT);
    rightWall.refreshBody();
  }
  
  private createNeonSigns(): void {
    const neonPositions = [
      { x: 250, y: 50, text: 'BAR', color: 0xff00ff },
      { x: WORLD_WIDTH - 250, y: 50, text: 'VIP', color: 0xffdd00 },
      { x: WORLD_WIDTH / 2, y: 150, text: 'DANCE', color: 0x00ffff },
    ];
    
    for (const pos of neonPositions) {
      const text = this.add.text(pos.x, pos.y, pos.text, {
        fontSize: '24px',
        fontFamily: 'Arial Black',
        color: '#' + pos.color.toString(16).padStart(6, '0'),
      });
      text.setOrigin(0.5);
      
      // Glow effect
      this.tweens.add({
        targets: text,
        alpha: { from: 0.7, to: 1 },
        duration: 1000 + this.rng.nextInt(0, 500),
        yoyo: true,
        repeat: -1,
      });
    }
  }
  
  private createLighting(): void {
    // Colored light spots
    const lightColors = [0xff00ff, 0x00ffff, 0xffff00, 0xff0066];
    const lightPositions = [
      [WORLD_WIDTH / 2 - 200, WORLD_HEIGHT / 2 - 200],
      [WORLD_WIDTH / 2 + 200, WORLD_HEIGHT / 2 - 200],
      [WORLD_WIDTH / 2 - 200, WORLD_HEIGHT / 2 + 200],
      [WORLD_WIDTH / 2 + 200, WORLD_HEIGHT / 2 + 200],
    ];
    
    for (let i = 0; i < lightPositions.length; i++) {
      const [x, y] = lightPositions[i];
      const light = this.add.circle(x, y, 100, lightColors[i], 0.1);
      
      this.tweens.add({
        targets: light,
        alpha: { from: 0.05, to: 0.15 },
        scale: { from: 0.9, to: 1.1 },
        duration: 2000 + i * 300,
        yoyo: true,
        repeat: -1,
      });
    }
  }
  
  private createPlayer(): void {
    this.player = this.physics.add.sprite(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, 'player');
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(10);
    this.player.setDrag(0);
    
    // Player trail effect
    this.time.addEvent({
      delay: 50,
      callback: () => this.createPlayerTrail(),
      loop: true,
    });
  }
  
  private createPlayerTrail(): void {
    if (!this.player.body || this.runState.isPaused) return;
    const vel = this.player.body.velocity;
    if (Math.abs(vel.x) < 50 && Math.abs(vel.y) < 50) return;
    
    const trail = this.add.circle(this.player.x, this.player.y, 8, 0x00ffff, 0.3);
    trail.setDepth(5);
    
    this.tweens.add({
      targets: trail,
      alpha: 0,
      scale: 0.5,
      duration: 200,
      onComplete: () => trail.destroy(),
    });
  }
  
  private setupCollisions(): void {
    // Player vs obstacles
    this.physics.add.collider(this.player, this.obstacles);
    
    // Player vs enemies (damage)
    this.physics.add.overlap(
      this.player,
      this.enemies,
      this.handlePlayerEnemyCollision as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );
    
    // Projectiles vs enemies
    this.physics.add.overlap(
      this.projectiles,
      this.enemies,
      this.handleProjectileEnemyCollision as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );
    
    // Allies vs enemies
    this.physics.add.overlap(
      this.allies,
      this.enemies,
      this.handleAllyEnemyCollision as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );
    
    // Player vs pickups
    this.physics.add.overlap(
      this.player,
      this.pickups,
      this.handlePlayerPickupCollision as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );
    
    // Enemies vs obstacles
    this.physics.add.collider(this.enemies, this.obstacles);
  }
  
  private setupInput(): void {
    // Keyboard
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = {
      W: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    
    // Pause
    this.input.keyboard!.on('keydown-ESC', () => this.togglePause());
    
    // Debug
    this.input.keyboard!.on('keydown-F1', () => this.toggleDebug());
  }
  
  private setupCamera(): void {
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.setZoom(1);
  }
  
  update(time: number, delta: number): void {
    if (this.runEnded || this.runState.isPaused || this.runState.isLevelingUp) return;
    
    const dt = delta / 1000;
    
    // Update time
    this.runState.gameTime += dt;
    this.runState.inGameTime = this.runState.gameTime * TIME_SCALE;
    
    // Check victory condition
    if (this.runState.inGameTime >= GAME_DURATION_MINUTES) {
      this.victory();
      return;
    }
    
    // Update player
    this.updatePlayer(dt);
    
    // Update weapons
    this.updateWeapons(time);
    
    // Update orbitals
    this.updateOrbitalPositions(dt);
    
    // Update enemies
    this.updateEnemies(dt);
    
    // Update allies
    this.updateAllies(time);
    
    // Spawn enemies
    this.updateSpawning(time);
    
    // Update events
    this.updateEvents(time);
    
    // Check boss spawn
    this.checkBossSpawn();
    
    // Passive regen: upgrade value is HP per 5 seconds
    const regen = this.getStatValue('healthRegen');
    if (regen > 0 && this.runState.health > 0 && this.runState.health < this.runState.maxHealth) {
      this.runState.health = Math.min(this.runState.maxHealth, this.runState.health + (regen / 5) * dt);
    }
    
    // Update hype
    this.updateHype(dt);
    
    // Update camera shake
    this.updateCameraShake(dt);
    
    // Attract pickups
    this.attractPickups();
    
    // Emit state to UI
    this.emitState();
  }
  
  private updatePlayer(dt: number): void {
    // Get input
    let dx = 0;
    let dy = 0;
    
    if (this.cursors.left.isDown || this.wasd.A.isDown) dx -= 1;
    if (this.cursors.right.isDown || this.wasd.D.isDown) dx += 1;
    if (this.cursors.up.isDown || this.wasd.W.isDown) dy -= 1;
    if (this.cursors.down.isDown || this.wasd.S.isDown) dy += 1;
    
    // Add joystick input
    dx += this.joystickInput.x;
    dy += this.joystickInput.y;
    
    // Normalize
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len > 0) {
      dx /= len;
      dy /= len;
      this.facingAngle = Math.atan2(dy, dx);
    }
    
    // Calculate speed with modifiers
    this.playerSpeed = this.playerBaseSpeed * this.getStatMultiplier('moveSpeed') * this.eventMods.playerSpeed;
    
    // Accelerate toward the target velocity, and coast to a stop when input ends
    const targetVx = dx * this.playerSpeed;
    const targetVy = dy * this.playerSpeed;
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const rate = dx === 0 && dy === 0 ? 9 : 14;
    const t = 1 - Math.exp(-rate * dt);
    body.setVelocity(
      body.velocity.x + (targetVx - body.velocity.x) * t,
      body.velocity.y + (targetVy - body.velocity.y) * t,
    );
    
    // Update invulnerability
    if (this.invulnerable && this.time.now > this.invulnerableUntil) {
      this.invulnerable = false;
      this.player.clearTint();
    }
    
    // Flash while invulnerable
    if (this.invulnerable) {
      this.player.setAlpha(Math.sin(this.time.now / 50) * 0.3 + 0.7);
    } else {
      this.player.setAlpha(1);
    }
  }
  
  private updateWeapons(time: number): void {
    for (const [weaponId, level] of this.runState.weapons) {
      const weapon = getWeapon(weaponId);
      if (!weapon) continue;
      
      const stats = getWeaponStats(weaponId, level);
      const cooldown = stats.cooldown * this.getStatMultiplier('cooldown');
      const lastFire = this.weaponCooldowns.get(weaponId) || 0;
      
      if (time - lastFire >= cooldown) {
        this.fireWeapon(weaponId, level, stats);
        this.weaponCooldowns.set(weaponId, time);
      }
    }
  }
  
  private fireWeapon(weaponId: string, _level: number, stats: ReturnType<typeof getWeaponStats>): void {
    const weapon = getWeapon(weaponId);
    if (!weapon) return;
    
    switch (weapon.category) {
      case 'projectile':
        this.fireProjectile(weaponId, stats);
        break;
      case 'aoe':
        this.fireAOE(weaponId, stats);
        break;
      case 'directional':
        this.fireDirectional(weaponId, stats);
        break;
      case 'summon':
        this.spawnAlly(stats);
        break;
      // Orbital handled separately
    }
  }
  
  private fireProjectile(weaponId: string, stats: ReturnType<typeof getWeaponStats>): void {
    const count = stats.projectileCount || 1;
    const damage = stats.damage * this.getStatMultiplier('damage');
    const speed = (stats.projectileSpeed || 400) * this.getStatMultiplier('projectileSpeed');
    const range = (stats.range || 300) * this.getStatMultiplier('aoe');
    
    // Find targets
    const targets = this.findNearestEnemies(count, range);
    
    for (let i = 0; i < count; i++) {
      const target = targets.length > 0 ? targets[i % targets.length] : undefined;
      const spread = (i - (count - 1) / 2) * 0.14;
      const angle = target
        ? Phaser.Math.Angle.Between(this.player.x, this.player.y, target.x, target.y) + spread
        : this.facingAngle + spread;
      
      const texture = this.getProjectileTexture(weaponId);
      const proj = this.projectiles.create(this.player.x, this.player.y, texture) as ProjectileSprite;
      proj.weaponId = weaponId;
      proj.damage = damage;
      proj.piercing = stats.piercing || 0;
      proj.hitTargets = new Set();
      proj.speed = speed;
      proj.lifetime = (range / speed) * 1000;
      proj.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
      proj.setRotation(angle);
      proj.setDepth(8);
      
      // Destroy after lifetime
      this.time.delayedCall(proj.lifetime, () => {
        if (proj.active) {
          // Explosion for bottle-service
          if (weaponId === 'bottle-service' && stats.aoeRadius) {
            this.createExplosion(proj.x, proj.y, stats.aoeRadius, damage * 0.5);
          }
          proj.destroy();
        }
      });
    }
  }
  
  private fireAOE(weaponId: string, stats: ReturnType<typeof getWeaponStats>): void {
    const damage = stats.damage * this.getStatMultiplier('damage');
    const radius = (stats.aoeRadius || 100) * this.getStatMultiplier('aoe');
    const knockback = (stats.knockback || 0) * this.getStatMultiplier('knockback');
    
    // Visual effect
    if (weaponId === 'strobe' || weaponId === 'laser-show') {
      this.createStrobeEffect(radius);
    } else if (weaponId === 'bass-drop' || weaponId === 'earthquake') {
      this.createBassDropEffect(radius);
      this.addScreenShake(0.3);
    }
    
    // Damage enemies in radius
    this.enemies.getChildren().forEach((enemy) => {
      const e = enemy as EnemySprite;
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, e.x, e.y);
      if (dist <= radius) {
        this.damageEnemy(e, damage);
        
        // Knockback
        if (knockback > 0) {
          const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, e.x, e.y);
          e.setVelocity(
            Math.cos(angle) * knockback,
            Math.sin(angle) * knockback
          );
        }
        
        // Chain effect for laser-show
        if (weaponId === 'laser-show' && stats.piercing) {
          this.chainDamage(e, damage * 0.6, stats.piercing);
        }
      }
    });

    // Synergy: bass hits trigger a strobe burst when both are owned
    const hasStrobe = this.runState.weapons.has('strobe') || this.runState.weapons.has('laser-show');
    if (hasStrobe && (weaponId === 'bass-drop' || weaponId === 'earthquake')) {
      this.time.delayedCall(180, () => {
        if (!this.runState.isPaused) this.createStrobeEffect(radius * 0.65);
      });
    }
    
    audioService.play('explosion');
  }
  
  private fireDirectional(weaponId: string, stats: ReturnType<typeof getWeaponStats>): void {
    const damage = stats.damage * this.getStatMultiplier('damage');
    const coneWidth = (stats.aoeRadius || 60) * this.getStatMultiplier('aoe');
    const range = stats.range || 250;
    const knockback = (stats.knockback || 0) * this.getStatMultiplier('knockback');
    
    // Get direction toward nearest enemy or facing direction
    const nearest = this.findNearestEnemies(1, range)[0];
    const angle = nearest
      ? Phaser.Math.Angle.Between(this.player.x, this.player.y, nearest.x, nearest.y)
      : this.facingAngle;
    
    // Create wave visual
    const wave = this.add.sprite(this.player.x, this.player.y, 'projectile-wave');
    wave.setRotation(angle);
    wave.setDepth(8);
    wave.setTint(getWeapon(weaponId)?.color || 0xffffff);
    wave.setScale(coneWidth / 60); // Scale based on cone width
    
    this.tweens.add({
      targets: wave,
      x: this.player.x + Math.cos(angle) * range,
      y: this.player.y + Math.sin(angle) * range,
      scale: 1.5,
      alpha: 0,
      duration: 300,
      onComplete: () => wave.destroy(),
    });
    
    // Damage enemies in cone
    this.enemies.getChildren().forEach((enemy) => {
      const e = enemy as EnemySprite;
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, e.x, e.y);
      if (dist > range) return;
      
      const enemyAngle = Phaser.Math.Angle.Between(this.player.x, this.player.y, e.x, e.y);
      const angleDiff = Math.abs(Phaser.Math.Angle.Wrap(enemyAngle - angle));
      
      if (angleDiff < 0.5) { // ~30 degree cone
        this.damageEnemy(e, damage);
        
        if (knockback > 0) {
          e.setVelocity(
            Math.cos(enemyAngle) * knockback,
            Math.sin(enemyAngle) * knockback
          );
        }
      }
    });
    
    audioService.play('hit');
  }
  
  private spawnAlly(stats: ReturnType<typeof getWeaponStats>): void {
    const count = stats.projectileCount || 1;
    const damage = stats.damage * this.getStatMultiplier('damage');
    const duration = (stats.duration || 10000) * this.getStatMultiplier('summonDuration');
    
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const x = this.player.x + Math.cos(angle) * 60;
      const y = this.player.y + Math.sin(angle) * 60;
      
      const ally = this.allies.create(x, y, 'ally-security') as AllySprite;
      ally.damage = damage;
      ally.expiresAt = this.time.now + duration;
      ally.attackCooldown = 1000;
      ally.lastAttack = 0;
      ally.setDepth(9);
      
      // Spawn effect
      this.createSpawnEffect(x, y, 0x4444ff);
    }
    
    audioService.play('select');
  }
  
  private updateOrbitals(): void {
    // Clear existing orbitals
    this.orbitals.clear(true, true);
    
    // Check for orbital weapons
    for (const [weaponId, level] of this.runState.weapons) {
      const weapon = getWeapon(weaponId);
      if (!weapon || weapon.category !== 'orbital') continue;
      
      const stats = getWeaponStats(weaponId, level);
      const count = stats.projectileCount || 1;
      const damage = stats.damage * this.getStatMultiplier('damage');
      const radius = (stats.orbitRadius || 80) * this.getStatMultiplier('aoe');
      const speed = stats.orbitSpeed || 2;
      
      for (let i = 0; i < count; i++) {
        const texture = weaponId === 'champagne-orbit' ? 'projectile-bottle' : 'orbital-bucket';
        const orbital = this.add.sprite(this.player.x, this.player.y, texture) as OrbitalSprite;
        orbital.weaponId = weaponId;
        orbital.damage = damage;
        orbital.angle = (i / count) * Math.PI * 2;
        orbital.orbitRadius = radius;
        orbital.orbitSpeed = speed;
        orbital.lastHitTime = new Map();
        orbital.setDepth(9);
        
        this.orbitals.add(orbital);
      }
    }
  }
  
  private updateOrbitalPositions(dt: number): void {
    const orbitals = this.orbitals.getChildren() as OrbitalSprite[];
    
    for (const orbital of orbitals) {
      orbital.angle += orbital.orbitSpeed * dt;
      orbital.x = this.player.x + Math.cos(orbital.angle) * orbital.orbitRadius;
      orbital.y = this.player.y + Math.sin(orbital.angle) * orbital.orbitRadius;
      orbital.setRotation(orbital.angle + Math.PI / 2);
      
      // Synergy: buckets fling bottles when Bottle Toss is also equipped
      const hasBottles = this.runState.weapons.has('bottle-toss') || this.runState.weapons.has('bottle-service');
      if (hasBottles && this.time.now - (orbital.getData('bottleAt') as number || 0) > 2200) {
        if (this.rng.next() < 0.35) {
          this.launchOrbitalBottle(orbital);
        }
        orbital.setData('bottleAt', this.time.now);
      }
      
      // Check collision with enemies
      this.enemies.getChildren().forEach((enemy) => {
        const e = enemy as EnemySprite;
        const dist = Phaser.Math.Distance.Between(orbital.x, orbital.y, e.x, e.y);
        
        if (dist < 30) {
          const lastHit = orbital.lastHitTime.get(e) || 0;
          if (this.time.now - lastHit > 500) {
            this.damageEnemy(e, orbital.damage);
            orbital.lastHitTime.set(e, this.time.now);
            
            // Knockback
            const angle = Phaser.Math.Angle.Between(orbital.x, orbital.y, e.x, e.y);
            e.setVelocity(
              Math.cos(angle) * 100,
              Math.sin(angle) * 100
            );
          }
        }
      });
    }
  }
  
  private updateAllies(time: number): void {
    const allies = this.allies.getChildren() as AllySprite[];
    
    for (const ally of allies) {
      // Check expiration
      if (time > ally.expiresAt) {
        this.createDeathEffect(ally.x, ally.y, 0x4444ff);
        ally.destroy();
        continue;
      }
      
      // Find target
      if (!ally.target || !ally.target.active) {
        ally.target = this.findNearestEnemies(1, 200)[0];
      }
      
      if (ally.target) {
        // Move toward target
        const angle = Phaser.Math.Angle.Between(ally.x, ally.y, ally.target.x, ally.target.y);
        const dist = Phaser.Math.Distance.Between(ally.x, ally.y, ally.target.x, ally.target.y);
        
        if (dist > 40) {
          ally.setVelocity(Math.cos(angle) * 100, Math.sin(angle) * 100);
        } else {
          ally.setVelocity(0, 0);
          
          // Attack
          if (time - ally.lastAttack > ally.attackCooldown) {
            this.damageEnemy(ally.target, ally.damage);
            ally.lastAttack = time;
          }
        }
      } else {
        // Follow player
        const angle = Phaser.Math.Angle.Between(ally.x, ally.y, this.player.x, this.player.y);
        const dist = Phaser.Math.Distance.Between(ally.x, ally.y, this.player.x, this.player.y);
        
        if (dist > 80) {
          ally.setVelocity(Math.cos(angle) * 80, Math.sin(angle) * 80);
        } else {
          ally.setVelocity(0, 0);
        }
      }
    }
  }
  
  private launchOrbitalBottle(orbital: OrbitalSprite): void {
    const weaponId = this.runState.weapons.has('bottle-service') ? 'bottle-service' : 'bottle-toss';
    const level = this.runState.weapons.get(weaponId) || 1;
    const stats = getWeaponStats(weaponId, level);
    const target = this.findNearestEnemies(1, 320)[0];
    const angle = target
      ? Phaser.Math.Angle.Between(orbital.x, orbital.y, target.x, target.y)
      : orbital.angle;
    const speed = (stats.projectileSpeed || 400) * this.getStatMultiplier('projectileSpeed');
    const proj = this.projectiles.create(orbital.x, orbital.y, 'projectile-bottle') as ProjectileSprite;
    proj.weaponId = weaponId;
    proj.damage = stats.damage * 0.7 * this.getStatMultiplier('damage');
    proj.piercing = stats.piercing || 0;
    proj.hitTargets = new Set();
    proj.speed = speed;
    proj.lifetime = 800;
    proj.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
    proj.setRotation(angle);
    proj.setDepth(8);
    this.time.delayedCall(proj.lifetime, () => {
      if (proj.active) proj.destroy();
    });
  }
  
  private updateEnemies(dt: number): void {
    const enemies = this.enemies.getChildren() as EnemySprite[];
    
    for (const enemy of enemies) {
      enemy.behaviorTimer += dt;
      
      const glow = enemy.getData('glow') as Phaser.GameObjects.Sprite | undefined;
      if (glow) {
        glow.setPosition(enemy.x, enemy.y);
      }
      if (enemy.isBoss) {
        this.drawBossBar(enemy);
      }
      
      // Elite regeneration
      if (enemy.isElite && enemy.eliteModifier === 'regen') {
        enemy.health = Math.min(enemy.maxHealth, enemy.health + enemy.maxHealth * 0.02 * dt);
      }
      
      // Update behavior
      switch (enemy.behavior) {
        case 'chase':
          this.behaviorChase(enemy);
          break;
        case 'wander-chase':
          this.behaviorWanderChase(enemy, dt);
          break;
        case 'rush':
          this.behaviorRush(enemy);
          break;
        case 'kite':
          this.behaviorKite(enemy);
          break;
        case 'swarm':
          this.behaviorSwarm(enemy);
          break;
        case 'support':
          this.behaviorSupport(enemy);
          break;
      }
      
      // Boss behavior
      if (enemy.isBoss) {
        this.updateBossBehavior(enemy);
      }

      if (this.eventMods.enemySpeed !== 1 && enemy.body) {
        const body = enemy.body as Phaser.Physics.Arcade.Body;
        body.velocity.x *= this.eventMods.enemySpeed;
        body.velocity.y *= this.eventMods.enemySpeed;
      }
    }
  }
  
  private drawBossBar(enemy: EnemySprite): void {
    let bar = enemy.getData('bar') as Phaser.GameObjects.Graphics | undefined;
    if (!bar) {
      bar = this.add.graphics();
      bar.setDepth(16);
      enemy.setData('bar', bar);
    }
    const pct = Math.max(0, enemy.health / enemy.maxHealth);
    const y = enemy.y - 46;
    bar.clear();
    bar.fillStyle(0x000000, 0.75);
    bar.fillRect(enemy.x - 42, y, 84, 8);
    bar.fillStyle(0xff3366, 1);
    bar.fillRect(enemy.x - 40, y + 2, 80 * pct, 4);
  }
  
  private behaviorChase(enemy: EnemySprite): void {
    const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
    enemy.setVelocity(Math.cos(angle) * enemy.speed, Math.sin(angle) * enemy.speed);
  }
  
  private behaviorWanderChase(enemy: EnemySprite, _dt: number): void {
    // Drunk wanders occasionally
    if (enemy.behaviorTimer > 2 + this.rng.next() * 2) {
      enemy.behaviorTimer = 0;
      enemy.targetX = enemy.x + (this.rng.next() - 0.5) * 200;
      enemy.targetY = enemy.y + (this.rng.next() - 0.5) * 200;
    }
    
    // Mix of chase and wander
    const chaseAngle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
    const wanderAngle = enemy.targetX !== undefined && enemy.targetY !== undefined
      ? Phaser.Math.Angle.Between(enemy.x, enemy.y, enemy.targetX, enemy.targetY)
      : chaseAngle;
    
    const angle = Phaser.Math.Angle.Wrap(chaseAngle * 0.7 + wanderAngle * 0.3);
    enemy.setVelocity(Math.cos(angle) * enemy.speed, Math.sin(angle) * enemy.speed);
  }
  
  private behaviorRush(enemy: EnemySprite): void {
    // Rush directly at player, fast
    const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
    enemy.setVelocity(Math.cos(angle) * enemy.speed, Math.sin(angle) * enemy.speed);
  }
  
  private behaviorKite(enemy: EnemySprite): void {
    const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);
    const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
    const attackRange = (enemy as EnemySprite & { attackRange?: number }).attackRange || 200;
    
    if (dist < attackRange - 50) {
      // Too close, back away
      enemy.setVelocity(Math.cos(angle + Math.PI) * enemy.speed, Math.sin(angle + Math.PI) * enemy.speed);
    } else if (dist > attackRange + 50) {
      // Too far, approach
      enemy.setVelocity(Math.cos(angle) * enemy.speed * 0.5, Math.sin(angle) * enemy.speed * 0.5);
    } else {
      // In range, stop and attack
      enemy.setVelocity(0, 0);
      
      // Ranged attack
      if (this.time.now - enemy.lastAttack > enemy.attackCooldown) {
        this.enemyRangedAttack(enemy);
        enemy.lastAttack = this.time.now;
      }
    }
  }
  
  private behaviorSwarm(enemy: EnemySprite): void {
    // Find nearby swarm members and chase together
    let avgX = this.player.x;
    let avgY = this.player.y;
    let count = 1;
    
    this.enemies.getChildren().forEach((other) => {
      const o = other as EnemySprite;
      if (o !== enemy && o.behavior === 'swarm') {
        const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, o.x, o.y);
        if (dist < 100) {
          avgX += o.x;
          avgY += o.y;
          count++;
        }
      }
    });
    
    avgX /= count;
    avgY /= count;
    
    // Move toward average position biased toward player
    const targetX = avgX * 0.3 + this.player.x * 0.7;
    const targetY = avgY * 0.3 + this.player.y * 0.7;
    
    const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, targetX, targetY);
    enemy.setVelocity(Math.cos(angle) * enemy.speed, Math.sin(angle) * enemy.speed);
  }
  
  private behaviorSupport(enemy: EnemySprite): void {
    // Stay near other enemies and occasionally buff them
    const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);
    const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
    
    if (dist < 150) {
      // Too close, run away
      enemy.setVelocity(Math.cos(angle + Math.PI) * enemy.speed, Math.sin(angle + Math.PI) * enemy.speed);
    } else if (dist > 300) {
      // Follow from distance
      enemy.setVelocity(Math.cos(angle) * enemy.speed * 0.5, Math.sin(angle) * enemy.speed * 0.5);
    } else {
      enemy.setVelocity(0, 0);
    }
  }
  
  private updateBossBehavior(boss: EnemySprite): void {
    const bossData = BOSSES.find(b => b.id === boss.enemyId);
    if (!bossData) return;
    
    // Determine current phase
    const healthPercent = boss.health / boss.maxHealth;
    let phaseIndex = 0;
    for (let i = bossData.phases.length - 1; i >= 0; i--) {
      if (healthPercent <= bossData.phases[i].healthThreshold) {
        phaseIndex = i;
        break;
      }
    }
    
    if (phaseIndex !== boss.bossPhase) {
      boss.bossPhase = phaseIndex;
      // Phase change effect
      this.createBossPhaseEffect(boss);
    }
    
    const phase = bossData.phases[phaseIndex];
    
    // Movement
    switch (phase.movementPattern) {
      case 'chase':
      case 'aggressive':
      case 'enraged':
        const speedMult = phase.movementPattern === 'enraged' ? 1.5 : 1;
        const angle = Phaser.Math.Angle.Between(boss.x, boss.y, this.player.x, this.player.y);
        boss.setVelocity(
          Math.cos(angle) * boss.speed * speedMult,
          Math.sin(angle) * boss.speed * speedMult
        );
        break;
      case 'stationary':
        boss.setVelocity(0, 0);
        break;
      case 'slow-chase':
        const slowAngle = Phaser.Math.Angle.Between(boss.x, boss.y, this.player.x, this.player.y);
        boss.setVelocity(
          Math.cos(slowAngle) * boss.speed * 0.5,
          Math.sin(slowAngle) * boss.speed * 0.5
        );
        break;
    }
    
    // Attacks
    if (this.time.now - boss.lastAttack > boss.attackCooldown) {
      const attack = this.rng.pick(phase.attacks);
      this.executeBossAttack(boss, attack);
      boss.lastAttack = this.time.now;
    }
  }
  
  private executeBossAttack(boss: EnemySprite, attack: string): void {
    switch (attack) {
      case 'charge':
        // Fast dash toward player
        const chargeAngle = Phaser.Math.Angle.Between(boss.x, boss.y, this.player.x, this.player.y);
        boss.setVelocity(
          Math.cos(chargeAngle) * 400,
          Math.sin(chargeAngle) * 400
        );
        this.time.delayedCall(500, () => boss.setVelocity(0, 0));
        break;
        
      case 'slam':
        // AOE attack
        this.createBassDropEffect(150);
        this.damagePlayerInRadius(boss.x, boss.y, 150, boss.damage);
        this.addScreenShake(0.4);
        break;
        
      case 'sound-wave':
        // Directional attack
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2;
          this.createProjectileFromEnemy(boss, angle, boss.damage * 0.5);
        }
        break;
        
      case 'bass-slam':
        // Large AOE
        this.createBassDropEffect(200);
        this.damagePlayerInRadius(boss.x, boss.y, 200, boss.damage * 1.5);
        this.addScreenShake(0.5);
        break;
    }
  }
  
  private createProjectileFromEnemy(enemy: EnemySprite, angle: number, damage: number): void {
    const proj = this.add.circle(enemy.x, enemy.y, 8, 0xff0000) as Phaser.GameObjects.Arc & { vel: { x: number; y: number } };
    proj.vel = { x: Math.cos(angle) * 200, y: Math.sin(angle) * 200 };
    proj.setDepth(8);
    
    const update = () => {
      if (!proj.active) return;
      proj.x += proj.vel.x * 0.016;
      proj.y += proj.vel.y * 0.016;
      
      // Check collision with player
      const dist = Phaser.Math.Distance.Between(proj.x, proj.y, this.player.x, this.player.y);
      if (dist < 20) {
        this.damagePlayer(damage);
        proj.destroy();
        return;
      }
      
      // Out of bounds
      if (proj.x < 0 || proj.x > WORLD_WIDTH || proj.y < 0 || proj.y > WORLD_HEIGHT) {
        proj.destroy();
        return;
      }
      
      this.time.delayedCall(16, update);
    };
    
    this.time.delayedCall(16, update);
    this.time.delayedCall(5000, () => proj.destroy());
  }
  
  private enemyRangedAttack(enemy: EnemySprite): void {
    const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
    this.createProjectileFromEnemy(enemy, angle, enemy.damage);
    
    // Visual feedback
    const flash = this.add.circle(enemy.x, enemy.y, 15, 0xff0000, 0.5);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      scale: 0.5,
      duration: 200,
      onComplete: () => flash.destroy(),
    });
  }
  
  private updateSpawning(time: number): void {
    if (this.bossActive) return; // Don't spawn during boss
    
    // Calculate spawn rate based on time
    const timeProgress = this.runState.inGameTime / GAME_DURATION_MINUTES;
    const baseInterval = 1600 - timeProgress * 1200;
    this.spawnInterval = Math.max(280, baseInterval) / this.eventMods.spawnRate;
    
    // Elite chance increases, and VIP Arrival forces elites
    this.eliteChance = this.activeEvent === 'vip-arrival' ? 1 : 0.05 + timeProgress * 0.2;
    
    if (time - this.lastSpawnTime > this.spawnInterval) {
      const count = 1 + Math.floor(timeProgress * 3);
      for (let i = 0; i < count; i++) {
        this.spawnEnemy();
      }
      this.lastSpawnTime = time;
    }
    
    // Limit enemy count for performance
    if (this.enemies.getLength() > 100) {
      const farthest = this.findFarthestEnemy();
      if (farthest) farthest.destroy();
    }
  }
  
  private spawnEnemy(): void {
    const spawnableEnemies = getSpawnableEnemies(this.runState.inGameTime);
    if (spawnableEnemies.length === 0) return;
    
    // Weighted random selection
    const totalWeight = spawnableEnemies.reduce((sum, e) => sum + e.spawnWeight, 0);
    let rand = this.rng.next() * totalWeight;
    
    let selectedEnemy = spawnableEnemies[0];
    for (const enemy of spawnableEnemies) {
      rand -= enemy.spawnWeight;
      if (rand <= 0) {
        selectedEnemy = enemy;
        break;
      }
    }
    
    // Spawn position (edge of screen)
    const cam = this.cameras.main;
    const side = this.rng.nextInt(0, 3);
    let x: number, y: number;
    
    switch (side) {
      case 0: // Top
        x = cam.scrollX + this.rng.next() * cam.width;
        y = cam.scrollY - 50;
        break;
      case 1: // Right
        x = cam.scrollX + cam.width + 50;
        y = cam.scrollY + this.rng.next() * cam.height;
        break;
      case 2: // Bottom
        x = cam.scrollX + this.rng.next() * cam.width;
        y = cam.scrollY + cam.height + 50;
        break;
      default: // Left
        x = cam.scrollX - 50;
        y = cam.scrollY + this.rng.next() * cam.height;
    }
    
    // Clamp to world bounds
    x = Phaser.Math.Clamp(x, 50, WORLD_WIDTH - 50);
    y = Phaser.Math.Clamp(y, 50, WORLD_HEIGHT - 50);
    
    // Create enemy
    const isElite = this.rng.next() < this.eliteChance;
    this.createEnemy(selectedEnemy.id, x, y, isElite);
  }
  
  private createEnemy(enemyId: string, x: number, y: number, isElite: boolean, isBoss = false): EnemySprite | null {
    const enemyDef = getEnemy(enemyId);
    const bossDef = BOSSES.find(b => b.id === enemyId);
    
    if (!enemyDef && !bossDef) return null;
    
    const def = enemyDef || { 
      id: bossDef!.id,
      baseStats: bossDef!.baseStats,
      behavior: 'chase',
      size: bossDef!.size,
      color: bossDef!.color,
    };
    
    const texture = bossDef ? `boss-${enemyId}` : `enemy-${enemyId}`;
    const enemy = this.enemies.create(x, y, texture) as EnemySprite;
    
    // Apply stats
    const timeScale = 1 + (this.runState.inGameTime / GAME_DURATION_MINUTES) * 0.5;
    enemy.enemyId = def.id;
    enemy.health = def.baseStats.health * timeScale;
    enemy.maxHealth = enemy.health;
    enemy.damage = def.baseStats.damage * timeScale;
    enemy.speed = def.baseStats.speed;
    enemy.xpValue = def.baseStats.xpValue;
    enemy.behavior = def.behavior;
    enemy.attackCooldown = def.baseStats.attackCooldown || 1000;
    enemy.lastAttack = 0;
    enemy.behaviorTimer = 0;
    enemy.isElite = isElite;
    enemy.isBoss = isBoss || !!bossDef;
    
    if (enemy.isBoss) {
      enemy.bossPhase = 0;
      enemy.health = bossDef!.baseStats.health;
      enemy.maxHealth = enemy.health;
      enemy.attackCooldown = 2000;
    }
    
    // Elite modifier
    if (isElite && !isBoss) {
      const modifier = this.rng.pick(ELITE_MODIFIERS);
      enemy.eliteModifier = modifier.id;
      enemy.setTint(modifier.color);
      
      if (modifier.statMultipliers.health) enemy.health *= modifier.statMultipliers.health;
      if (modifier.statMultipliers.health) enemy.maxHealth *= modifier.statMultipliers.health;
      if (modifier.statMultipliers.speed) enemy.speed *= modifier.statMultipliers.speed;
      if (modifier.statMultipliers.damage) enemy.damage *= modifier.statMultipliers.damage;
      
      enemy.xpValue *= 2;
      
      // Add glow
      const glow = this.add.sprite(x, y, 'elite-glow');
      glow.setDepth(enemy.depth - 1);
      enemy.setData('glow', glow);
    }
    
    enemy.setDepth(7);
    enemy.setBounce(0.5);
    
    return enemy;
  }
  
  private spawnBoss(bossId: string): void {
    const bossDef = BOSSES.find(b => b.id === bossId);
    if (!bossDef) return;
    
    this.bossActive = true;
    
    // Warning
    this.events.emit('bossWarning', bossDef.name, bossDef.subtitle);
    audioService.play('bossWarning');
    
    this.tookDamageThisBoss = false;
    this.time.delayedCall(3000, () => {
      // Spawn in center of screen
      const boss = this.createEnemy(bossId, this.player.x, this.player.y - 200, false, true);
      if (boss) {
        this.currentBoss = boss;
        
        // Dramatic entrance
        this.addScreenShake(0.5);
        this.createSpawnEffect(boss.x, boss.y, bossDef.color);
      }
    });
  }
  
  private checkBossSpawn(): void {
    if (this.bossActive) return;
    
    const boss = getBossForTime(this.runState.inGameTime);
    if (boss && !this.currentBoss) {
      this.spawnBoss(boss.id);
    }
  }
  
  private updateEvents(time: number): void {
    // Check if current event ended
    if (this.activeEvent && time > this.eventEndTime) {
      this.endEvent();
    }
    
    // Try to start new event
    if (!this.activeEvent && !this.bossActive) {
      this.eventTimer += 1;
      if (this.eventTimer > 60000 && this.rng.next() < 0.01) { // ~1% chance per frame after 1 minute
        this.startRandomEvent();
        this.eventTimer = 0;
      }
    }
  }
  
  private startRandomEvent(): void {
    const availableEvents = GAME_EVENTS.filter(e => e.minTime <= this.runState.inGameTime);
    if (availableEvents.length === 0) return;
    
    const event = this.rng.pick(availableEvents);
    this.activeEvent = event.id;
    this.eventEndTime = this.time.now + event.duration * 1000;
    
    // Emit event start
    this.events.emit('eventStart', event.name, event.description);
    
    // Apply effects
    for (const effect of event.effects) {
      this.applyEventEffect(effect, true);
    }
  }
  
  private endEvent(): void {
    const event = GAME_EVENTS.find(e => e.id === this.activeEvent);
    if (event) {
      for (const effect of event.effects) {
        this.applyEventEffect(effect, false);
      }
    }
    
    this.activeEvent = null;
    this.events.emit('eventEnd');
  }
  
  private applyEventEffect(effect: string, apply: boolean): void {
    if (effect === 'spawn-swarm') {
      if (apply) {
        for (let i = 0; i < 16; i++) {
          this.spawnEnemy();
        }
      }
    } else if (effect === 'spawn-allies') {
      if (apply) {
        this.spawnAlly({ damage: 30, projectileCount: 3, duration: 20000, cooldown: 0, range: 200 });
      }
    } else if (effect === 'xp-multiplier-2') {
      this.eventMods.xp = apply ? 2 : 1;
    } else if (effect === 'spawn-rate-1.5') {
      this.eventMods.spawnRate = apply ? 1.5 : 1;
    } else if (effect === 'enemy-speed-0.8') {
      this.eventMods.enemySpeed = apply ? 0.8 : 1;
    } else if (effect === 'enemy-speed-1.3') {
      this.eventMods.enemySpeed = apply ? 1.3 : 1;
    } else if (effect === 'player-speed-1.3') {
      this.eventMods.playerSpeed = apply ? 1.3 : 1;
    } else if (effect === 'health-drop-rate-3') {
      this.eventMods.healthDrop = apply ? 0.18 : 0.05;
    } else if (effect === 'reduced-visibility') {
      this.setDarkness(apply);
    }
  }
  
  private setDarkness(on: boolean): void {
    if (on) {
      if (!this.darkness) {
        this.darkness = this.add.rectangle(0, 0, 4000, 4000, 0x000000, 0.62);
        this.darkness.setOrigin(0, 0);
        this.darkness.setScrollFactor(0);
        this.darkness.setDepth(40);
      }
      this.darkness.setVisible(true);
    } else if (this.darkness) {
      this.darkness.setVisible(false);
    }
  }
  
  private updateHype(dt: number): void {
    // Decay hype over time
    this.runState.hype = Math.max(0, this.runState.hype - 5 * dt);
  }
  
  private updateCameraShake(dt: number): void {
    if (!this.settings.screenShake) return;
    
    if (this.shakeIntensity > 0) {
      const shake = this.shakeIntensity * 10;
      this.cameras.main.setScroll(
        this.cameras.main.scrollX + (Math.random() - 0.5) * shake,
        this.cameras.main.scrollY + (Math.random() - 0.5) * shake
      );
      this.shakeIntensity -= dt * 2;
    }
  }
  
  private attractPickups(): void {
    const magnetRange = 150 * this.getStatMultiplier('pickupRange');
    
    this.pickups.getChildren().forEach((pickup) => {
      const p = pickup as PickupSprite;
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, p.x, p.y);
      
      if (dist < magnetRange) {
        // Attract toward player
        const angle = Phaser.Math.Angle.Between(p.x, p.y, this.player.x, this.player.y);
        const speed = 200 * (1 - dist / magnetRange);
        p.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
      }
    });
  }
  
  private handlePlayerEnemyCollision(
    _player: Phaser.Types.Physics.Arcade.GameObjectWithBody,
    enemy: Phaser.Types.Physics.Arcade.GameObjectWithBody
  ): void {
    const e = enemy as unknown as EnemySprite;
    this.damagePlayer(e.damage);
    
    // Knockback player
    const angle = Phaser.Math.Angle.Between(e.x, e.y, this.player.x, this.player.y);
    this.player.setVelocity(
      Math.cos(angle) * 200,
      Math.sin(angle) * 200
    );
  }
  
  private handleProjectileEnemyCollision(
    projectile: Phaser.Types.Physics.Arcade.GameObjectWithBody,
    enemy: Phaser.Types.Physics.Arcade.GameObjectWithBody
  ): void {
    const proj = projectile as unknown as ProjectileSprite;
    const e = enemy as unknown as EnemySprite;
    
    if (proj.hitTargets.has(e)) return;
    
    this.damageEnemy(e, proj.damage);
    proj.hitTargets.add(e);
    
    if (proj.piercing <= 0 || proj.hitTargets.size > proj.piercing) {
      // Check for explosion
      const weapon = getWeapon(proj.weaponId);
      if (weapon && (proj.weaponId === 'bottle-toss' || proj.weaponId === 'bottle-service')) {
        const stats = getWeaponStats(proj.weaponId, this.runState.weapons.get(proj.weaponId) || 1);
        if (stats.aoeRadius) {
          this.createExplosion(proj.x, proj.y, stats.aoeRadius, proj.damage * 0.5);
        }
      }
      proj.destroy();
    }
  }
  
  private handleAllyEnemyCollision(
    ally: Phaser.Types.Physics.Arcade.GameObjectWithBody,
    enemy: Phaser.Types.Physics.Arcade.GameObjectWithBody
  ): void {
    const a = ally as unknown as AllySprite;
    const e = enemy as unknown as EnemySprite;
    
    if (this.time.now - a.lastAttack > a.attackCooldown) {
      this.damageEnemy(e, a.damage);
      a.lastAttack = this.time.now;
    }
  }
  
  private handlePlayerPickupCollision(
    _player: Phaser.Types.Physics.Arcade.GameObjectWithBody,
    pickup: Phaser.Types.Physics.Arcade.GameObjectWithBody
  ): void {
    const p = pickup as unknown as PickupSprite;
    
    if (p.pickupType === 'xp') {
      this.addXP(p.value);
      audioService.play('xp');
    } else if (p.pickupType === 'health') {
      const healAmount = p.value * this.getStatMultiplier('healingBonus');
      this.runState.health = Math.min(this.runState.maxHealth, this.runState.health + healAmount);
    }
    
    // Pickup effect
    const particle = this.add.circle(p.x, p.y, 8, p.pickupType === 'xp' ? 0x00ffff : 0xff3366);
    this.tweens.add({
      targets: particle,
      y: p.y - 30,
      alpha: 0,
      scale: 0,
      duration: 300,
      onComplete: () => particle.destroy(),
    });
    
    p.destroy();
  }
  
  private damagePlayer(damage: number): void {
    if (this.invulnerable) return;
    
    // Dodge check
    if (this.rng.next() < this.getStatValue('dodge')) return;
    
    // Armor reduction
    const actualDamage = applyArmor(damage, this.getStatValue('armor'));
    if (this.bossActive) this.tookDamageThisBoss = true;
    
    this.runState.health -= actualDamage;
    this.runState.hype = Math.max(0, this.runState.hype - 20);
    
    // Visual feedback
    this.player.setTint(0xff0000);
    this.time.delayedCall(100, () => this.player.clearTint());
    
    // Invulnerability frames
    this.invulnerable = true;
    this.invulnerableUntil = this.time.now + 500;
    
    // Thorns damage
    const thorns = this.getStatValue('thornsDamage');
    if (thorns > 0) {
      // Damage nearest enemy
      const nearest = this.findNearestEnemies(1, 100)[0];
      if (nearest) this.damageEnemy(nearest, thorns);
    }
    
    audioService.play('playerHit');
    this.addScreenShake(0.2);
    
    // Check death
    if (this.runState.health <= 0) {
      this.gameOver();
    }
  }
  
  private damageEnemy(enemy: EnemySprite, baseDamage: number): void {
    // Critical hit
    const critChance = this.getStatValue('critChance');
    const isCrit = this.rng.next() < critChance;
    let damage = baseDamage * critMultiplier(isCrit, this.getStatValue('critDamage'));
    
    // Armored enemies take reduced damage
    if (enemy.eliteModifier === 'armored') {
      damage *= 0.7;
    }
    
    enemy.health -= damage;
    this.runState.damageDealt += damage;
    
    // Visual feedback
    enemy.setTint(0xffffff);
    this.time.delayedCall(50, () => {
      if (enemy.active) {
        if (enemy.isElite && enemy.eliteModifier) {
          const mod = ELITE_MODIFIERS.find(m => m.id === enemy.eliteModifier);
          if (mod) enemy.setTint(mod.color);
        } else {
          enemy.clearTint();
        }
      }
    });
    
    // Damage number
    if (this.settings.damageNumbers && (isCrit || this.damageNumberCount < 14)) {
      this.createDamageNumber(enemy.x, enemy.y, Math.floor(damage), isCrit);
    }
    
    // Hit effect
    this.createHitEffect(enemy.x, enemy.y);
    
    // Check death
    if (enemy.health <= 0) {
      this.killEnemy(enemy);
    }
    
    audioService.play('hit');
  }
  
  private killEnemy(enemy: EnemySprite): void {
    this.runState.kills++;
    this.runState.hype = Math.min(100, this.runState.hype + 5 * this.getStatMultiplier('hypeGain'));
    
    if (enemy.isElite) this.runState.elitesDefeated++;
    if (enemy.isBoss) {
      this.runState.bossesDefeated++;
      this.bossActive = false;
      this.currentBoss = null;
      if (!this.tookDamageThisBoss) this.flawlessBoss = true;
      this.tookDamageThisBoss = false;
      saveService.addToStats('bossesDefeated', 1);
      this.events.emit('bossDefeated');
      const bar = enemy.getData('bar') as Phaser.GameObjects.Graphics | undefined;
      if (bar) bar.destroy();
    }
    
    // Drop XP
    this.dropXP(enemy.x, enemy.y, enemy.xpValue);
    
    // Chance to drop health
    if (this.rng.next() < this.eventMods.healthDrop) {
      this.dropHealth(enemy.x, enemy.y);
    }
    
    // Explosive death for elite
    if (enemy.eliteModifier === 'explosive') {
      this.createExplosion(enemy.x, enemy.y, 80, 20);
      this.damagePlayerInRadius(enemy.x, enemy.y, 80, 20);
    }
    
    // Death effect
    this.createDeathEffect(enemy.x, enemy.y, enemy.isBoss ? 0xffff00 : (enemy.isElite ? 0xff00ff : 0xff6666));
    
    // Clean up glow
    const glow = enemy.getData('glow') as Phaser.GameObjects.Sprite | undefined;
    if (glow) glow.destroy();
    
    enemy.destroy();
  }
  
  private findChainTarget(from: { x: number; y: number }, chained: Set<EnemySprite>): EnemySprite | null {
    let nearest: EnemySprite | null = null;
    let nearestDist = 150;
    const children = this.enemies.getChildren();
    for (let i = 0; i < children.length; i++) {
      const e = children[i] as EnemySprite;
      if (!e.active || chained.has(e)) continue;
      const dist = Phaser.Math.Distance.Between(from.x, from.y, e.x, e.y);
      if (dist < nearestDist) {
        nearest = e;
        nearestDist = dist;
      }
    }
    return nearest;
  }
  
  private chainDamage(source: EnemySprite, damage: number, maxChains: number): void {
    const chained = new Set<EnemySprite>([source]);
    let current: EnemySprite = source;
    
    for (let i = 0; i < maxChains; i++) {
      const nearest = this.findChainTarget(current, chained);
      if (!nearest) break;
      
      const line = this.add.line(0, 0, current.x, current.y, nearest.x, nearest.y, 0xffff00, 0.8);
      line.setDepth(15);
      this.tweens.add({
        targets: line,
        alpha: 0,
        duration: 200,
        onComplete: () => line.destroy(),
      });
      
      this.damageEnemy(nearest, damage);
      chained.add(nearest);
      current = nearest;
    }
  }
  
  private damagePlayerInRadius(x: number, y: number, radius: number, damage: number): void {
    const dist = Phaser.Math.Distance.Between(x, y, this.player.x, this.player.y);
    if (dist <= radius) {
      this.damagePlayer(damage);
    }
  }
  
  private createExplosion(x: number, y: number, radius: number, damage: number): void {
    // Damage enemies
    this.enemies.getChildren().forEach((enemy) => {
      const e = enemy as EnemySprite;
      const dist = Phaser.Math.Distance.Between(x, y, e.x, e.y);
      if (dist <= radius) {
        this.damageEnemy(e, damage);
      }
    });
    
    // Visual
    const explosion = this.add.circle(x, y, radius, 0xff6600, 0.5);
    explosion.setDepth(15);
    
    this.tweens.add({
      targets: explosion,
      alpha: 0,
      scale: 1.5,
      duration: 300,
      onComplete: () => explosion.destroy(),
    });
    
    audioService.play('explosion');
  }
  
  private dropXP(x: number, y: number, value: number): void {
    const adjustedValue = value * this.getStatMultiplier('xpGain') * this.eventMods.xp;
    const count = Math.min(5, Math.ceil(adjustedValue / 5));
    const valuePerOrb = adjustedValue / count;
    
    for (let i = 0; i < count; i++) {
      const offsetX = (this.rng.next() - 0.5) * 30;
      const offsetY = (this.rng.next() - 0.5) * 30;
      
      const xp = this.pickups.create(x + offsetX, y + offsetY, 'pickup-xp') as PickupSprite;
      xp.pickupType = 'xp';
      xp.value = valuePerOrb;
      xp.setDepth(5);
      
      // Pop animation
      this.tweens.add({
        targets: xp,
        y: xp.y - 20,
        duration: 200,
        ease: 'Quad.easeOut',
        yoyo: true,
      });
    }
  }
  
  private dropHealth(x: number, y: number): void {
    const health = this.pickups.create(x, y, 'pickup-health') as PickupSprite;
    health.pickupType = 'health';
    health.value = 20;
    health.setDepth(5);
  }
  
  private addXP(amount: number): void {
    this.runState.xp += amount;
    this.runXp += amount;
    
    while (this.runState.xp >= this.runState.xpToLevel) {
      this.runState.xp -= this.runState.xpToLevel;
      this.runState.level++;
      this.runState.xpToLevel = xpToNextLevel(this.runState.level);
      this.pendingLevels++;
    }
    
    if (this.pendingLevels > 0 && !this.runState.isLevelingUp) {
      this.levelUp();
    }
  }
  
  private levelUp(): void {
    const choices = this.generateUpgradeChoices(3);
    if (choices.length === 0) {
      this.pendingLevels = 0;
      this.runState.isLevelingUp = false;
      if (!this.runEnded) this.physics.resume();
      return;
    }
    
    this.runState.isLevelingUp = true;
    this.physics.pause();
    this.events.emit('levelUp', this.runState.level, choices);
    audioService.play('levelUp');
  }
  
  private generateUpgradeChoices(count: number): Array<{ type: 'weapon' | 'upgrade'; id: string; level: number }> {
    const choices: Array<{ type: 'weapon' | 'upgrade'; id: string; level: number }> = [];
    const usedIds = new Set<string>();
    
    // Evolutions are offered immediately when their conditions are met
    for (const [weaponId, level] of this.runState.weapons) {
      const weapon = getWeapon(weaponId);
      if (!weapon?.evolutionId || !weapon.evolutionRequires) continue;
      if (level < weapon.maxLevel) continue;
      if (!this.runState.passives.has(weapon.evolutionRequires)) continue;
      if (usedIds.has(weapon.evolutionId)) continue;
      choices.push({ type: 'weapon', id: weapon.evolutionId, level: 1 });
      usedIds.add(weapon.evolutionId);
      if (choices.length >= count) return choices;
    }
    
    for (let i = 0; i < count * 4 && choices.length < count; i++) {
      const isWeapon = this.rng.next() < 0.45;
      
      if (isWeapon) {
        const ownedWeapons = Array.from(this.runState.weapons.entries());
        const upgradableWeapons = ownedWeapons.filter(([id, level]) => {
          const weapon = getWeapon(id);
          return weapon && level < weapon.maxLevel && !usedIds.has(id);
        });
        
        if (upgradableWeapons.length > 0 && (this.runState.weapons.size >= 4 || this.rng.next() < 0.65)) {
          const [id, level] = this.rng.pick(upgradableWeapons);
          choices.push({ type: 'weapon', id, level: level + 1 });
          usedIds.add(id);
        } else if (this.runState.weapons.size < 6) {
          const availableWeapons = WEAPONS.filter(w =>
            !isEvolution(w.id) &&
            !this.runState.weapons.has(w.id) &&
            !usedIds.has(w.id)
          );
          if (availableWeapons.length > 0) {
            const weapon = this.rng.pick(availableWeapons);
            choices.push({ type: 'weapon', id: weapon.id, level: 1 });
            usedIds.add(weapon.id);
          }
        }
      } else {
        const availableUpgrades = UPGRADES.filter(u => {
          const currentLevel = this.runState.passives.get(u.id) || 0;
          if (currentLevel >= u.maxLevel) return false;
          if (usedIds.has(u.id)) return false;
          if (u.requiresWeapon && !this.runState.weapons.has(u.requiresWeapon)) return false;
          return true;
        });
        
        if (availableUpgrades.length > 0) {
          const totalWeight = availableUpgrades.reduce((sum, u) => sum + (6 - u.rarity), 0);
          let rand = this.rng.next() * totalWeight;
          let selected = availableUpgrades[0];
          for (const upgrade of availableUpgrades) {
            rand -= (6 - upgrade.rarity);
            if (rand <= 0) {
              selected = upgrade;
              break;
            }
          }
          const currentLevel = this.runState.passives.get(selected.id) || 0;
          choices.push({ type: 'upgrade', id: selected.id, level: currentLevel + 1 });
          usedIds.add(selected.id);
        }
      }
    }
    
    return choices;
  }
  
  selectUpgrade(type: 'weapon' | 'upgrade', id: string, level: number): void {
    if (type === 'weapon') {
      // Check if this is an evolution
      const weapon = getWeapon(id);
      if (weapon) {
        // Check if we're evolving from another weapon
        const evolvingFrom = WEAPONS.find(w => w.evolutionId === id);
        if (evolvingFrom && this.runState.weapons.has(evolvingFrom.id)) {
          this.runState.weapons.delete(evolvingFrom.id);
          saveService.addToStats('weaponEvolutions', 1);
          this.events.emit('weaponEvolved', weapon.name);
          audioService.play('evolve');
        }
      }
      
      this.runState.weapons.set(id, level);
      if (weapon && level >= weapon.maxLevel) this.reachedMaxWeapon = true;
      
      // Update orbitals if needed
      if (weapon?.category === 'orbital') {
        this.updateOrbitals();
      }
    } else {
      this.runState.passives.set(id, level);
      
      // Apply immediate effects
      const upgrade = getUpgrade(id);
      if (upgrade) {
        for (const effect of upgrade.effects) {
          if (effect.stat === 'maxHealth') {
            const bonus = effect.isPercent
              ? this.runState.maxHealth * effect.value
              : effect.value;
            this.runState.maxHealth = Math.max(20, this.runState.maxHealth + bonus);
            this.runState.health = Math.max(1, Math.min(this.runState.maxHealth, this.runState.health + bonus));
          }
        }
      }
    }
    
    this.pendingLevels = Math.max(0, this.pendingLevels - 1);
    if (this.pendingLevels > 0) {
      this.levelUp();
    } else {
      this.runState.isLevelingUp = false;
      this.physics.resume();
    }
    audioService.play('select');
  }
  
  private getStatMultiplier(stat: string): number {
    let multiplier = 1;

    for (const perm of PERMANENT_UPGRADES) {
      if (perm.stat !== stat || perm.stat === 'maxHealth') continue;
      const rank = saveService.getPermanentUpgradeLevel(perm.id);
      multiplier += perm.value * rank;
    }
    
    for (const [upgradeId, level] of this.runState.passives) {
      const upgrade = getUpgrade(upgradeId);
      if (!upgrade) continue;
      
      for (const effect of upgrade.effects) {
        if (effect.stat === stat && effect.isPercent) {
          multiplier += effect.value * level;
        }
      }
    }
    
    // Character bonuses
    const character = getCharacter(this.runState.characterId);
    if (character) {
      for (const bonus of character.bonuses) {
        if (bonus.stat === stat && bonus.isPercent) {
          multiplier += bonus.value;
        }
      }
    }
    
    if (stat === 'damage' && this.runState.hype >= 50) {
      multiplier += this.runState.hype >= 80 ? 0.2 : 0.1;
    }
    if (stat === 'moveSpeed' && this.runState.hype >= 80) {
      multiplier += 0.1;
    }
    
    // Special: comeback king
    if (stat === 'damage' && this.runState.health / this.runState.maxHealth < 0.3) {
      const comebackLevel = this.runState.passives.get('comeback-king') || 0;
      if (comebackLevel > 0) {
        const upgrade = getUpgrade('comeback-king');
        if (upgrade) {
          multiplier += upgrade.effects[0].value * comebackLevel;
        }
      }
    }
    
    return multiplier;
  }
  
  private getStatValue(stat: string): number {
    let value = 0;

    for (const perm of PERMANENT_UPGRADES) {
      if (perm.stat === stat) {
        value += perm.value * saveService.getPermanentUpgradeLevel(perm.id);
      }
    }
    
    for (const [upgradeId, level] of this.runState.passives) {
      const upgrade = getUpgrade(upgradeId);
      if (!upgrade) continue;
      
      for (const effect of upgrade.effects) {
        if (effect.stat === stat) {
          value += effect.value * level;
        }
      }
    }
    
    // Character bonuses
    const character = getCharacter(this.runState.characterId);
    if (character) {
      for (const bonus of character.bonuses) {
        if (bonus.stat === stat && !bonus.isPercent) {
          value += bonus.value;
        }
      }
    }
    
    return value;
  }
  
  private findNearestEnemies(count: number, range: number): EnemySprite[] {
    const enemies: Array<{ enemy: EnemySprite; dist: number }> = [];
    
    this.enemies.getChildren().forEach((enemy) => {
      const e = enemy as EnemySprite;
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, e.x, e.y);
      if (dist <= range) {
        enemies.push({ enemy: e, dist });
      }
    });
    
    enemies.sort((a, b) => a.dist - b.dist);
    return enemies.slice(0, count).map(e => e.enemy);
  }
  
  private findFarthestEnemy(): EnemySprite | null {
    let farthest: EnemySprite | null = null;
    let maxDist = 0;
    
    this.enemies.getChildren().forEach((enemy) => {
      const e = enemy as EnemySprite;
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, e.x, e.y);
      if (dist > maxDist) {
        maxDist = dist;
        farthest = e;
      }
    });
    
    return farthest;
  }
  
  private getProjectileTexture(weaponId: string): string {
    switch (weaponId) {
      case 'bottle-toss':
      case 'bottle-service':
        return 'projectile-bottle';
      case 'glow-stick':
        return 'projectile-glow';
      case 'disco-ball':
        return 'projectile-disco';
      default:
        return 'projectile-generic';
    }
  }
  
  // Visual effects
  private createHitEffect(x: number, y: number): void {
    const flash = this.add.sprite(x, y, 'hit-flash');
    flash.setDepth(15);
    flash.setScale(0.5);
    
    this.tweens.add({
      targets: flash,
      alpha: 0,
      scale: 1,
      duration: 100,
      onComplete: () => flash.destroy(),
    });
  }
  
  private createDeathEffect(x: number, y: number, color: number): void {
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const particle = this.add.circle(x, y, 6, color);
      particle.setDepth(15);
      
      this.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * 40,
        y: y + Math.sin(angle) * 40,
        alpha: 0,
        scale: 0,
        duration: 300,
        ease: 'Quad.easeOut',
        onComplete: () => particle.destroy(),
      });
    }
  }
  
  private createSpawnEffect(x: number, y: number, color: number): void {
    const ring = this.add.circle(x, y, 10, color, 0);
    ring.setStrokeStyle(3, color);
    ring.setDepth(15);
    
    this.tweens.add({
      targets: ring,
      radius: 50,
      alpha: 0,
      duration: 500,
      onComplete: () => ring.destroy(),
    });
  }
  
  private createStrobeEffect(radius: number): void {
    const strobe = this.add.circle(this.player.x, this.player.y, radius, 0xffff00, 0.6);
    strobe.setDepth(15);
    
    this.tweens.add({
      targets: strobe,
      alpha: 0,
      scale: 1.2,
      duration: 200,
      onComplete: () => strobe.destroy(),
    });
  }
  
  private createBassDropEffect(radius: number): void {
    const ring = this.add.circle(this.player.x, this.player.y, 10, 0, 0);
    ring.setStrokeStyle(8, 0xff3366);
    ring.setDepth(15);
    
    this.tweens.add({
      targets: ring,
      radius: radius,
      alpha: 0,
      duration: 400,
      ease: 'Quad.easeOut',
      onComplete: () => ring.destroy(),
    });
    
    // Second ring
    const ring2 = this.add.circle(this.player.x, this.player.y, 10, 0, 0);
    ring2.setStrokeStyle(4, 0xff6699);
    ring2.setDepth(15);
    
    this.tweens.add({
      targets: ring2,
      radius: radius * 0.7,
      alpha: 0,
      duration: 350,
      delay: 50,
      ease: 'Quad.easeOut',
      onComplete: () => ring2.destroy(),
    });
  }
  
  private createBossPhaseEffect(boss: EnemySprite): void {
    const wave = this.add.circle(boss.x, boss.y, 10, boss.isBoss ? 0xff0000 : 0xff6666, 0.5);
    wave.setDepth(15);
    
    this.tweens.add({
      targets: wave,
      radius: 150,
      alpha: 0,
      duration: 500,
      onComplete: () => wave.destroy(),
    });
    
    this.addScreenShake(0.3);
  }
  
  private createDamageNumber(x: number, y: number, damage: number, isCrit: boolean): void {
    const text = this.add.text(x, y, String(damage), {
      fontSize: isCrit ? '24px' : '16px',
      fontFamily: 'Arial Black',
      color: isCrit ? '#ffff00' : '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    });
    text.setOrigin(0.5);
    text.setDepth(20);
    this.damageNumberCount++;
    
    this.tweens.add({
      targets: text,
      y: y - 40,
      alpha: 0,
      duration: 600,
      ease: 'Quad.easeOut',
      onComplete: () => {
        this.damageNumberCount = Math.max(0, this.damageNumberCount - 1);
        text.destroy();
      },
    });
  }
  
  private addScreenShake(intensity: number): void {
    if (!this.settings.screenShake || this.settings.reducedMotion) return;
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
  }
  
  private emitState(): void {
    this.events.emit('stateUpdate', {
      health: this.runState.health,
      maxHealth: this.runState.maxHealth,
      xp: this.runState.xp,
      xpToLevel: this.runState.xpToLevel,
      level: this.runState.level,
      inGameTime: this.runState.inGameTime,
      kills: this.runState.kills,
      hype: this.runState.hype,
      isPaused: this.runState.isPaused,
    });
  }
  
  togglePause(): void {
    if (this.runEnded || this.runState.isLevelingUp) return;
    this.runState.isPaused = !this.runState.isPaused;
    this.events.emit('pauseToggle', this.runState.isPaused);
    
    if (this.runState.isPaused) {
      this.physics.pause();
    } else {
      this.physics.resume();
    }
  }
  
  setJoystickInput(x: number, y: number): void {
    const sens = this.settings.touchSensitivity || 1;
    this.joystickInput = { x: x * sens, y: y * sens };
  }
  
  private victory(): void {
    this.endRun(true);
  }
  
  private gameOver(): void {
    this.endRun(false);
    audioService.play('death');
  }
  
  private endRun(victory: boolean): void {
    if (this.runEnded) return;
    this.runEnded = true;
    this.physics.pause();
    
    // Calculate clout earned
    const cloutMultiplier = this.getStatMultiplier('cloutBonus');
    const totalClout = calculateClout({
      inGameMinutes: this.runState.inGameTime,
      kills: this.runState.kills,
      bosses: this.runState.bossesDefeated,
      victory,
      cloutMultiplier,
    });
    
    // Update save before achievement checks so lifetime totals are current
    saveService.addClout(totalClout);
    saveService.addToStats('totalKills', this.runState.kills);
    saveService.addToStats('totalDamage', this.runState.damageDealt);
    saveService.addToStats('totalXP', Math.floor(this.runXp));
    saveService.updateStats({ longestSurvival: this.runState.gameTime });
    if (victory) saveService.addToStats('victories', 1);

    const stats = saveService.getStats();
    const unlockedNow = newlyMetAchievements(
      saveService.getUnlockedAchievements(),
      {
        totalRuns: stats.totalRuns,
        longestSurvival: stats.longestSurvival,
        runSeconds: this.runState.gameTime,
        inGameMinutes: this.runState.inGameTime,
        lifetimeBosses: stats.bossesDefeated,
        runBosses: this.runState.bossesDefeated,
        evolutions: stats.weaponEvolutions,
        runKills: this.runState.kills,
        runLevel: this.runState.level,
        victory,
        runXp: this.runXp,
        flawlessBoss: this.flawlessBoss,
        reachedMaxWeapon: this.reachedMaxWeapon,
      },
      ACHIEVEMENTS.map((a) => a.id),
    );
    for (const id of unlockedNow) {
      saveService.unlockAchievement(id);
      const achievement = ACHIEVEMENTS.find((a) => a.id === id);
      if (achievement?.reward?.type === 'character') {
        saveService.unlockCharacter(achievement.reward.id);
      }
      if (achievement?.reward?.type === 'clout') {
        saveService.addClout(Number(achievement.reward.id) || 0);
      }
    }
    
    // Emit results
    this.events.emit('runEnd', {
      victory,
      time: this.runState.gameTime,
      inGameTime: this.runState.inGameTime,
      level: this.runState.level,
      kills: this.runState.kills,
      damageDealt: this.runState.damageDealt,
      elitesDefeated: this.runState.elitesDefeated,
      bossesDefeated: this.runState.bossesDefeated,
      cloutEarned: totalClout,
      achievements: unlockedNow,
    });
  }
  
  quitToMenu(): void {
    this.scene.stop('UIScene');
    this.scene.start('MenuScene');
  }
  
  // Debug functions
  private setupDebug(): void {
    // Press F1 to toggle debug
  }
  
  private toggleDebug(): void {
    this.debugMode = !this.debugMode;
    this.events.emit('debugToggle', this.debugMode);
  }
  
  debugGiveXP(amount: number): void {
    this.addXP(amount);
  }
  
  debugSpawnEnemy(): void {
    this.spawnEnemy();
  }
  
  debugSpawnElite(): void {
    const enemies = getSpawnableEnemies(this.runState.inGameTime);
    if (enemies.length > 0) {
      const enemy = this.rng.pick(enemies);
      this.createEnemy(enemy.id, this.player.x + 100, this.player.y, true);
    }
  }
  
  debugSpawnBoss(): void {
    const boss = BOSSES[Math.min(this.runState.bossesDefeated, BOSSES.length - 1)];
    if (boss) this.spawnBoss(boss.id);
  }
  
  debugAddWeapon(weaponId: string): void {
    if (!this.runState.weapons.has(weaponId)) {
      this.runState.weapons.set(weaponId, 1);
      const weapon = getWeapon(weaponId);
      if (weapon?.category === 'orbital') this.updateOrbitals();
    }
  }
  
  debugEvolveWeapon(): void {
    for (const [weaponId, _level] of this.runState.weapons) {
      const weapon = getWeapon(weaponId);
      if (weapon?.evolutionId && weapon.evolutionRequires) {
        this.runState.passives.set(weapon.evolutionRequires, 1);
        this.runState.weapons.set(weaponId, weapon.maxLevel);
      }
    }
  }
  
  debugToggleInvincible(): void {
    this.invulnerable = !this.invulnerable;
    if (this.invulnerable) {
      this.invulnerableUntil = Infinity;
      this.player.setTint(0x00ff00);
    } else {
      this.player.clearTint();
    }
  }
  
  debugAdvanceTime(minutes: number): void {
    this.runState.inGameTime += minutes;
  }
  
  debugAddClout(amount: number): void {
    saveService.addClout(amount);
  }
}
