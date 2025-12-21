// Laatikoista parhain - Pelilogiikka

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Pelin tila
const GameState = {
    MENU: 'menu',
    CHAR_CONFIRM: 'char_confirm',
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
        speed: 3,
        power: 14,
        maxHp: 100,
        jumpHeight: 9, // Matala hyppy
        description: 'Perinteinen joulupöydän kunkku. Lanttulaatikko iskee kovaa ja armotta - hitaudestaan huolimatta tämä oranssinen mötkö on pelätty vastustaja.'
    },
    peruna: {
        name: 'Perunalaatikko',
        color: '#a1887f',
        colorLight: '#d7ccc8',
        colorDark: '#6d4c41',
        speed: 5,
        power: 10,
        maxHp: 120,
        jumpHeight: 12, // Keskitason hyppy
        description: 'Joulupöydän sitkeä sotilas. Perunalaatikko kestää iskuja kuin mikä ja jaksaa taistella pitkään. Tasapainoinen ja luotettava valinta.'
    },
    porkkana: {
        name: 'Porkkanalaatikko',
        color: '#e64a19',
        colorLight: '#ff7043',
        colorDark: '#bf360c',
        speed: 7,
        power: 8,
        maxHp: 90,
        jumpHeight: 15, // Korkea hyppy
        description: 'Salamannopea makea taistelija. Porkkanalaatikko väistelee ja iskee ennen kuin vastustaja ehtii reagoida. Nopeus on valttia!'
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

// Mehevyys-palkin piirto
function drawStaminaBar(fighter, x, y, width) {
    const height = 10;
    const staminaPercent = fighter.stamina / fighter.maxStamina;

    // Tausta
    ctx.fillStyle = '#333';
    ctx.fillRect(x, y, width, height);

    // Mehevyys - keltainen/oranssi gradient
    let staminaColor;
    if (staminaPercent > 0.5) {
        staminaColor = '#ffeb3b'; // Keltainen
    } else if (staminaPercent > 0.25) {
        staminaColor = '#ffc107'; // Oranssi-keltainen
    } else {
        staminaColor = '#ff5722'; // Oranssi-punainen
    }
    ctx.fillStyle = staminaColor;
    ctx.fillRect(x + 1, y + 1, (width - 2) * staminaPercent, height - 2);

    // Reunus
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, width, height);

    // Teksti
    ctx.fillStyle = '#fff';
    ctx.font = '10px Arial';
    ctx.textAlign = fighter.isPlayer ? 'left' : 'right';
    ctx.fillText('Mehevyys', fighter.isPlayer ? x : x + width, y + height + 12);
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

// Menu-navigaatio
let selectedCharIndex = 0;
const charTypes = ['lanttu', 'peruna', 'porkkana'];

function updateMenuSelection() {
    document.querySelectorAll('.char-btn').forEach((btn, index) => {
        if (index === selectedCharIndex) {
            btn.classList.add('selected');
        } else {
            btn.classList.remove('selected');
        }
    });
}

// Näytä vahvistusikkuna valitulle hahmolle
let confirmCooldown = false;
let confirmButtonIndex = 1; // 0 = Takaisin, 1 = Valitse

function updateConfirmButtons() {
    const backBtn = document.getElementById('confirm-back');
    const selectBtn = document.getElementById('confirm-select');

    if (confirmButtonIndex === 0) {
        backBtn.classList.add('selected');
        selectBtn.classList.remove('selected');
    } else {
        backBtn.classList.remove('selected');
        selectBtn.classList.add('selected');
    }
}

function showCharConfirm(charType) {
    const char = Characters[charType];

    // Piirrä preview-kuva
    drawCharacterPreview('confirm-preview-canvas', charType, 1.5);

    // Päivitä nimi ja kuvaus
    document.getElementById('confirm-name').textContent = char.name;
    document.getElementById('confirm-desc').textContent = char.description;

    // Päivitä ominaisuuspalkit - lasketaan maksimit dynaamisesti
    const allChars = Object.values(Characters);
    const maxPower = Math.max(...allChars.map(c => c.power));
    const maxSpeed = Math.max(...allChars.map(c => c.speed));
    const maxJump = Math.max(...allChars.map(c => c.jumpHeight));
    const maxHp = Math.max(...allChars.map(c => c.maxHp));

    const powerPercent = (char.power / maxPower) * 100;
    const speedPercent = (char.speed / maxSpeed) * 100;
    const jumpPercent = (char.jumpHeight / maxJump) * 100;
    const hpPercent = (char.maxHp / maxHp) * 100;

    document.getElementById('stat-power').style.width = powerPercent + '%';
    document.getElementById('stat-speed').style.width = speedPercent + '%';
    document.getElementById('stat-jump').style.width = jumpPercent + '%';
    document.getElementById('stat-hp').style.width = hpPercent + '%';

    // Näytä vahvistusikkuna
    document.getElementById('menu').classList.add('hidden');
    document.getElementById('char-confirm').classList.remove('hidden');
    gameState = GameState.CHAR_CONFIRM;

    // Valitse oletuksena "Valitse"-nappi
    confirmButtonIndex = 1;
    updateConfirmButtons();

    // Estä välitön vahvistus samalla näppäinpainalluksella
    confirmCooldown = true;
    setTimeout(() => { confirmCooldown = false; }, 100);
}

// Palaa takaisin hahmon valintaan
function backToMenu() {
    document.getElementById('char-confirm').classList.add('hidden');
    document.getElementById('menu').classList.remove('hidden');
    gameState = GameState.MENU;
}

document.addEventListener('keydown', (e) => {
    keys[e.code] = true;

    // Estä oletustoiminnot pelin näppäimille
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyZ', 'KeyX', 'Space', 'Escape'].includes(e.code)) {
        e.preventDefault();
    }

    // Menu-navigaatio
    if (gameState === GameState.MENU) {
        if (e.code === 'ArrowLeft') {
            selectedCharIndex = (selectedCharIndex - 1 + 3) % 3;
            updateMenuSelection();
        } else if (e.code === 'ArrowRight') {
            selectedCharIndex = (selectedCharIndex + 1) % 3;
            updateMenuSelection();
        } else if (e.code === 'Space' || e.code === 'Enter') {
            showCharConfirm(charTypes[selectedCharIndex]);
        }
    }

    // Vahvistusikkunan kontrollit
    if (gameState === GameState.CHAR_CONFIRM) {
        if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
            confirmButtonIndex = confirmButtonIndex === 0 ? 1 : 0;
            updateConfirmButtons();
        } else if ((e.code === 'Space' || e.code === 'Enter') && !confirmCooldown) {
            if (confirmButtonIndex === 1) {
                startGame(charTypes[selectedCharIndex]);
            } else {
                backToMenu();
            }
        } else if (e.code === 'Escape' || e.code === 'Backspace') {
            backToMenu();
        }
    }

    // Voitto/häviö-ruudussa välilyönti palauttaa menuun
    if ((gameState === GameState.VICTORY || gameState === GameState.DEFEAT) && e.code === 'Space') {
        resetGame();
    }

    // Kierroksen voiton jälkeen välilyönti vie seuraavaan kierrokseen
    if (gameState === GameState.ROUND_WIN && e.code === 'Space') {
        startNextRound();
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
    if (keys['ArrowUp']) {
        player.jump();
    }

    // Puolustus (vaatii staminaa)
    if (keys['Space'] && player.stamina > 0) {
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
        opponent.takeDamage(player.char.power, player);
        player.leftArm.punchTime = 1; // Lopeta lyönti
        player.rightArm.punchTime = 1;
    }
    if (opponent.checkHit(player)) {
        player.takeDamage(opponent.char.power, opponent);
        opponent.leftArm.punchTime = 1;
        opponent.rightArm.punchTime = 1;
    }

    // Tarkista ilmahyökkäykset (ei voi puolustaa)
    // checkStomp palauttaa vahingon määrän (0 = ei osumaa)
    const playerStompDamage = player.checkStomp(opponent);
    if (playerStompDamage > 0) {
        opponent.takeStompDamage(playerStompDamage);
        player.powerJump = false; // Vain yksi osuma per hyppy
        player.vy = -6; // Pomppaa ylös osuman jälkeen
    }
    const opponentStompDamage = opponent.checkStomp(player);
    if (opponentStompDamage > 0) {
        player.takeStompDamage(opponentStompDamage);
        opponent.powerJump = false;
        opponent.vy = -6;
    }

    // Tarkista voittaja
    if (opponent.hp <= 0) {
        if (currentRound < 2) {
            // Seuraava kierros - odota välilyöntiä
            gameState = GameState.ROUND_WIN;
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

        // Mehevyys-palkit
        drawStaminaBar(player, 20, 55, 250);
        drawStaminaBar(opponent, canvas.width - 270, 55, 250);

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
            ctx.fillStyle = '#fff';
            ctx.font = '20px Arial';
            ctx.fillText('Paina VÄLILYÖNTIÄ jatkaaksesi', canvas.width / 2, canvas.height / 2 + 50);
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

    // Piilota kaikki muut ikkunat ja näytä intro
    document.getElementById('menu').classList.add('hidden');
    document.getElementById('char-confirm').classList.add('hidden');
    document.getElementById('fight-intro').classList.remove('hidden');
    document.getElementById('opponent-name').textContent = `VS ${opponent.char.name}`;
    document.getElementById('round-text').textContent = `Kierros ${currentRound}/2`;

    gameState = GameState.FIGHT_INTRO;
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
    document.getElementById('char-confirm').classList.add('hidden');
    document.getElementById('menu').classList.remove('hidden');
    gameState = GameState.MENU;
}

// Valikkotoiminnot
document.querySelectorAll('.char-btn').forEach((btn, index) => {
    btn.addEventListener('click', () => {
        selectedCharIndex = index;
        showCharConfirm(btn.dataset.char);
    });

    // Hiiren hover päivittää valinnan
    btn.addEventListener('mouseenter', () => {
        selectedCharIndex = index;
        updateMenuSelection();
    });
});

// Vahvistusikkunan napit
document.getElementById('confirm-back').addEventListener('click', backToMenu);
document.getElementById('confirm-select').addEventListener('click', () => {
    startGame(charTypes[selectedCharIndex]);
});

document.getElementById('play-again').addEventListener('click', resetGame);
document.getElementById('try-again').addEventListener('click', resetGame);

// Piirrä laatikko preview-canvasiin
function drawCharacterPreview(canvasId, charType, scale = 1) {
    const previewCanvas = document.getElementById(canvasId);
    const previewCtx = previewCanvas.getContext('2d');
    const char = Characters[charType];

    const width = previewCanvas.width;
    const height = previewCanvas.height;

    // Tyhjennä
    previewCtx.clearRect(0, 0, width, height);

    // Laatikon mitat (skaalattu)
    const boxWidth = 50 * scale;
    const boxHeight = 38 * scale;
    const x = (width - boxWidth) / 2;
    const y = (height - boxHeight) / 2 - 5 * scale;

    // Laatikon runko
    const gradient = previewCtx.createLinearGradient(x, y, x, y + boxHeight);
    gradient.addColorStop(0, char.colorLight);
    gradient.addColorStop(0.5, char.color);
    gradient.addColorStop(1, char.colorDark);
    previewCtx.fillStyle = gradient;

    // Pyöristetty laatikko
    const radius = 6 * scale;
    previewCtx.beginPath();
    previewCtx.moveTo(x + radius, y);
    previewCtx.lineTo(x + boxWidth - radius, y);
    previewCtx.quadraticCurveTo(x + boxWidth, y, x + boxWidth, y + radius);
    previewCtx.lineTo(x + boxWidth, y + boxHeight - radius);
    previewCtx.quadraticCurveTo(x + boxWidth, y + boxHeight, x + boxWidth - radius, y + boxHeight);
    previewCtx.lineTo(x + radius, y + boxHeight);
    previewCtx.quadraticCurveTo(x, y + boxHeight, x, y + boxHeight - radius);
    previewCtx.lineTo(x, y + radius);
    previewCtx.quadraticCurveTo(x, y, x + radius, y);
    previewCtx.fill();

    // Reunaviiva
    previewCtx.strokeStyle = char.colorDark;
    previewCtx.lineWidth = 2;
    previewCtx.stroke();

    // Kädet
    const armLength = 16 * scale;
    const armWidth = 5 * scale;
    const fistRadius = 6 * scale;

    [-1, 1].forEach(side => {
        const armX = x + boxWidth / 2 + side * 20 * scale;
        const armY = y + 16 * scale;

        previewCtx.fillStyle = char.colorLight;
        previewCtx.strokeStyle = char.colorDark;
        previewCtx.lineWidth = 1.5;

        // Käsi
        previewCtx.beginPath();
        previewCtx.ellipse(armX, armY + armLength / 2, armWidth, armLength / 2, 0, 0, Math.PI * 2);
        previewCtx.fill();
        previewCtx.stroke();

        // Nyrkki
        previewCtx.beginPath();
        previewCtx.arc(armX, armY + armLength, fistRadius, 0, Math.PI * 2);
        previewCtx.fill();
        previewCtx.stroke();
    });

    // Kasvot
    const centerX = x + boxWidth / 2;
    const eyeY = y + 12 * scale;
    const eyeSpacing = 10 * scale;

    // Silmät
    previewCtx.fillStyle = '#fff';
    previewCtx.beginPath();
    previewCtx.ellipse(centerX - eyeSpacing, eyeY, 5 * scale, 6 * scale, 0, 0, Math.PI * 2);
    previewCtx.ellipse(centerX + eyeSpacing, eyeY, 5 * scale, 6 * scale, 0, 0, Math.PI * 2);
    previewCtx.fill();

    // Pupillit
    previewCtx.fillStyle = '#333';
    previewCtx.beginPath();
    previewCtx.arc(centerX - eyeSpacing, eyeY, 2.5 * scale, 0, Math.PI * 2);
    previewCtx.arc(centerX + eyeSpacing, eyeY, 2.5 * scale, 0, Math.PI * 2);
    previewCtx.fill();

    // Suu (hymy)
    const mouthY = y + 26 * scale;
    previewCtx.strokeStyle = '#333';
    previewCtx.lineWidth = 1.5;
    previewCtx.beginPath();
    previewCtx.arc(centerX, mouthY - 2 * scale, 5 * scale, Math.PI * 0.1, Math.PI * 0.9);
    previewCtx.stroke();
}

// Piirrä kaikki preview-kuvat
function drawAllPreviews() {
    drawCharacterPreview('preview-lanttu', 'lanttu', 1);
    drawCharacterPreview('preview-peruna', 'peruna', 1);
    drawCharacterPreview('preview-porkkana', 'porkkana', 1);
}

// Aloita peli
initSnowflakes();
updateMenuSelection(); // Valitse ensimmäinen hahmo oletuksena
drawAllPreviews(); // Piirrä laatikko-previewit
requestAnimationFrame(gameLoop);
