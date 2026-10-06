import Phaser from 'phaser';
import { saveService } from '../../services/SaveService';
import { audioService } from '../../services/AudioService';
import { CHARACTERS, getCharacter, ACHIEVEMENTS } from '../../data/upgrades';
import { PERMANENT_UPGRADES } from '../../data/meta';
import { upgradeCost } from '../balance/formulas';

export class MenuScene extends Phaser.Scene {
  private selectedCharacter: string = 'promoter';
  private menuElement: HTMLDivElement | null = null;
  
  constructor() {
    super({ key: 'MenuScene' });
  }
  
  create(): void {
    // Create animated background
    this.createBackground();
    
    // Create HTML menu
    this.createMenu();
    
    // Handle resize
    this.scale.on('resize', this.handleResize, this);
  }
  
  private createBackground(): void {
    const { width, height } = this.scale;
    
    // Dark gradient background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0a0014, 0x0a0014, 0x1a0028, 0x1a0028, 1);
    bg.fillRect(0, 0, width, height);
    
    // Animated particles
    this.add.particles(0, 0, 'particle', {
      x: { min: 0, max: width },
      y: { min: 0, max: height },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 0.5, end: 0 },
      speed: 20,
      lifespan: 4000,
      frequency: 200,
      tint: [0xff00ff, 0x00ffff, 0xffff00],
    });
    
    // Floating neon lines
    for (let i = 0; i < 5; i++) {
      const line = this.add.graphics();
      line.lineStyle(2, [0xff00ff, 0x00ffff][i % 2], 0.3);
      line.lineBetween(
        Math.random() * width,
        Math.random() * height,
        Math.random() * width,
        Math.random() * height
      );
      
      this.tweens.add({
        targets: line,
        alpha: { from: 0.1, to: 0.5 },
        duration: 2000 + Math.random() * 2000,
        yoyo: true,
        repeat: -1,
      });
    }
  }
  
  private createMenu(): void {
    const overlay = document.getElementById('ui-overlay');
    if (!overlay) return;
    
    const stats = saveService.getStats();
    const clout = saveService.getClout();
    const unlockedChars = saveService.getUnlockedCharacters();
    
    const menu = document.createElement('div');
    menu.className = 'menu-overlay';
    menu.innerHTML = `
      <h1 class="menu-title">LAST CALL</h1>
      <p class="menu-subtitle">Survive until 6 AM</p>
      
      <div class="character-select" id="character-select">
        ${CHARACTERS.map(char => {
          const isUnlocked = unlockedChars.includes(char.id);
          const isSelected = char.id === this.selectedCharacter;
          return `
            <div class="character-card ${isSelected ? 'selected' : ''} ${!isUnlocked ? 'locked' : ''}"
                 data-character="${char.id}"
                 ${!isUnlocked ? 'data-locked="true"' : ''}>
              <div class="character-avatar" style="background: #${char.color.toString(16).padStart(6, '0')}40">
                ${char.avatar}
              </div>
              <div class="character-name">${char.name}</div>
              <div class="character-perk">
                ${isUnlocked ? char.title : `🔒 ${this.lockLabel(char.id)}`}
              </div>
            </div>
          `;
        }).join('')}
      </div>
      
      <div class="menu-buttons">
        <button class="menu-btn primary" id="btn-play">PLAY</button>
        <button class="menu-btn secondary" id="btn-upgrades">UPGRADES</button>
        <button class="menu-btn secondary" id="btn-achievements">ACHIEVEMENTS</button>
        <button class="menu-btn secondary" id="btn-settings">SETTINGS</button>
      </div>
      
      <div class="menu-stats">
        <div class="menu-stat">
          <span class="menu-stat-value">${clout}</span>
          <span>Clout</span>
        </div>
        <div class="menu-stat">
          <span class="menu-stat-value">${stats.totalRuns}</span>
          <span>Runs</span>
        </div>
        <div class="menu-stat">
          <span class="menu-stat-value">${this.formatTime(stats.longestSurvival)}</span>
          <span>Best Time</span>
        </div>
      </div>
    `;
    
    overlay.appendChild(menu);
    this.menuElement = menu;
    
    // Event listeners
    menu.querySelector('#btn-play')?.addEventListener('click', () => this.startGame());
    menu.querySelector('#btn-upgrades')?.addEventListener('click', () => this.showUpgrades());
    menu.querySelector('#btn-achievements')?.addEventListener('click', () => this.showAchievements());
    menu.querySelector('#btn-settings')?.addEventListener('click', () => this.showSettings());
    
    // Character selection
    menu.querySelectorAll('.character-card').forEach(card => {
      card.addEventListener('click', (e) => {
        const el = e.currentTarget as HTMLElement;
        if (el.dataset.locked) {
          this.tryUnlockCharacter(el.dataset.character!);
          return;
        }
        this.selectCharacter(el.dataset.character!);
      });
    });
  }
  
  private selectCharacter(id: string): void {
    audioService.play('select');
    this.selectedCharacter = id;
    
    // Update UI
    this.menuElement?.querySelectorAll('.character-card').forEach(card => {
      const cardEl = card as HTMLElement;
      cardEl.classList.toggle('selected', cardEl.dataset.character === id);
    });
  }
  
  private lockLabel(id: string): string {
    if (id === 'bartender') return 'Survive until 6:00 AM';
    if (id === 'vip') return 'Earn 5,000 lifetime Clout';
    const char = getCharacter(id);
    return `${char?.unlockCost ?? 0} Clout`;
  }
  
  private tryUnlockCharacter(id: string): void {
    const char = getCharacter(id);
    if (!char) return;
    const stats = saveService.getStats();
    
    if (id === 'bartender') {
      if (saveService.isAchievementUnlocked('survive-last-call')) {
        saveService.unlockCharacter(id);
        this.refreshMenu();
        this.selectCharacter(id);
      }
      return;
    }
    
    if (id === 'vip') {
      if (stats.lifetimeClout >= 5000) {
        saveService.unlockCharacter(id);
        this.refreshMenu();
        this.selectCharacter(id);
      }
      return;
    }
    
    if (!char.unlockCost) return;
    const clout = saveService.getClout();
    if (clout >= char.unlockCost) {
      saveService.spendClout(char.unlockCost);
      saveService.unlockCharacter(id);
      audioService.play('select');
      this.refreshMenu();
      this.selectCharacter(id);
    }
  }
  
  private refreshMenu(): void {
    if (this.menuElement) {
      this.menuElement.remove();
    }
    this.createMenu();
  }
  
  private startGame(): void {
    audioService.play('select');
    
    // Hide menu
    if (this.menuElement) {
      this.menuElement.classList.add('hidden');
    }
    
    // Start game with selected character
    this.scene.start('GameScene', { characterId: this.selectedCharacter });
    this.scene.launch('UIScene');
  }
  
  private showUpgrades(): void {
    audioService.play('select');
    if (!this.menuElement) return;
    const clout = saveService.getClout();
    this.menuElement.innerHTML = `
      <h1 class="menu-title" style="font-size:2.4rem">UPGRADES</h1>
      <p class="menu-subtitle">${clout} Clout</p>
      <div class="subpanel">
        ${PERMANENT_UPGRADES.map((upgrade) => {
          const level = saveService.getPermanentUpgradeLevel(upgrade.id);
          const maxed = level >= upgrade.maxLevel;
          const cost = upgradeCost(upgrade.baseCost, level);
          return `
            <div class="upgrade-row">
              <div>
                <strong>${upgrade.name}</strong>
                <div class="character-perk">${upgrade.description} · ${level}/${upgrade.maxLevel}</div>
              </div>
              <button class="menu-btn primary" data-buy="${upgrade.id}" ${maxed ? 'disabled' : ''} style="padding:8px 14px;font-size:0.85rem">
                ${maxed ? 'MAX' : `${cost}`}
              </button>
            </div>
          `;
        }).join('')}
      </div>
      <div class="menu-buttons" style="margin-top:16px">
        <button class="menu-btn secondary" id="btn-back">BACK</button>
      </div>
    `;
    this.menuElement.querySelector('#btn-back')?.addEventListener('click', () => this.refreshMenu());
    this.menuElement.querySelectorAll('[data-buy]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = (btn as HTMLElement).dataset.buy;
        if (!id) return;
        const upgrade = PERMANENT_UPGRADES.find((u) => u.id === id);
        if (!upgrade) return;
        const level = saveService.getPermanentUpgradeLevel(id);
        if (level >= upgrade.maxLevel) return;
        const cost = upgradeCost(upgrade.baseCost, level);
        if (saveService.spendClout(cost)) {
          saveService.upgradePermanent(id);
          audioService.play('select');
          this.showUpgrades();
        }
      });
    });
  }
  
  private showAchievements(): void {
    audioService.play('select');
    if (!this.menuElement) return;
    const unlocked = new Set(saveService.getUnlockedAchievements());
    this.menuElement.innerHTML = `
      <h1 class="menu-title" style="font-size:2.2rem">TROPHIES</h1>
      <div class="subpanel">
        ${ACHIEVEMENTS.map((achievement) => `
          <div class="upgrade-row" style="opacity:${unlocked.has(achievement.id) ? 1 : 0.45}">
            <div>
              <strong>${achievement.icon} ${achievement.name}</strong>
              <div class="character-perk">${achievement.description}</div>
            </div>
            <div>${unlocked.has(achievement.id) ? '✓' : ''}</div>
          </div>
        `).join('')}
      </div>
      <div class="menu-buttons" style="margin-top:16px">
        <button class="menu-btn secondary" id="btn-back">BACK</button>
      </div>
    `;
    this.menuElement.querySelector('#btn-back')?.addEventListener('click', () => this.refreshMenu());
  }
  
  private showSettings(): void {
    audioService.play('select');
    if (!this.menuElement) return;
    const settings = saveService.getSettings();
    this.menuElement.innerHTML = `
      <h1 class="menu-title" style="font-size:2.4rem">SETTINGS</h1>
      <div class="subpanel">
        <label class="setting-row">SFX
          <input id="set-sfx" type="range" min="0" max="100" value="${Math.round(settings.sfxVolume * 100)}">
        </label>
        <label class="setting-row">Music
          <input id="set-music" type="range" min="0" max="100" value="${Math.round(settings.musicVolume * 100)}">
        </label>
        <label class="setting-row">Touch sensitivity
          <input id="set-touch" type="range" min="50" max="150" value="${Math.round(settings.touchSensitivity * 100)}">
        </label>
        <label class="setting-row">Screen shake
          <input id="set-shake" type="checkbox" ${settings.screenShake ? 'checked' : ''}>
        </label>
        <label class="setting-row">Damage numbers
          <input id="set-numbers" type="checkbox" ${settings.damageNumbers ? 'checked' : ''}>
        </label>
        <label class="setting-row">Reduced motion
          <input id="set-motion" type="checkbox" ${settings.reducedMotion ? 'checked' : ''}>
        </label>
      </div>
      <div class="menu-buttons" style="margin-top:16px">
        <button class="menu-btn secondary" id="btn-back">BACK</button>
      </div>
    `;
    const save = () => {
      saveService.updateSettings({
        sfxVolume: Number((this.menuElement?.querySelector('#set-sfx') as HTMLInputElement).value) / 100,
        musicVolume: Number((this.menuElement?.querySelector('#set-music') as HTMLInputElement).value) / 100,
        touchSensitivity: Number((this.menuElement?.querySelector('#set-touch') as HTMLInputElement).value) / 100,
        screenShake: (this.menuElement?.querySelector('#set-shake') as HTMLInputElement).checked,
        damageNumbers: (this.menuElement?.querySelector('#set-numbers') as HTMLInputElement).checked,
        reducedMotion: (this.menuElement?.querySelector('#set-motion') as HTMLInputElement).checked,
      });
      audioService.updateVolumes();
    };
    this.menuElement.querySelectorAll('input').forEach((input) => {
      input.addEventListener('input', save);
      input.addEventListener('change', save);
    });
    this.menuElement.querySelector('#btn-back')?.addEventListener('click', () => this.refreshMenu());
  }
  
  private formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
  
  private handleResize(): void {
    // Recreate background on resize
    this.children.removeAll();
    this.createBackground();
  }
  
  shutdown(): void {
    if (this.menuElement) {
      this.menuElement.remove();
      this.menuElement = null;
    }
    this.scale.off('resize', this.handleResize, this);
  }
}
