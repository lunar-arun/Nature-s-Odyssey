// EcoQuest 2D Canvas Game Engine
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// Game state variables
let player = {
    x: 100,
    y: 250,
    width: 24,
    height: 40,
    vx: 0,
    vy: 0,
    speed: 4,
    jumpForce: -10,
    isGrounded: false,
    facing: 'right',
    color: '#22c55e', // default skin color
    skin: 'default',
    pet: '',
    walkFrame: 0,
    isWalking: false
};

let collectibles = [];
let particles = [];
let floatTexts = [];
let keys = {};
let currentStage = "Polluted City";
let scoreCount = 0;
let onCollectCallback = null;

// Background items decoration variables
let backgroundWindmillsAngle = 0;
let smogOffset = 0;
let waterOffset = 0;

// Initialize canvas sizing
function resizeCanvas() {
    // Keep internal coordinate space consistent at 800x400
    canvas.width = 800;
    canvas.height = 400;
}
resizeCanvas();

// Event listeners for keys
window.addEventListener('keydown', (e) => {
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space', ' '].includes(e.key)) {
        // Prevent browser scrolling
        if (document.activeElement.tagName !== 'INPUT') {
            e.preventDefault();
        }
    }
    keys[e.key] = true;
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Setup collectible callback
function registerOnCollect(callback) {
    onCollectCallback = callback;
}

// Set stage
function setGameStage(stage) {
    currentStage = stage;
    // Update visual helper indicators
    document.getElementById('canvas-stage-indicator').innerText = `Stage: ${stage}`;
}

// Set skins/pets
function setGameSkin(skinId) {
    player.skin = skinId;
    if (skinId === 'solar') player.color = '#f1c40f';
    else if (skinId === 'cyber') player.color = '#3498db';
    else if (skinId === 'earth') player.color = '#1abc9c';
    else player.color = '#22c55e'; // default
}

function setGamePet(petId) {
    player.pet = petId;
}

// Particle System
class Particle {
    constructor(x, y, vx, vy, size, color, life, type = 'generic') {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.size = size;
        this.color = color;
        this.life = life;
        this.maxLife = life;
        this.type = type;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
        if (this.type === 'smog') {
            this.vx += (Math.random() - 0.5) * 0.1;
        }
    }
    draw() {
        ctx.save();
        ctx.globalAlpha = this.life / this.maxLife;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// Floating Text System (e.g. "+15 XP")
class FloatText {
    constructor(x, y, text, color) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color;
        this.life = 40; // frames
    }
    update() {
        this.y -= 1.2;
        this.life--;
    }
    draw() {
        ctx.save();
        ctx.globalAlpha = this.life / 40;
        ctx.fillStyle = this.color;
        ctx.font = 'bold 13px Outfit, Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.text, this.x, this.y);
        ctx.restore();
    }
}

// Collectible items spawner
class Collectible {
    constructor() {
        this.x = Math.random() * (canvas.width - 60) + 30;
        this.y = -20;
        this.vy = Math.random() * 1.5 + 1; // falling speed
        this.size = 14;
        this.floatOffset = Math.random() * 100;
        
        // Pick random type
        const rand = Math.random();
        if (rand < 0.35) {
            this.type = "bottle";
            this.name = "Collected plastic bottle";
            this.color = "#3498db";
            this.icon = "🍾";
        } else if (rand < 0.7) {
            this.type = "lightbulb";
            this.name = "Turned off canvas lightbulb";
            this.color = "#f1c40f";
            this.icon = "💡";
        } else {
            this.type = "seed";
            this.name = "Planted canvas seed";
            this.color = "#2ecc71";
            this.icon = "🌱";
        }
    }
    update() {
        this.y += this.vy;
        // Swing left/right slightly
        this.x += Math.sin(this.y / 20 + this.floatOffset) * 0.5;
    }
    draw() {
        ctx.save();
        
        // Draw glow base
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size + 4, 0, Math.PI * 2);
        ctx.fillStyle = this.color + "33"; // transparent color
        ctx.fill();
        
        // Render item emoji/symbol
        ctx.font = '16px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.icon, this.x, this.y);
        
        ctx.restore();
    }
}

// Spawn logic
let spawnTimer = 0;
function handleSpawning() {
    spawnTimer++;
    if (spawnTimer > 180) { // every 3 seconds at 60fps
        collectibles.push(new Collectible());
        spawnTimer = 0;
    }
    
    // Spawn ambient smog particles if stage is polluted city
    if (currentStage === "Polluted City" && Math.random() < 0.15) {
        // Spawn smog rising from smokestacks
        // Smokestack 1 at x=650, Smokestack 2 at x=720
        particles.push(new Particle(660, 200, -0.5 + Math.random(), -1 - Math.random(), Math.random() * 15 + 8, 'rgba(80,80,80,0.3)', 120, 'smog'));
        particles.push(new Particle(730, 180, -0.5 + Math.random(), -1 - Math.random(), Math.random() * 15 + 8, 'rgba(80,80,80,0.3)', 120, 'smog'));
    }
}

// Background Drawing Code
function drawSkyBackground() {
    let grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    
    if (currentStage === "Polluted City") {
        // Grey smoggy sky
        grad.addColorStop(0, '#1e293b');
        grad.addColorStop(0.6, '#334155');
        grad.addColorStop(1, '#475569');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Smog overlay clouds
        ctx.fillStyle = 'rgba(71, 85, 105, 0.4)';
        ctx.beginPath();
        ctx.arc(150 + smogOffset, 80, 50, 0, Math.PI * 2);
        ctx.arc(220 + smogOffset, 80, 70, 0, Math.PI * 2);
        ctx.arc(290 + smogOffset, 80, 50, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(500 + smogOffset * 0.7, 120, 60, 0, Math.PI * 2);
        ctx.arc(580 + smogOffset * 0.7, 120, 80, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw toxic chimneys silhouettes
        ctx.fillStyle = '#0f172a';
        // Chimney 1
        ctx.fillRect(640, 200, 40, 150);
        ctx.fillRect(635, 195, 50, 8);
        // Chimney 2
        ctx.fillRect(710, 180, 40, 170);
        ctx.fillRect(705, 175, 50, 8);
        
        smogOffset = (smogOffset + 0.15) % 800;
        
    } else if (currentStage === "Recovering Forest") {
        // Soft yellow/green twilight
        grad.addColorStop(0, '#1e3a1e');
        grad.addColorStop(0.5, '#4d7c0f');
        grad.addColorStop(1, '#a3e635');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Sun rays drawing
        ctx.save();
        ctx.globalAlpha = 0.15;
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.moveTo(100, 0);
        ctx.lineTo(250, 400);
        ctx.lineTo(350, 400);
        ctx.lineTo(180, 0);
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(400, 0);
        ctx.lineTo(550, 400);
        ctx.lineTo(650, 400);
        ctx.lineTo(480, 0);
        ctx.fill();
        ctx.restore();
        
        // Soft distant forest hills
        ctx.fillStyle = '#064e3b';
        ctx.beginPath();
        ctx.arc(200, 390, 250, Math.PI, 0);
        ctx.arc(600, 390, 300, Math.PI, 0);
        ctx.fill();
        
        // Tiny tree saplings
        ctx.fillStyle = '#22c55e';
        drawSapling(220, 280, 15);
        drawSapling(450, 290, 12);
        drawSapling(610, 270, 18);
        
    } else if (currentStage === "Clean River Valley") {
        // Beautiful bright sky blue
        grad.addColorStop(0, '#0284c7');
        grad.addColorStop(0.7, '#bae6fd');
        grad.addColorStop(1, '#e0f2fe');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Golden Sun
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(100, 70, 35, 0, Math.PI * 2);
        ctx.fill();
        
        // Distant mountains/hills
        ctx.fillStyle = '#166534';
        ctx.beginPath();
        ctx.moveTo(-50, 350);
        ctx.quadraticCurveTo(150, 260, 350, 350);
        ctx.quadraticCurveTo(550, 250, 850, 350);
        ctx.lineTo(850, 350);
        ctx.lineTo(0, 350);
        ctx.fill();
        
        // River flowing in background
        ctx.fillStyle = '#0284c7';
        ctx.beginPath();
        ctx.moveTo(0, 340);
        for (let i = 0; i <= canvas.width; i += 20) {
            ctx.lineTo(i, 340 + Math.sin(i / 40 + waterOffset) * 6);
        }
        ctx.lineTo(canvas.width, 400);
        ctx.lineTo(0, 400);
        ctx.fill();
        
        // Draw clean green pine trees
        ctx.fillStyle = '#14532d';
        drawPineTree(150, 280, 45);
        drawPineTree(550, 290, 50);
        drawPineTree(620, 275, 40);
        
        waterOffset += 0.05;
        
    } else if (currentStage === "Mountain Sanctuary") {
        // Deep sky blue to purple
        grad.addColorStop(0, '#312e81');
        grad.addColorStop(0.6, '#4338ca');
        grad.addColorStop(1, '#e0e7ff');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Snow peaks
        ctx.fillStyle = '#1e1b4b';
        // Peak 1
        ctx.beginPath();
        ctx.moveTo(350, 350);
        ctx.lineTo(500, 150);
        ctx.lineTo(650, 350);
        ctx.fill();
        // Snow cap 1
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(462, 200);
        ctx.lineTo(500, 150);
        ctx.lineTo(538, 200);
        ctx.lineTo(515, 190);
        ctx.lineTo(500, 205);
        ctx.lineTo(485, 190);
        ctx.fill();
        
        // Peak 2
        ctx.fillStyle = '#312e81';
        ctx.beginPath();
        ctx.moveTo(100, 350);
        ctx.lineTo(250, 100);
        ctx.lineTo(400, 350);
        ctx.fill();
        // Snow cap 2
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(220, 150);
        ctx.lineTo(250, 100);
        ctx.lineTo(280, 150);
        ctx.lineTo(265, 140);
        ctx.lineTo(250, 155);
        ctx.lineTo(235, 140);
        ctx.fill();
        
        // Clouds
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.beginPath();
        ctx.arc(600, 120, 25, 0, Math.PI * 2);
        ctx.arc(640, 120, 35, 0, Math.PI * 2);
        ctx.arc(675, 120, 25, 0, Math.PI * 2);
        ctx.fill();
        
    } else { // Sustainable Future City
        // High-tech turquoise sky
        grad.addColorStop(0, '#0f172a');
        grad.addColorStop(0.7, '#0f766e');
        grad.addColorStop(1, '#115e59');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Clean City Skylines
        ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
        ctx.fillRect(80, 150, 60, 200);
        ctx.fillRect(200, 180, 85, 170);
        ctx.fillRect(400, 120, 70, 230);
        ctx.fillRect(520, 210, 50, 140);
        ctx.fillRect(600, 140, 80, 210);
        
        // Draw window glows on skyscrapers
        ctx.fillStyle = '#2dd4bf';
        ctx.globalAlpha = 0.4;
        ctx.fillRect(100, 170, 8, 8);
        ctx.fillRect(100, 190, 8, 8);
        ctx.fillRect(220, 200, 12, 12);
        ctx.fillRect(240, 200, 12, 12);
        ctx.fillRect(420, 150, 10, 10);
        ctx.fillRect(440, 150, 10, 10);
        ctx.fillRect(420, 180, 10, 10);
        ctx.fillRect(620, 160, 10, 20);
        ctx.fillRect(650, 160, 10, 20);
        ctx.globalAlpha = 1.0;
        
        // Draw Windmills in background
        drawWindmill(140, 190, 45);
        drawWindmill(320, 220, 35);
        drawWindmill(640, 180, 50);
        backgroundWindmillsAngle += 0.02;
    }
}

// Tree / windmill helper drawers
function drawSapling(x, y, h) {
    ctx.save();
    ctx.strokeStyle = '#78350f'; // brown trunk
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y - h);
    ctx.stroke();
    
    // Draw leaf
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.ellipse(x + 4, y - h - 3, 6, 3, Math.PI / 4, 0, Math.PI * 2);
    ctx.ellipse(x - 4, y - h - 3, 6, 3, -Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

function drawPineTree(x, y, h) {
    ctx.save();
    // Trunk
    ctx.fillStyle = '#78350f';
    ctx.fillRect(x - 4, y - 15, 8, 15);
    
    // Leaves (triangles)
    ctx.fillStyle = '#15803d';
    ctx.beginPath();
    ctx.moveTo(x, y - h);
    ctx.lineTo(x - 20, y - h/2);
    ctx.lineTo(x + 20, y - h/2);
    ctx.fill();
    
    ctx.fillStyle = '#166534';
    ctx.beginPath();
    ctx.moveTo(x, y - h*0.7);
    ctx.lineTo(x - 25, y - 10);
    ctx.lineTo(x + 25, y - 10);
    ctx.fill();
    ctx.restore();
}

function drawWindmill(x, y, size) {
    ctx.save();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    // Stand
    ctx.beginPath();
    ctx.moveTo(x, y + size);
    ctx.lineTo(x, y);
    ctx.stroke();
    
    // Rotating blades
    ctx.translate(x, y);
    ctx.rotate(backgroundWindmillsAngle);
    ctx.fillStyle = '#f1f5f9';
    for (let i = 0; i < 3; i++) {
        ctx.rotate((Math.PI * 2) / 3);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-4, -size * 0.7);
        ctx.lineTo(4, -size * 0.7);
        ctx.closePath();
        ctx.fill();
    }
    ctx.restore();
}

function drawGround() {
    ctx.save();
    let groundHeight = 50;
    
    // Draw ground base
    if (currentStage === "Polluted City") {
        // Grey polluted concrete/sludge
        ctx.fillStyle = '#2d3748';
        ctx.fillRect(0, canvas.height - groundHeight, canvas.width, groundHeight);
        ctx.fillStyle = '#1a202c';
        ctx.fillRect(0, canvas.height - groundHeight, canvas.width, 6);
        
        // Trash particles on ground
        ctx.fillStyle = '#4a5568';
        ctx.fillRect(80, 360, 10, 5);
        ctx.fillRect(250, 370, 8, 4);
        ctx.fillRect(520, 365, 12, 6);
        
    } else if (currentStage === "Recovering Forest") {
        // Dirt ground with thin grass sprouts
        ctx.fillStyle = '#543d2b';
        ctx.fillRect(0, canvas.height - groundHeight, canvas.width, groundHeight);
        
        // Grass patches
        ctx.fillStyle = '#4d7c0f';
        ctx.fillRect(0, canvas.height - groundHeight, canvas.width, 6);
        for (let i = 20; i < canvas.width; i += 60) {
            ctx.fillRect(i, canvas.height - groundHeight - 4, 15, 4);
        }
        
    } else if (currentStage === "Clean River Valley") {
        // Beautiful vibrant grass green
        ctx.fillStyle = '#15803d';
        ctx.fillRect(0, canvas.height - groundHeight, canvas.width, groundHeight);
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(0, canvas.height - groundHeight, canvas.width, 8);
        
        // Flowers
        ctx.fillStyle = '#f43f5e'; // red
        ctx.beginPath();
        ctx.arc(320, 360, 3, 0, Math.PI * 2);
        ctx.arc(580, 365, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fbbf24'; // yellow
        ctx.beginPath();
        ctx.arc(120, 365, 3, 0, Math.PI * 2);
        ctx.arc(420, 358, 3, 0, Math.PI * 2);
        ctx.fill();
        
    } else if (currentStage === "Mountain Sanctuary") {
        // Dark soil under snow
        ctx.fillStyle = '#3f3f46';
        ctx.fillRect(0, canvas.height - groundHeight, canvas.width, groundHeight);
        // White snow top
        ctx.fillStyle = '#f4f4f5';
        ctx.fillRect(0, canvas.height - groundHeight, canvas.width, 10);
        // Some snow layers
        ctx.beginPath();
        ctx.ellipse(300, 365, 50, 8, 0, 0, Math.PI*2);
        ctx.ellipse(650, 365, 80, 10, 0, 0, Math.PI*2);
        ctx.fill();
        
    } else { // Sustainable Future City
        // Clean futuristic tile pathways
        ctx.fillStyle = '#0f766e';
        ctx.fillRect(0, canvas.height - groundHeight, canvas.width, groundHeight);
        ctx.fillStyle = '#38bdf8'; // neon blue clean line
        ctx.fillRect(0, canvas.height - groundHeight, canvas.width, 5);
        
        // Solar charging pathway pattern
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
        ctx.lineWidth = 1;
        for (let i = 20; i < canvas.width; i += 40) {
            ctx.strokeRect(i, 365, 20, 20);
        }
    }
    
    ctx.restore();
}

// Player update and physics
function updatePlayer() {
    // Movement inputs
    player.isWalking = false;
    if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
        player.vx = -player.speed;
        player.facing = 'left';
        player.isWalking = true;
    } else if (keys['ArrowRight'] || keys['d'] || keys['D']) {
        player.vx = player.speed;
        player.facing = 'right';
        player.isWalking = true;
    } else {
        player.vx = 0;
    }

    // Jump
    if ((keys[' '] || keys['ArrowUp'] || keys['Spacebar']) && player.isGrounded) {
        player.vy = player.jumpForce;
        player.isGrounded = false;
        // Play a short synth jumping sound via AudioContext
        playJumpSound();
    }

    // Apply gravity
    player.vy += 0.5; // gravity constant
    
    // Update velocities
    player.x += player.vx;
    player.y += player.vy;

    // Boundary Collisions (Canvas walls)
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;

    // Ground Collision
    let groundY = canvas.height - 50; // ground height is 50
    if (player.y + player.height > groundY) {
        player.y = groundY - player.height;
        player.vy = 0;
        player.isGrounded = true;
    }
    
    // Animate walk frame
    if (player.isWalking) {
        player.walkFrame = (player.walkFrame + 0.15) % 4;
    } else {
        player.walkFrame = 0;
    }
}

// Drawing player character and accessories
function drawPlayer() {
    ctx.save();
    ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
    
    // Flip canvas based on direction facing
    if (player.facing === 'left') {
        ctx.scale(-1, 1);
    }

    // DRAW COMPANION PET (if equipped)
    if (player.pet) {
        ctx.save();
        // Hovering bobbing position behind player
        let bobY = Math.sin(Date.now() / 200) * 4 - 20;
        ctx.translate(-24, bobY);
        
        ctx.font = '20px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        let petEmoji = "🦊";
        if (player.pet === 'sparky') petEmoji = "⚡";
        else if (player.pet === 'bubbles') petEmoji = "🦦";
        ctx.fillText(petEmoji, 0, 0);
        
        // Spawn small sparks or trail for pet
        if (Math.random() < 0.1) {
            let pColor = player.pet === 'sparky' ? '#f1c40f' : (player.pet === 'bubbles' ? '#60a5fa' : '#4ade80');
            particles.push(new Particle(player.x - 12, player.y + 20 + bobY, -1, (Math.random() - 0.5), Math.random() * 3 + 1, pColor, 30));
        }
        ctx.restore();
    }

    // DRAW SKIN ACCESSORIES / CAPES
    if (player.skin === 'solar') {
        // Yellow solar circle cape
        ctx.fillStyle = 'rgba(241, 196, 15, 0.4)';
        ctx.beginPath();
        ctx.arc(-8, 5, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#f1c40f';
        ctx.lineWidth = 1.5;
        ctx.stroke();
    } else if (player.skin === 'cyber') {
        // Cyber glowing blue jetpack/cape
        ctx.fillStyle = '#3498db';
        ctx.fillRect(-12, -5, 6, 20);
        // Small thruster particle
        if (Math.random() < 0.2) {
            particles.push(new Particle(player.x - 4, player.y + player.height - 10, -0.5, 2, 2, '#38bdf8', 20));
        }
    } else if (player.skin === 'earth') {
        // Leafy green cape
        ctx.fillStyle = '#16a34a';
        ctx.beginPath();
        ctx.moveTo(-4, -5);
        ctx.lineTo(-15, 25);
        ctx.lineTo(2, 20);
        ctx.closePath();
        ctx.fill();
    }

    // Core body (rounded rect)
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.roundRect(-player.width / 2, -player.height / 2, player.width, player.height - 8, 6);
    ctx.fill();
    ctx.strokeStyle = '#064e3b';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Visor/Eyes
    if (player.skin === 'cyber') {
        ctx.fillStyle = '#00ffff'; // cyan cyber visor
        ctx.fillRect(0, -12, 10, 6);
    } else {
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(4, -10, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(5, -11, 1.5, 0, Math.PI * 2);
        ctx.fill();
    }

    // Crown/Hat accessory
    if (player.skin === 'earth') {
        // Green leaf crown
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.moveTo(-10, -22);
        ctx.lineTo(-5, -28);
        ctx.lineTo(0, -22);
        ctx.lineTo(5, -28);
        ctx.lineTo(10, -22);
        ctx.closePath();
        ctx.fill();
    } else if (player.skin === 'solar') {
        // Golden headband
        ctx.fillStyle = '#f1c40f';
        ctx.fillRect(-player.width / 2, -18, player.width, 3);
    }

    // Legs animation
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 3;
    let groundOffset = player.height / 2;
    let step = Math.sin(player.walkFrame * Math.PI / 2) * 8;
    
    if (player.isWalking && player.isGrounded) {
        // Leg 1
        ctx.beginPath();
        ctx.moveTo(-5, groundOffset - 8);
        ctx.lineTo(-5 + step, groundOffset);
        ctx.stroke();
        // Leg 2
        ctx.beginPath();
        ctx.moveTo(5, groundOffset - 8);
        ctx.lineTo(5 - step, groundOffset);
        ctx.stroke();
    } else {
        // Standing legs
        ctx.beginPath();
        ctx.moveTo(-5, groundOffset - 8);
        ctx.lineTo(-5, groundOffset);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(5, groundOffset - 8);
        ctx.lineTo(5, groundOffset);
        ctx.stroke();
    }

    ctx.restore();
}

// Collisions with collectibles
function checkCollisions() {
    for (let i = collectibles.length - 1; i >= 0; i--) {
        let item = collectibles[i];
        
        // Bounding box collision
        if (player.x < item.x + item.size &&
            player.x + player.width > item.x - item.size &&
            player.y < item.y + item.size &&
            player.y + player.height > item.y - item.size) {
            
            // Collision detected!
            scoreCount++;
            document.getElementById('canvas-score-indicator').innerText = `Caught: ${scoreCount} items`;
            
            // Spawn splash particles
            for (let j = 0; j < 8; j++) {
                particles.push(new Particle(
                    item.x, 
                    item.y, 
                    (Math.random() - 0.5) * 4, 
                    (Math.random() - 0.5) * 4, 
                    Math.random() * 4 + 2, 
                    item.color, 
                    40
                ));
            }
            
            // Trigger floating text (XP/Coins)
            let txt = "+15 XP";
            if (item.type === "seed") txt = "+30 XP";
            else if (item.type === "lightbulb") txt = "+20 XP";
            
            floatTexts.push(new FloatText(item.x, item.y - 10, txt, item.color));
            
            // Play pick sound
            playCoinSound();
            
            // Call logging API via callback
            if (onCollectCallback) {
                onCollectCallback(item.name);
            }
            
            // Remove item
            collectibles.splice(i, 1);
        }
    }
}

// Sounds using Web Audio API (No files needed)
let audioCtx = null;
function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function playCoinSound() {
    initAudio();
    if (!audioCtx) return;
    try {
        let osc = audioCtx.createOscillator();
        let gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.08); // A5
        
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
        
        osc.start();
        osc.stop(audioCtx.currentTime + 0.25);
    } catch(e) {}
}

function playJumpSound() {
    initAudio();
    if (!audioCtx) return;
    try {
        let osc = audioCtx.createOscillator();
        let gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(400, audioCtx.currentTime + 0.15);
        
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
        
        osc.start();
        osc.stop(audioCtx.currentTime + 0.15);
    } catch(e) {}
}

// Game Loop
function gameLoop() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background
    drawSkyBackground();
    
    // Spawning items
    handleSpawning();
    
    // Update items and particles
    updatePlayer();
    
    collectibles.forEach((c, index) => {
        c.update();
        c.draw();
        // Remove offscreen items
        if (c.y > canvas.height + 20) {
            collectibles.splice(index, 1);
        }
    });
    
    particles.forEach((p, index) => {
        p.update();
        p.draw();
        if (p.life <= 0) {
            particles.splice(index, 1);
        }
    });

    floatTexts.forEach((ft, index) => {
        ft.update();
        ft.draw();
        if (ft.life <= 0) {
            floatTexts.splice(index, 1);
        }
    });

    // Check collisions
    checkCollisions();
    
    // Draw assets
    drawGround();
    drawPlayer();
    
    requestAnimationFrame(gameLoop);
}

// Start game loop
gameLoop();
