import Phaser from 'phaser';
import { getWeapon } from '../../data/weapons';
import { getUpgrade, ACHIEVEMENTS } from '../../data/upgrades';
import { formatClock } from '../balance/formulas';
import { GameScene } from './GameScene';

interface GameState {
  health: number;
  maxHealth: number;
  xp: number;
  xpToLevel: number;
  level: number;
  inGameTime: number;
  kills: number;
  hype: number;
  isPaused: boolean;
}

interface UpgradeChoice {
  type: 'weapon' | 'upgrade';
  id: string;
  level: number;
}

interface RunResults {
  victory: boolean;
  time: number;
  inGameTime: number;
  level: number;
  kills: number;
  damageDealt: number;
  elitesDefeated: number;
  bossesDefeated: number;
  cloutEarned: number;
  achievements: string[];
}

export class UIScene extends Phaser.Scene {
  private gameScene!: Phaser.Scene;
  private uiOverlay!: HTMLDivElement;
  
  // HUD elements
  private hud!: HTMLDivElement;
  private healthBarFill!: HTMLDivElement;
  private xpBarFill!: HTMLDivElement;
  private levelDisplay!: HTMLDivElement;
  private timeDisplay!: HTMLDivElement;
  private killsDisplay!: HTMLDivElement;
  
  // Overlays
  private upgradeOverlay!: HTMLDivElement;
  private pauseOverlay!: HTMLDivElement;
  private resultsOverlay!: HTMLDivElement;
  private eventBanner!: HTMLDivElement;
  private bossWarning!: HTMLDivElement;
  private debugPanel!: HTMLDivElement;
  
  // Touch controls
  private joystickContainer!: HTMLDivElement;
  private joystickStick!: HTMLDivElement;
  private joystickActive = false;
  private joystickCenter = { x: 0, y: 0 };
  private choosingUpgrade = false;
  private readonly onUpgradeKey = (event: KeyboardEvent): void => {
    if (!this.choosingUpgrade) return;
    const index = Number(event.key) - 1;
    if (index < 0 || index > 2) return;
    const card = this.upgradeOverlay.querySelectorAll('.upgrade-card')[index] as HTMLElement | undefined;
    card?.click();
  };
  
  constructor() {
    super({ key: 'UIScene' });
  }
  
  create(): void {
    this.gameScene = this.scene.get('GameScene');
    this.uiOverlay = document.getElementById('ui-overlay') as HTMLDivElement;
    
    // Clear any existing UI
    this.uiOverlay.innerHTML = '';
    
    // Create UI elements
    this.createHUD();
    this.createUpgradeOverlay();
    this.createPauseOverlay();
    this.createResultsOverlay();
    this.createEventBanner();
    this.createBossWarning();
    this.createDebugPanel();
    this.createTouchControls();
    
    // Listen to game events
    this.setupEventListeners();
  }
  
  private createHUD(): void {
    this.hud = document.createElement('div');
    this.hud.className = 'hud';
    this.hud.innerHTML = `
      <div class="hud-left">
        <div class="health-bar">
          <div class="health-bar-fill" style="width: 100%"></div>
        </div>
        <div class="xp-bar">
          <div class="xp-bar-fill" style="width: 0%"></div>
        </div>
        <div class="level-display">Level 1</div>
      </div>
      <div class="hud-center">
        <div class="time-display">2:00 AM</div>
      </div>
      <div class="hud-right">
        <div class="stat-display kills-display">Kills: 0</div>
      </div>
    `;
    
    // Pause button
    const pauseBtn = document.createElement('button');
    pauseBtn.className = 'pause-btn';
    pauseBtn.innerHTML = '⏸';
    pauseBtn.addEventListener('click', () => this.togglePause());
    this.hud.appendChild(pauseBtn);
    
    this.uiOverlay.appendChild(this.hud);
    
    // Get references
    this.healthBarFill = this.hud.querySelector('.health-bar-fill') as HTMLDivElement;
    this.xpBarFill = this.hud.querySelector('.xp-bar-fill') as HTMLDivElement;
    this.levelDisplay = this.hud.querySelector('.level-display') as HTMLDivElement;
    this.timeDisplay = this.hud.querySelector('.time-display') as HTMLDivElement;
    this.killsDisplay = this.hud.querySelector('.kills-display') as HTMLDivElement;
  }
  
  private createUpgradeOverlay(): void {
    this.upgradeOverlay = document.createElement('div');
    this.upgradeOverlay.className = 'upgrade-overlay';
    this.upgradeOverlay.innerHTML = `
      <h2 class="upgrade-title">LEVEL UP!</h2>
      <div class="upgrade-cards"></div>
    `;
    this.uiOverlay.appendChild(this.upgradeOverlay);
  }
  
  private createPauseOverlay(): void {
    this.pauseOverlay = document.createElement('div');
    this.pauseOverlay.className = 'pause-overlay';
    this.pauseOverlay.innerHTML = `
      <h2 class="pause-title">PAUSED</h2>
      <div class="menu-buttons">
        <button class="menu-btn primary" id="btn-resume">RESUME</button>
        <button class="menu-btn secondary" id="btn-quit">QUIT RUN</button>
      </div>
    `;
    
    this.pauseOverlay.querySelector('#btn-resume')?.addEventListener('click', () => this.togglePause());
    this.pauseOverlay.querySelector('#btn-quit')?.addEventListener('click', () => this.quitRun());
    
    this.uiOverlay.appendChild(this.pauseOverlay);
  }
  
  private createResultsOverlay(): void {
    this.resultsOverlay = document.createElement('div');
    this.resultsOverlay.className = 'results-overlay';
    this.uiOverlay.appendChild(this.resultsOverlay);
  }
  
  private createEventBanner(): void {
    this.eventBanner = document.createElement('div');
    this.eventBanner.className = 'event-banner';
    this.uiOverlay.appendChild(this.eventBanner);
  }
  
  private createBossWarning(): void {
    this.bossWarning = document.createElement('div');
    this.bossWarning.className = 'boss-warning';
    this.uiOverlay.appendChild(this.bossWarning);
  }
  
  private createDebugPanel(): void {
    this.debugPanel = document.createElement('div');
    this.debugPanel.className = 'debug-panel';
    this.debugPanel.innerHTML = `
      <h3>Debug (F1)</h3>
      <button id="debug-xp">+100 XP</button>
      <button id="debug-level">Level Up</button>
      <button id="debug-enemy">Spawn Enemy</button>
      <button id="debug-elite">Spawn Elite</button>
      <button id="debug-boss">Spawn Boss</button>
      <button id="debug-invincible">Toggle Invincible</button>
      <button id="debug-time">+30 min</button>
      <button id="debug-clout">+100 Clout</button>
      <button id="debug-evolve">Setup Evolution</button>
    `;
    
    const game = this.gameScene as GameScene;
    this.debugPanel.querySelector('#debug-xp')?.addEventListener('click', () => game.debugGiveXP(100));
    this.debugPanel.querySelector('#debug-level')?.addEventListener('click', () => game.debugGiveXP(1000));
    this.debugPanel.querySelector('#debug-enemy')?.addEventListener('click', () => game.debugSpawnEnemy());
    this.debugPanel.querySelector('#debug-elite')?.addEventListener('click', () => game.debugSpawnElite());
    this.debugPanel.querySelector('#debug-boss')?.addEventListener('click', () => game.debugSpawnBoss());
    this.debugPanel.querySelector('#debug-invincible')?.addEventListener('click', () => game.debugToggleInvincible());
    this.debugPanel.querySelector('#debug-time')?.addEventListener('click', () => game.debugAdvanceTime(30));
    this.debugPanel.querySelector('#debug-clout')?.addEventListener('click', () => game.debugAddClout(100));
    this.debugPanel.querySelector('#debug-evolve')?.addEventListener('click', () => game.debugEvolveWeapon());
    
    this.uiOverlay.appendChild(this.debugPanel);
  }
  
  private createTouchControls(): void {
    this.joystickContainer = document.createElement('div');
    this.joystickContainer.className = 'joystick-container';
    this.joystickContainer.innerHTML = `
      <div class="joystick-base"></div>
      <div class="joystick-stick"></div>
    `;
    
    this.uiOverlay.appendChild(this.joystickContainer);
    this.joystickStick = this.joystickContainer.querySelector('.joystick-stick') as HTMLDivElement;
    
    // Touch events
    this.joystickContainer.addEventListener('touchstart', (e) => this.onJoystickStart(e));
    this.joystickContainer.addEventListener('touchmove', (e) => this.onJoystickMove(e));
    this.joystickContainer.addEventListener('touchend', () => this.onJoystickEnd());
    this.joystickContainer.addEventListener('touchcancel', () => this.onJoystickEnd());
  }
  
  private onJoystickStart(e: TouchEvent): void {
    e.preventDefault();
    this.joystickActive = true;
    const rect = this.joystickContainer.getBoundingClientRect();
    this.joystickCenter = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
    this.onJoystickMove(e);
  }
  
  private onJoystickMove(e: TouchEvent): void {
    if (!this.joystickActive) return;
    e.preventDefault();
    
    const touch = e.touches[0];
    const dx = touch.clientX - this.joystickCenter.x;
    const dy = touch.clientY - this.joystickCenter.y;
    
    const maxRadius = 35;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const clampedDist = Math.min(dist, maxRadius);
    const angle = Math.atan2(dy, dx);
    
    const stickX = Math.cos(angle) * clampedDist;
    const stickY = Math.sin(angle) * clampedDist;
    
    this.joystickStick.style.transform = `translate(calc(-50% + ${stickX}px), calc(-50% + ${stickY}px))`;
    
    // Send input to game
    const normalizedX = stickX / maxRadius;
    const normalizedY = stickY / maxRadius;
    (this.gameScene as GameScene).setJoystickInput(normalizedX, normalizedY);
  }
  
  private onJoystickEnd(): void {
    this.joystickActive = false;
    this.joystickStick.style.transform = 'translate(-50%, -50%)';
    (this.gameScene as GameScene).setJoystickInput(0, 0);
  }
  
  private setupEventListeners(): void {
    // State updates
    this.gameScene.events.on('stateUpdate', this.onStateUpdate, this);
    
    // Level up
    this.gameScene.events.on('levelUp', this.onLevelUp, this);
    
    // Pause
    this.gameScene.events.on('pauseToggle', this.onPauseToggle, this);
    
    // Run end
    this.gameScene.events.on('runEnd', this.onRunEnd, this);
    
    // Events
    this.gameScene.events.on('eventStart', this.onEventStart, this);
    this.gameScene.events.on('eventEnd', this.onEventEnd, this);
    
    // Boss
    this.gameScene.events.on('bossWarning', this.onBossWarning, this);
    this.gameScene.events.on('bossDefeated', this.onBossDefeated, this);
    
    // Weapon evolved
    this.gameScene.events.on('weaponEvolved', this.onWeaponEvolved, this);
    
    // Debug
    this.gameScene.events.on('debugToggle', this.onDebugToggle, this);
  }
  
  private onStateUpdate(state: GameState): void {
    // Health
    const healthPercent = (state.health / state.maxHealth) * 100;
    this.healthBarFill.style.width = `${healthPercent}%`;
    
    // XP
    const xpPercent = (state.xp / state.xpToLevel) * 100;
    this.xpBarFill.style.width = `${xpPercent}%`;
    
    // Level
    this.levelDisplay.textContent = `Level ${state.level}`;
    
    this.timeDisplay.textContent = formatClock(state.inGameTime);
    
    // Kills
    this.killsDisplay.textContent = `Kills: ${state.kills}`;
  }
  
  private onLevelUp(_level: number, choices: UpgradeChoice[]): void {
    const cardsContainer = this.upgradeOverlay.querySelector('.upgrade-cards') as HTMLDivElement;
    cardsContainer.innerHTML = '';
    
    for (const choice of choices) {
      const card = this.createUpgradeCard(choice);
      cardsContainer.appendChild(card);
    }
    
    this.choosingUpgrade = true;
    this.upgradeOverlay.classList.add('visible');
    window.addEventListener('keydown', this.onUpgradeKey);
  }
  
  private createUpgradeCard(choice: UpgradeChoice): HTMLDivElement {
    const card = document.createElement('div');
    
    if (choice.type === 'weapon') {
      const weapon = getWeapon(choice.id);
      if (!weapon) return card;
      
      card.className = 'upgrade-card weapon';
      card.innerHTML = `
        <div class="upgrade-icon">${weapon.icon}</div>
        <div class="upgrade-name">${weapon.name}</div>
        <div class="upgrade-desc">${weapon.description}</div>
        <div class="upgrade-level">Level ${choice.level}/${weapon.maxLevel}</div>
      `;
    } else {
      const upgrade = getUpgrade(choice.id);
      if (!upgrade) return card;
      
      const categoryClass = upgrade.category;
      card.className = `upgrade-card ${categoryClass}`;
      card.innerHTML = `
        <div class="upgrade-icon">${upgrade.icon}</div>
        <div class="upgrade-name">${upgrade.name}</div>
        <div class="upgrade-desc">${upgrade.description}</div>
        <div class="upgrade-level">Level ${choice.level}/${upgrade.maxLevel}</div>
      `;
    }
    
    card.addEventListener('click', () => this.selectUpgrade(choice));
    
    return card;
  }
  
  private selectUpgrade(choice: UpgradeChoice): void {
    if (!this.choosingUpgrade) return;
    this.choosingUpgrade = false;
    window.removeEventListener('keydown', this.onUpgradeKey);
    this.upgradeOverlay.classList.remove('visible');
    (this.gameScene as GameScene).selectUpgrade(choice.type, choice.id, choice.level);
  }
  
  private togglePause(): void {
    (this.gameScene as GameScene).togglePause();
  }
  
  private onPauseToggle(isPaused: boolean): void {
    if (isPaused) {
      this.pauseOverlay.classList.add('visible');
    } else {
      this.pauseOverlay.classList.remove('visible');
    }
  }
  
  private quitRun(): void {
    this.pauseOverlay.classList.remove('visible');
    (this.gameScene as GameScene).quitToMenu();
  }
  
  private onRunEnd(results: RunResults): void {
    const formatTime = (seconds: number): string => {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    };
    
    const formatGameTime = (minutes: number): string => {
      const hours = Math.floor(minutes / 60) + 2;
      const mins = Math.floor(minutes % 60);
      return `${hours}:${mins.toString().padStart(2, '0')} AM`;
    };
    
    this.resultsOverlay.innerHTML = `
      <h2 class="results-title ${results.victory ? 'victory' : 'defeat'}">
        ${results.victory ? 'LAST CALL!' : 'GAME OVER'}
      </h2>
      <div class="results-time">
        Survived until ${formatGameTime(results.inGameTime)}<br>
        <small>(${formatTime(results.time)} real time)</small>
      </div>
      <div class="results-stats">
        <div class="results-stat">
          <div class="results-stat-value">${results.level}</div>
          <div class="results-stat-label">Level</div>
        </div>
        <div class="results-stat">
          <div class="results-stat-value">${results.kills}</div>
          <div class="results-stat-label">Enemies</div>
        </div>
        <div class="results-stat">
          <div class="results-stat-value">${Math.floor(results.damageDealt)}</div>
          <div class="results-stat-label">Damage</div>
        </div>
        <div class="results-stat">
          <div class="results-stat-value">${results.elitesDefeated}</div>
          <div class="results-stat-label">Elites</div>
        </div>
        <div class="results-stat">
          <div class="results-stat-value">${results.bossesDefeated}</div>
          <div class="results-stat-label">Bosses</div>
        </div>
      </div>
      <div class="results-clout">
        +<span>${results.cloutEarned}</span> Clout
      </div>
      ${results.achievements.length > 0 ? `
        <div class="results-achievements">
          ${results.achievements.map((id) => {
            const achievement = ACHIEVEMENTS.find((a) => a.id === id);
            return achievement ? `<div>${achievement.icon} ${achievement.name}</div>` : '';
          }).join('')}
        </div>
      ` : ''}
      <div class="menu-buttons">
        <button class="menu-btn primary" id="btn-continue">CONTINUE</button>
      </div>
    `;
    
    this.resultsOverlay.querySelector('#btn-continue')?.addEventListener('click', () => {
      this.resultsOverlay.classList.remove('visible');
      (this.gameScene as GameScene).quitToMenu();
    });
    
    this.resultsOverlay.classList.add('visible');
  }
  
  private onEventStart(name: string, description: string): void {
    this.eventBanner.textContent = `${name}: ${description}`;
    this.eventBanner.classList.add('visible');
    
    // Hide after 3 seconds
    setTimeout(() => {
      this.eventBanner.classList.remove('visible');
    }, 3000);
  }
  
  private onEventEnd(): void {
    this.eventBanner.classList.remove('visible');
  }
  
  private onBossWarning(name: string, subtitle: string): void {
    this.bossWarning.innerHTML = `⚠️ ${name}<br><small>${subtitle}</small>`;
    this.bossWarning.classList.add('visible');
    
    setTimeout(() => {
      this.bossWarning.classList.remove('visible');
    }, 3000);
  }
  
  private onBossDefeated(): void {
    this.eventBanner.textContent = 'BOSS DEFEATED!';
    this.eventBanner.classList.add('visible');
    
    setTimeout(() => {
      this.eventBanner.classList.remove('visible');
    }, 3000);
  }
  
  private onWeaponEvolved(weaponName: string): void {
    this.eventBanner.textContent = `✨ ${weaponName} EVOLVED! ✨`;
    this.eventBanner.style.background = 'linear-gradient(135deg, rgba(255,215,0,0.9), rgba(255,165,0,0.9))';
    this.eventBanner.classList.add('visible');
    
    setTimeout(() => {
      this.eventBanner.classList.remove('visible');
      this.eventBanner.style.background = '';
    }, 3000);
  }
  
  private onDebugToggle(enabled: boolean): void {
    if (enabled) {
      this.debugPanel.classList.add('visible');
    } else {
      this.debugPanel.classList.remove('visible');
    }
  }
  
  shutdown(): void {
    this.choosingUpgrade = false;
    window.removeEventListener('keydown', this.onUpgradeKey);
    this.uiOverlay.innerHTML = '';
    this.gameScene.events.off('stateUpdate', this.onStateUpdate, this);
    this.gameScene.events.off('levelUp', this.onLevelUp, this);
    this.gameScene.events.off('pauseToggle', this.onPauseToggle, this);
    this.gameScene.events.off('runEnd', this.onRunEnd, this);
    this.gameScene.events.off('eventStart', this.onEventStart, this);
    this.gameScene.events.off('eventEnd', this.onEventEnd, this);
    this.gameScene.events.off('bossWarning', this.onBossWarning, this);
    this.gameScene.events.off('bossDefeated', this.onBossDefeated, this);
    this.gameScene.events.off('weaponEvolved', this.onWeaponEvolved, this);
    this.gameScene.events.off('debugToggle', this.onDebugToggle, this);
  }
}
