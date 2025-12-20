// Laatikoista parhain - Pelilogiikka

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Pelin tila
const GameState = {
    MENU: 'menu',
    FIGHT_INTRO: 'fight_intro',
    PLAYING: 'playing',
    VICTORY: 'victory',
    DEFEAT: 'defeat',
    ROUND_WIN: 'round_win'
};

// Hahmojen määrittelyt
const Characters = {
    lanttu: {
        name: 'Lanttulaatikko',
        color: '#ff9800',
        colorLight: '#ffb74d',
        colorDark: '#e65100',
        speed: 5,
        power: 10,
        maxHp: 100
    },
    peruna: {
        name: 'Perunalaatikko',
        color: '#a1887f',
        colorLight: '#d7ccc8',
        colorDark: '#6d4c41',
        speed: 4,
        power: 14,
        maxHp: 110
    },
    porkkana: {
        name: 'Porkkanalaatikko',
        color: '#e64a19',
        colorLight: '#ff7043',
        colorDark: '#bf360c',
        speed: 7,
        power: 8,
        maxHp: 90
    }
};

// Pelin globaalit muuttujat
let gameState = GameState.MENU;
let player = null;
let opponent = null;
let currentRound = 1;
let playerCharType = null;
let opponents = [];
let snowflakes = [];
let lastTime = 0;

// Lumihiutaleet taustalle
function initSnowflakes() {
    snowflakes = [];
    for (let i = 0; i < 50; i++) {
        snowflakes.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 3 + 1,
            speed: Math.random() * 1 + 0.5,
            drift: Math.random() * 0.5 - 0.25
        });
    }
}

function updateSnowflakes() {
    snowflakes.forEach(flake => {
        flake.y += flake.speed;
        flake.x += flake.drift;
        if (flake.y > canvas.height) {
            flake.y = -5;
            flake.x = Math.random() * canvas.width;
        }
        if (flake.x > canvas.width) flake.x = 0;
        if (flake.x < 0) flake.x = canvas.width;
    });
}

function drawSnowflakes() {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    snowflakes.forEach(flake => {
        ctx.beginPath();
        ctx.arc(flake.x, flake.y, flake.size, 0, Math.PI * 2);
        ctx.fill();
    });
}

// Laatikko-hahmon luokka
class Laatikko {
    constructor(x, charType, isPlayer = true) {
        const char = Characters[charType];
        this.x = x;
        this.y = 350;
        this.width = 80;
        this.height = 60;
        this.charType = charType;
        this.char = char;
        this.isPlayer = isPlayer;

        this.vx = 0;
        this.vy = 0;
        this.grounded = true;
        this.facing = isPlayer ? 1 : -1; // 1 = oikea, -1 = vasen

        this.hp = char.maxHp;
        this.maxHp = char.maxHp;

        // Raajojen tila
        this.leftArm = { angle: 0, punching: false, punchTime: 0 };
        this.rightArm = { angle: 0, punching: false, punchTime: 0 };
        this.blocking = false;

        // Animaatiot
        this.hitFlash = 0;
        this.expression = 'normal'; // normal, hit, happy, angry
        this.expressionTimer = 0;

        // AI-spesifit (vain vastustajille)
        this.aiTimer = 0;
        this.aiAction = null;
        this.difficulty = 1; // 1 = helppo, 2 = vaikea
    }

    update(dt, other) {
        // Painovoima
        if (!this.grounded) {
            this.vy += 0.5;
        }

        // Liike
        this.x += this.vx;
        this.y += this.vy;

        // Maahan törmäys
        const ground = 350;
        if (this.y >= ground) {
            this.y = ground;
            this.vy = 0;
            this.grounded = true;
        }

        // Seiniin törmäys
        if (this.x < 10) this.x = 10;
        if (this.x > canvas.width - this.width - 10) this.x = canvas.width - this.width - 10;

        // Käännytään vastustajaa kohti
        if (other) {
            this.facing = other.x > this.x ? 1 : -1;
        }

        // Lyöntianimaatioiden päivitys
        this.updateArm(this.leftArm, dt);
        this.updateArm(this.rightArm, dt);

        // Osuma-efektin päivitys
        if (this.hitFlash > 0) this.hitFlash -= dt * 5;

        // Ilmeen päivitys
        if (this.expressionTimer > 0) {
            this.expressionTimer -= dt;
            if (this.expressionTimer <= 0) {
                this.expression = 'normal';
            }
        }

        // AI-päivitys
        if (!this.isPlayer && other) {
            this.updateAI(dt, other);
        }
    }

    updateArm(arm, dt) {
        if (arm.punching) {
            arm.punchTime += dt * 10;
            if (arm.punchTime < 0.5) {
                arm.angle = arm.punchTime * Math.PI * 0.8;
            } else if (arm.punchTime < 1) {
                arm.angle = Math.PI * 0.4 - (arm.punchTime - 0.5) * Math.PI * 0.8;
            } else {
                arm.punching = false;
                arm.punchTime = 0;
                arm.angle = 0;
            }
        }
    }

    punch(isLeft) {
        const arm = isLeft ? this.leftArm : this.rightArm;
        if (!arm.punching && !this.blocking) {
            arm.punching = true;
            arm.punchTime = 0;
            SoundManager.playPunch();
            return true;
        }
        return false;
    }

    checkHit(other) {
        if (this.blocking) return false;

        const checkArm = (arm, offsetX) => {
            if (arm.punching && arm.punchTime > 0.2 && arm.punchTime < 0.6) {
                const punchX = this.x + this.width / 2 + this.facing * (40 + Math.sin(arm.angle) * 30);
                const punchY = this.y + 20;

                // Tarkista osuuko vastustajaan
                if (punchX > other.x && punchX < other.x + other.width &&
                    punchY > other.y && punchY < other.y + other.height) {
                    return true;
                }
            }
            return false;
        };

        return checkArm(this.leftArm) || checkArm(this.rightArm);
    }

    takeDamage(amount) {
        if (this.blocking) {
            amount = Math.floor(amount * 0.2);
            SoundManager.playBlock();
        } else {
            SoundManager.playHit();
        }
        this.hp -= amount;
        this.hitFlash = 1;
        this.expression = 'hit';
        this.expressionTimer = 0.3;
        if (this.hp < 0) this.hp = 0;
    }

    updateAI(dt, player) {
        this.aiTimer -= dt;

        if (this.aiTimer <= 0) {
            const distance = Math.abs(this.x - player.x);
            const reactionTime = this.difficulty === 1 ? 0.4 : 0.2;

            // Päätä seuraava toiminto
            if (distance > 150) {
                // Lähesty pelaajaa
                this.aiAction = 'approach';
                this.aiTimer = reactionTime + Math.random() * 0.3;
            } else if (distance < 80) {
                // Lyö tai väistä
                const rand = Math.random();
                if (rand < (this.difficulty === 1 ? 0.4 : 0.6)) {
                    this.aiAction = 'attack';
                } else if (rand < 0.7) {
                    this.aiAction = 'block';
                } else {
                    this.aiAction = 'retreat';
                }
                this.aiTimer = reactionTime + Math.random() * 0.2;
            } else {
                // Keskietäisyys - vaihtele
                const rand = Math.random();
                if (rand < 0.5) {
                    this.aiAction = 'approach';
                } else if (rand < 0.8) {
                    this.aiAction = 'attack';
                } else {
                    this.aiAction = 'block';
                }
                this.aiTimer = reactionTime + Math.random() * 0.3;
            }
        }

        // Suorita toiminto
        this.vx = 0;
        this.blocking = false;

        switch (this.aiAction) {
            case 'approach':
                this.vx = this.facing * this.char.speed * 0.8;
                break;
            case 'retreat':
                this.vx = -this.facing * this.char.speed * 0.6;
                break;
            case 'attack':
                if (Math.random() < 0.5) {
                    this.punch(true);
                } else {
                    this.punch(false);
                }
                break;
            case 'block':
                this.blocking = true;
                break;
        }

        // Vaikeampi AI hyppää joskus
        if (this.difficulty === 2 && Math.random() < 0.01 && this.grounded) {
            this.vy = -12;
            this.grounded = false;
        }
    }

    draw() {
        const x = this.x;
        const y = this.y;

        // Osuma-efekti
        if (this.hitFlash > 0) {
            ctx.fillStyle = `rgba(255, 0, 0, ${this.hitFlash * 0.3})`;
            ctx.fillRect(x - 5, y - 5, this.width + 10, this.height + 10);
        }

        // Laatikon varjo
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(x + this.width / 2, 415, this.width / 2, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        // Puolustusasento-efekti
        if (this.blocking) {
            ctx.strokeStyle = '#4fc3f7';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(x + this.width / 2, y + this.height / 2, 50, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Laatikon runko
        const gradient = ctx.createLinearGradient(x, y, x, y + this.height);
        gradient.addColorStop(0, this.char.colorLight);
        gradient.addColorStop(0.5, this.char.color);
        gradient.addColorStop(1, this.char.colorDark);
        ctx.fillStyle = gradient;

        // Pyöristetty laatikko
        const radius = 10;
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + this.width - radius, y);
        ctx.quadraticCurveTo(x + this.width, y, x + this.width, y + radius);
        ctx.lineTo(x + this.width, y + this.height - radius);
        ctx.quadraticCurveTo(x + this.width, y + this.height, x + this.width - radius, y + this.height);
        ctx.lineTo(x + radius, y + this.height);
        ctx.quadraticCurveTo(x, y + this.height, x, y + this.height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.fill();

        // Reunaviiva
        ctx.strokeStyle = this.char.colorDark;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Piirrä raajat
        this.drawArm(x, y, this.leftArm, -1);
        this.drawArm(x, y, this.rightArm, 1);

        // Kasvot
        this.drawFace(x, y);
    }

    drawArm(x, y, arm, side) {
        const armX = x + this.width / 2 + side * 30;
        const armY = y + 25;
        const armLength = 25;

        // Käännä puoli hahmon suunnan mukaan
        const actualSide = side * this.facing;

        ctx.save();
        ctx.translate(armX, armY);

        // Käden kulma
        let angle = arm.angle * actualSide;
        if (this.blocking) {
            angle = -Math.PI * 0.3 * side; // Kädet eteen puolustaessa
        }

        ctx.rotate(angle);

        // Käsi
        ctx.fillStyle = this.char.colorLight;
        ctx.strokeStyle = this.char.colorDark;
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.ellipse(0, armLength / 2, 8, armLength / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Nyrkki
        ctx.beginPath();
        ctx.arc(0, armLength, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.restore();
    }

    drawFace(x, y) {
        const centerX = x + this.width / 2;
        const eyeY = y + 20;
        const eyeSpacing = 15;

        // Silmät
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.ellipse(centerX - eyeSpacing, eyeY, 8, 10, 0, 0, Math.PI * 2);
        ctx.ellipse(centerX + eyeSpacing, eyeY, 8, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        // Pupillit
        ctx.fillStyle = '#333';
        const pupilOffset = this.facing * 2;
        ctx.beginPath();
        ctx.arc(centerX - eyeSpacing + pupilOffset, eyeY, 4, 0, Math.PI * 2);
        ctx.arc(centerX + eyeSpacing + pupilOffset, eyeY, 4, 0, Math.PI * 2);
        ctx.fill();

        // Suu
        const mouthY = y + 42;
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.beginPath();

        switch (this.expression) {
            case 'hit':
                // Surullinen/kipeä suu
                ctx.arc(centerX, mouthY + 5, 8, Math.PI * 0.2, Math.PI * 0.8);
                break;
            case 'happy':
                // Iloinen suu
                ctx.arc(centerX, mouthY - 5, 10, 0, Math.PI);
                break;
            case 'angry':
                // Vihainen suu
                ctx.moveTo(centerX - 10, mouthY);
                ctx.lineTo(centerX + 10, mouthY);
                break;
            default:
                // Normaali pieni hymy
                ctx.arc(centerX, mouthY - 3, 8, Math.PI * 0.1, Math.PI * 0.9);
        }
        ctx.stroke();

        // Kulmat (vain vihaisena/osuman saaneena)
        if (this.expression === 'hit' || this.expression === 'angry') {
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(centerX - eyeSpacing - 8, eyeY - 12);
            ctx.lineTo(centerX - eyeSpacing + 8, eyeY - 8);
            ctx.moveTo(centerX + eyeSpacing + 8, eyeY - 12);
            ctx.lineTo(centerX + eyeSpacing - 8, eyeY - 8);
            ctx.stroke();
        }
    }
}

// HP-palkin piirto
function drawHPBar(fighter, x, y, width) {
    const height = 20;
    const hpPercent = fighter.hp / fighter.maxHp;

    // Tausta
    ctx.fillStyle = '#333';
    ctx.fillRect(x, y, width, height);

    // HP
    let hpColor;
    if (hpPercent > 0.5) {
        hpColor = '#4caf50';
    } else if (hpPercent > 0.25) {
        hpColor = '#ff9800';
    } else {
        hpColor = '#f44336';
    }
    ctx.fillStyle = hpColor;
    ctx.fillRect(x + 2, y + 2, (width - 4) * hpPercent, height - 4);

    // Reunus
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);

    // Nimi
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = fighter.isPlayer ? 'left' : 'right';
    ctx.fillText(fighter.char.name, fighter.isPlayer ? x : x + width, y - 5);
}

// Tausta
function drawBackground() {
    // Taivas
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#1a237e');
    gradient.addColorStop(0.6, '#283593');
    gradient.addColorStop(1, '#3f51b5');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Lumihiutaleet
    drawSnowflakes();

    // Joulukuusi taustalla
    drawTree(650, 250);
    drawTree(100, 280);

    // Maa
    ctx.fillStyle = '#e8f5e9';
    ctx.fillRect(0, 410, canvas.width, 90);

    // Lumikinos
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 10; i++) {
        ctx.beginPath();
        ctx.ellipse(i * 100 + 50, 420, 60, 20, 0, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawTree(x, y) {
    // Runko
    ctx.fillStyle = '#5d4037';
    ctx.fillRect(x - 10, y + 80, 20, 40);

    // Lehvästö (kolmiot)
    ctx.fillStyle = '#2e7d32';
    for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(x, y - 30 + i * 40);
        ctx.lineTo(x - 40 + i * 5, y + 30 + i * 30);
        ctx.lineTo(x + 40 - i * 5, y + 30 + i * 30);
        ctx.closePath();
        ctx.fill();
    }

    // Koristeet
    ctx.fillStyle = '#f44336';
    ctx.beginPath();
    ctx.arc(x - 15, y + 20, 5, 0, Math.PI * 2);
    ctx.arc(x + 20, y + 50, 5, 0, Math.PI * 2);
    ctx.arc(x - 10, y + 70, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.arc(x + 10, y + 35, 5, 0, Math.PI * 2);
    ctx.arc(x - 20, y + 55, 5, 0, Math.PI * 2);
    ctx.fill();

    // Tähti
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.moveTo(x, y - 40);
    for (let i = 0; i < 5; i++) {
        ctx.lineTo(x + Math.cos((i * 144 - 90) * Math.PI / 180) * 12,
                   y - 40 + Math.sin((i * 144 - 90) * Math.PI / 180) * 12);
        ctx.lineTo(x + Math.cos((i * 144 - 90 + 72) * Math.PI / 180) * 5,
                   y - 40 + Math.sin((i * 144 - 90 + 72) * Math.PI / 180) * 5);
    }
    ctx.closePath();
    ctx.fill();
}

// Näppäimistön tila
const keys = {};
document.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyZ', 'KeyX'].includes(e.code)) {
        e.preventDefault();
    }
});
document.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});

// Pelaajan kontrollit
function handlePlayerInput() {
    if (!player || gameState !== GameState.PLAYING) return;

    player.vx = 0;
    player.blocking = false;

    // Liikkuminen
    if (keys['ArrowLeft']) {
        player.vx = -player.char.speed;
    }
    if (keys['ArrowRight']) {
        player.vx = player.char.speed;
    }

    // Hyppääminen
    if (keys['ArrowUp'] && player.grounded) {
        player.vy = -12;
        player.grounded = false;
    }

    // Puolustus
    if (keys['ArrowDown']) {
        player.blocking = true;
        player.vx = 0; // Ei voi liikkua puolustaessa
    }

    // Lyönnit
    if (keys['KeyZ']) {
        player.punch(true);
        keys['KeyZ'] = false; // Estä jatkuva lyönti
    }
    if (keys['KeyX']) {
        player.punch(false);
        keys['KeyX'] = false;
    }
}

// Taistelun logiikka
function updateFight(dt) {
    handlePlayerInput();

    player.update(dt, opponent);
    opponent.update(dt, player);

    // Tarkista osumat
    if (player.checkHit(opponent)) {
        opponent.takeDamage(player.char.power);
        player.leftArm.punchTime = 1; // Lopeta lyönti
        player.rightArm.punchTime = 1;
    }
    if (opponent.checkHit(player)) {
        player.takeDamage(opponent.char.power);
        opponent.leftArm.punchTime = 1;
        opponent.rightArm.punchTime = 1;
    }

    // Tarkista voittaja
    if (opponent.hp <= 0) {
        if (currentRound < 2) {
            // Seuraava kierros
            gameState = GameState.ROUND_WIN;
            setTimeout(() => startNextRound(), 2000);
        } else {
            // Peli voitettu!
            gameState = GameState.VICTORY;
            document.getElementById('victory').classList.remove('hidden');
            SoundManager.playVictory();
        }
        player.expression = 'happy';
        player.expressionTimer = 5;
    } else if (player.hp <= 0) {
        gameState = GameState.DEFEAT;
        document.getElementById('defeat').classList.remove('hidden');
        SoundManager.playDefeat();
        opponent.expression = 'happy';
        opponent.expressionTimer = 5;
    }
}

// Piirtofunktio
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();

    if (gameState === GameState.PLAYING || gameState === GameState.ROUND_WIN) {
        player.draw();
        opponent.draw();

        // HP-palkit
        drawHPBar(player, 20, 30, 250);
        drawHPBar(opponent, canvas.width - 270, 30, 250);

        // Kierrosnumero
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`Kierros ${currentRound}/2`, canvas.width / 2, 30);

        // Voittoteksti kierroksen välissä
        if (gameState === GameState.ROUND_WIN) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#4caf50';
            ctx.font = 'bold 48px Arial';
            ctx.fillText('Kierros voitettu!', canvas.width / 2, canvas.height / 2);
        }
    }
}

// Pelin pääsilmukka
function gameLoop(timestamp) {
    const dt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    updateSnowflakes();

    if (gameState === GameState.PLAYING) {
        updateFight(dt);
    }

    draw();
    requestAnimationFrame(gameLoop);
}

// Pelin aloitus
function startGame(charType) {
    SoundManager.init();
    playerCharType = charType;

    // Määritä vastustajat
    const allTypes = ['lanttu', 'peruna', 'porkkana'];
    opponents = allTypes.filter(t => t !== charType);

    currentRound = 1;
    startRound();
}

function startRound() {
    player = new Laatikko(100, playerCharType, true);
    opponent = new Laatikko(600, opponents[currentRound - 1], false);
    opponent.difficulty = currentRound; // Toinen kierros vaikeampi

    // Näytä intro
    document.getElementById('menu').classList.add('hidden');
    document.getElementById('fight-intro').classList.remove('hidden');
    document.getElementById('opponent-name').textContent = `VS ${opponent.char.name}`;
    document.getElementById('round-text').textContent = `Kierros ${currentRound}/2`;

    SoundManager.playRoundStart();

    setTimeout(() => {
        document.getElementById('fight-intro').classList.add('hidden');
        gameState = GameState.PLAYING;
    }, 2000);
}

function startNextRound() {
    currentRound++;
    startRound();
}

function resetGame() {
    document.getElementById('victory').classList.add('hidden');
    document.getElementById('defeat').classList.add('hidden');
    document.getElementById('menu').classList.remove('hidden');
    gameState = GameState.MENU;
}

// Valikkotoiminnot
document.querySelectorAll('.char-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const charType = btn.dataset.char;
        startGame(charType);
    });
});

document.getElementById('play-again').addEventListener('click', resetGame);
document.getElementById('try-again').addEventListener('click', resetGame);

// Aloita peli
initSnowflakes();
requestAnimationFrame(gameLoop);
