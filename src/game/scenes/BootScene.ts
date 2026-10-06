import Phaser from 'phaser';
import { saveService } from '../../services/SaveService';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }
  
  preload(): void {
    // Generate procedural textures
    this.createTextures();
  }
  
  create(): void {
    // Initialize save service
    saveService.getStats();
    
    // Hide loading screen
    const loading = document.getElementById('loading');
    if (loading) {
      loading.classList.add('hidden');
      setTimeout(() => loading.remove(), 500);
    }
    
    // Start menu
    this.scene.start('MenuScene');
  }
  
  private createTextures(): void {
    // Player texture
    this.createPlayerTexture();
    
    // Enemy textures
    this.createEnemyTextures();
    
    // Projectile textures
    this.createProjectileTextures();
    
    // Pickup textures
    this.createPickupTextures();
    
    // Effect textures
    this.createEffectTextures();
    
    // Map tiles
    this.createMapTextures();
  }
  
  private createPlayerTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 });
    
    g.fillStyle(0x000000, 0.35);
    g.fillEllipse(20, 36, 22, 8);
    
    g.fillStyle(0x0f172a, 1);
    g.fillRoundedRect(9, 16, 22, 16, 6);
    g.fillStyle(0x22d3ee, 1);
    g.fillRoundedRect(11, 18, 18, 11, 4);
    
    g.fillStyle(0xffd7b5, 1);
    g.fillCircle(20, 13, 7);
    g.fillStyle(0x1e1b4b, 1);
    g.fillEllipse(20, 8, 14, 7);
    
    g.fillStyle(0xffffff, 1);
    g.fillCircle(23, 13, 1.6);
    g.fillStyle(0x111827, 1);
    g.fillCircle(23.6, 13, 0.7);
    
    g.generateTexture('player', 40, 42);
    g.destroy();
  }
  
  private createEnemyTextures(): void {
    const enemyTypes = [
      { id: 'party-crasher', color: 0xff6666, size: 18 },
      { id: 'drunk', color: 0x88ff88, size: 24 },
      { id: 'instigator', color: 0xffaa00, size: 14 },
      { id: 'phone-guy', color: 0x6666ff, size: 16 },
      { id: 'hype-beast', color: 0xff00ff, size: 12 },
      { id: 'bouncer', color: 0x444444, size: 28 },
      { id: 'influencer', color: 0xff88ff, size: 16 },
      { id: 'vip', color: 0xffdd00, size: 26 },
    ];
    
    for (const enemy of enemyTypes) {
      const g = this.make.graphics({ x: 0, y: 0 });
      const s = enemy.size;
      const w = s * 2;
      
      g.fillStyle(0x000000, 0.35);
      g.fillEllipse(s, w - 4, s * 1.1, 6);
      
      g.fillStyle(0x111111, 1);
      g.fillRoundedRect(s - s * 0.55, s * 0.7, s * 1.1, s * 0.9, 5);
      g.fillStyle(enemy.color, 1);
      g.fillRoundedRect(s - s * 0.42, s * 0.78, s * 0.84, s * 0.62, 4);
      
      g.fillStyle(0xffd2b5, 1);
      g.fillCircle(s, s * 0.48, s * 0.38);
      g.fillStyle(0x1a1028, 1);
      g.fillEllipse(s, s * 0.28, s * 0.7, s * 0.32);
      
      g.fillStyle(0x111111, 1);
      g.fillCircle(s - s * 0.14, s * 0.5, Math.max(1.2, s * 0.08));
      g.fillCircle(s + s * 0.14, s * 0.5, Math.max(1.2, s * 0.08));
      
      g.generateTexture(`enemy-${enemy.id}`, w, w);
      g.destroy();
    }
    
    // Elite glow
    const glow = this.make.graphics({ x: 0, y: 0 });
    glow.fillStyle(0xffffff, 0.3);
    glow.fillCircle(32, 32, 30);
    glow.fillStyle(0xffffff, 0.2);
    glow.fillCircle(32, 32, 25);
    glow.generateTexture('elite-glow', 64, 64);
    glow.destroy();
    
    // Boss textures
    this.createBossTextures();
  }
  
  private createBossTextures(): void {
    const bosses = [
      { id: 'bathroom-line-boss', color: 0xff8800, size: 50 },
      { id: 'dj-boss', color: 0xff00ff, size: 60 },
      { id: 'manager-boss', color: 0x4444ff, size: 70 },
      { id: 'sunrise-boss', color: 0xffff00, size: 100 },
    ];
    
    for (const boss of bosses) {
      const g = this.make.graphics({ x: 0, y: 0 });
      const s = boss.size;
      
      // Outer glow
      g.fillStyle(boss.color, 0.3);
      g.fillCircle(s, s, s);
      
      // Body
      g.fillStyle(boss.color, 1);
      g.fillCircle(s, s, s - 10);
      
      // Inner detail
      g.fillStyle(0xffffff, 0.3);
      g.fillCircle(s - s/4, s - s/4, s/4);
      
      // Angry face
      g.fillStyle(0x000000, 1);
      g.fillCircle(s - s/4, s - s/6, s/8);
      g.fillCircle(s + s/4, s - s/6, s/8);
      
      // Frown
      g.lineStyle(s/10, 0x000000, 1);
      g.beginPath();
      g.arc(s, s + s/4, s/3, 0.2 * Math.PI, 0.8 * Math.PI, false);
      g.strokePath();
      
      g.generateTexture(`boss-${boss.id}`, s * 2, s * 2);
      g.destroy();
    }
  }
  
  private createProjectileTextures(): void {
    // Bottle
    const bottle = this.make.graphics({ x: 0, y: 0 });
    bottle.fillStyle(0x00ff88, 1);
    bottle.fillRoundedRect(4, 0, 8, 20, 3);
    bottle.fillStyle(0x00cc66, 1);
    bottle.fillRect(5, 0, 6, 6);
    bottle.generateTexture('projectile-bottle', 16, 24);
    bottle.destroy();
    
    // Sound wave
    const wave = this.make.graphics({ x: 0, y: 0 });
    wave.lineStyle(4, 0xff00ff, 1);
    wave.beginPath();
    wave.arc(0, 20, 15, -0.5, 0.5, false);
    wave.strokePath();
    wave.lineStyle(3, 0xff00ff, 0.7);
    wave.beginPath();
    wave.arc(0, 20, 25, -0.4, 0.4, false);
    wave.strokePath();
    wave.generateTexture('projectile-wave', 40, 40);
    wave.destroy();
    
    // Glow stick
    const stick = this.make.graphics({ x: 0, y: 0 });
    stick.fillStyle(0x00ff00, 1);
    stick.fillRoundedRect(0, 0, 16, 6, 2);
    stick.fillStyle(0x88ff88, 0.5);
    stick.fillCircle(8, 3, 8);
    stick.generateTexture('projectile-glow', 20, 12);
    stick.destroy();
    
    // Disco ball
    const disco = this.make.graphics({ x: 0, y: 0 });
    disco.fillStyle(0xffffff, 1);
    disco.fillCircle(12, 12, 10);
    disco.fillStyle(0xffaaff, 0.5);
    disco.fillCircle(8, 8, 4);
    disco.fillStyle(0xaaffaa, 0.5);
    disco.fillCircle(14, 10, 3);
    disco.fillStyle(0xaaaaff, 0.5);
    disco.fillCircle(10, 14, 3);
    disco.generateTexture('projectile-disco', 24, 24);
    disco.destroy();
    
    // Generic projectile
    const proj = this.make.graphics({ x: 0, y: 0 });
    proj.fillStyle(0xffff00, 1);
    proj.fillCircle(8, 8, 6);
    proj.fillStyle(0xffffff, 0.5);
    proj.fillCircle(6, 6, 3);
    proj.generateTexture('projectile-generic', 16, 16);
    proj.destroy();
    
    // Ice bucket (orbital)
    const bucket = this.make.graphics({ x: 0, y: 0 });
    bucket.fillStyle(0x00ffff, 1);
    bucket.fillRect(2, 4, 20, 16);
    bucket.fillStyle(0x88ffff, 1);
    bucket.fillRect(0, 0, 24, 6);
    bucket.fillStyle(0xffffff, 0.3);
    bucket.fillRect(4, 6, 4, 10);
    bucket.generateTexture('orbital-bucket', 24, 24);
    bucket.destroy();
    
    // Security guard
    const guard = this.make.graphics({ x: 0, y: 0 });
    guard.fillStyle(0x222266, 1);
    guard.fillCircle(16, 16, 14);
    guard.fillStyle(0xffcc99, 1);
    guard.fillCircle(16, 12, 8);
    guard.fillStyle(0x111133, 1);
    guard.fillRect(6, 20, 20, 12);
    guard.generateTexture('ally-security', 32, 36);
    guard.destroy();
  }
  
  private createPickupTextures(): void {
    // XP orb
    const xp = this.make.graphics({ x: 0, y: 0 });
    xp.fillStyle(0x00ffff, 1);
    xp.fillCircle(8, 8, 6);
    xp.fillStyle(0xffffff, 0.7);
    xp.fillCircle(6, 6, 3);
    xp.generateTexture('pickup-xp', 16, 16);
    xp.destroy();
    
    // Health
    const health = this.make.graphics({ x: 0, y: 0 });
    health.fillStyle(0xff3366, 1);
    health.fillCircle(12, 12, 10);
    health.fillStyle(0xffffff, 1);
    health.fillRect(8, 5, 8, 14);
    health.fillRect(5, 8, 14, 8);
    health.generateTexture('pickup-health', 24, 24);
    health.destroy();
    
    // Clout (end of run currency)
    const clout = this.make.graphics({ x: 0, y: 0 });
    clout.fillStyle(0xffff00, 1);
    // Draw a simple star shape manually
    const cx = 12, cy = 12;
    clout.beginPath();
    for (let i = 0; i < 5; i++) {
      const outerAngle = (i * 2 * Math.PI / 5) - Math.PI / 2;
      const innerAngle = outerAngle + Math.PI / 5;
      const ox = cx + Math.cos(outerAngle) * 10;
      const oy = cy + Math.sin(outerAngle) * 10;
      const ix = cx + Math.cos(innerAngle) * 4;
      const iy = cy + Math.sin(innerAngle) * 4;
      if (i === 0) {
        clout.moveTo(ox, oy);
      } else {
        clout.lineTo(ox, oy);
      }
      clout.lineTo(ix, iy);
    }
    clout.closePath();
    clout.fillPath();
    clout.fillStyle(0xffffff, 0.5);
    clout.fillCircle(10, 10, 3);
    clout.generateTexture('pickup-clout', 24, 24);
    clout.destroy();
  }
  
  private createEffectTextures(): void {
    // Particle
    const particle = this.make.graphics({ x: 0, y: 0 });
    particle.fillStyle(0xffffff, 1);
    particle.fillCircle(4, 4, 4);
    particle.generateTexture('particle', 8, 8);
    particle.destroy();
    
    // Hit flash
    const flash = this.make.graphics({ x: 0, y: 0 });
    flash.fillStyle(0xffffff, 0.8);
    flash.fillCircle(16, 16, 16);
    flash.generateTexture('hit-flash', 32, 32);
    flash.destroy();
    
    // AOE indicator
    const aoe = this.make.graphics({ x: 0, y: 0 });
    aoe.lineStyle(3, 0xffffff, 0.5);
    aoe.strokeCircle(50, 50, 48);
    aoe.lineStyle(2, 0xffffff, 0.3);
    aoe.strokeCircle(50, 50, 35);
    aoe.generateTexture('aoe-indicator', 100, 100);
    aoe.destroy();
    
    // Strobe flash
    const strobe = this.make.graphics({ x: 0, y: 0 });
    for (let i = 0; i < 8; i++) {
      const alpha = 0.8 - i * 0.1;
      strobe.fillStyle(0xffff00, alpha);
      strobe.slice(64, 64, 60 - i * 5, i * Math.PI / 4, (i + 1) * Math.PI / 4, false);
      strobe.fillPath();
    }
    strobe.generateTexture('strobe-flash', 128, 128);
    strobe.destroy();
    
    // Bass drop ring
    const bass = this.make.graphics({ x: 0, y: 0 });
    bass.lineStyle(8, 0xff3366, 1);
    bass.strokeCircle(100, 100, 90);
    bass.lineStyle(4, 0xff6699, 0.7);
    bass.strokeCircle(100, 100, 70);
    bass.lineStyle(2, 0xff99aa, 0.5);
    bass.strokeCircle(100, 100, 50);
    bass.generateTexture('bass-ring', 200, 200);
    bass.destroy();
  }
  
  private createMapTextures(): void {
    // Floor tile (dark carpet, no grid)
    const floor = this.make.graphics({ x: 0, y: 0 });
    floor.fillStyle(0x100814, 1);
    floor.fillRect(0, 0, 64, 64);
    floor.fillStyle(0x24102e, 0.7);
    floor.fillCircle(14, 46, 1.4);
    floor.fillCircle(50, 18, 1.1);
    floor.generateTexture('tile-floor', 64, 64);
    floor.destroy();
    
    // Full dance floor, lit tiles rather than an empty grid
    const dance = this.make.graphics({ x: 0, y: 0 });
    const danceColors = [0xd946ef, 0x2563eb, 0x7c3aed, 0x14b8a6];
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        dance.fillStyle(danceColors[(x + y) % danceColors.length], 0.72);
        dance.fillRoundedRect(x * 64 + 3, y * 64 + 3, 58, 58, 8);
        dance.fillStyle(0xffffff, 0.16);
        dance.fillRoundedRect(x * 64 + 8, y * 64 + 8, 24, 8, 3);
      }
    }
    dance.generateTexture('dance-floor', 512, 512);
    dance.destroy();
    
    // VIP carpet
    const vip = this.make.graphics({ x: 0, y: 0 });
    vip.fillStyle(0x2a2110, 1);
    vip.fillRect(0, 0, 64, 64);
    vip.fillStyle(0xc9a227, 0.35);
    vip.fillRect(4, 4, 56, 56);
    vip.fillStyle(0xf5d76e, 0.25);
    vip.fillRect(18, 0, 4, 64);
    vip.generateTexture('tile-vip', 64, 64);
    vip.destroy();
    
    // Bar counter
    const bar = this.make.graphics({ x: 0, y: 0 });
    bar.fillStyle(0x4a3020, 1);
    bar.fillRect(0, 0, 64, 32);
    bar.fillStyle(0x6a4030, 1);
    bar.fillRect(0, 0, 64, 8);
    bar.lineStyle(2, 0x8a6040, 1);
    bar.strokeRect(0, 0, 64, 32);
    bar.generateTexture('bar-counter', 64, 32);
    bar.destroy();
    
    // Wall
    const wall = this.make.graphics({ x: 0, y: 0 });
    wall.fillStyle(0x0a0014, 1);
    wall.fillRect(0, 0, 64, 64);
    wall.lineStyle(2, 0x2a1a3e, 1);
    wall.strokeRect(0, 0, 64, 64);
    wall.generateTexture('tile-wall', 64, 64);
    wall.destroy();
    
    // DJ booth
    const dj = this.make.graphics({ x: 0, y: 0 });
    dj.fillStyle(0x1a1a2e, 1);
    dj.fillRect(0, 0, 128, 64);
    dj.fillStyle(0x333366, 1);
    dj.fillRect(10, 10, 108, 44);
    // Equipment
    dj.fillStyle(0x00ff00, 0.5);
    dj.fillCircle(40, 32, 15);
    dj.fillCircle(88, 32, 15);
    dj.fillStyle(0xff00ff, 0.3);
    dj.fillRect(55, 20, 18, 24);
    dj.generateTexture('dj-booth', 128, 64);
    dj.destroy();
    
    // Speaker
    const speaker = this.make.graphics({ x: 0, y: 0 });
    speaker.fillStyle(0x222222, 1);
    speaker.fillRect(0, 0, 32, 48);
    speaker.fillStyle(0x333333, 1);
    speaker.fillCircle(16, 16, 10);
    speaker.fillCircle(16, 36, 6);
    speaker.lineStyle(2, 0x444444, 1);
    speaker.strokeRect(0, 0, 32, 48);
    speaker.generateTexture('speaker', 32, 48);
    speaker.destroy();
    
    // Table
    const table = this.make.graphics({ x: 0, y: 0 });
    table.fillStyle(0x4a3020, 1);
    table.fillCircle(24, 24, 22);
    table.lineStyle(2, 0x6a4030, 1);
    table.strokeCircle(24, 24, 22);
    table.generateTexture('table', 48, 48);
    table.destroy();
    
    // Neon sign (horizontal)
    const neon = this.make.graphics({ x: 0, y: 0 });
    neon.fillStyle(0xff00ff, 0.3);
    neon.fillRect(0, 0, 128, 24);
    neon.fillStyle(0xff00ff, 1);
    neon.fillRect(4, 4, 120, 16);
    neon.generateTexture('neon-sign', 128, 24);
    neon.destroy();
  }
}
