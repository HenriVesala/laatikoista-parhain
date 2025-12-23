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
    ROUND_WIN: 'round_win',
    CHALLENGE_INTRO: 'challenge_intro',
    CHALLENGE_VICTORY: 'challenge_victory'
};

// Hahmojen määrittelyt
const Characters = {
    lanttu: {
        name: 'Lanttulaatikko',
        color: '#d47f00ff',
        colorLight: '#e6a645ff',
        colorDark: '#ab3c00ff',
        speed: 3,
        power: 14,
        maxHp: 100,
        jumpHeight: 9, // Matala hyppy
        description: 'Perinteinen joulupöydän kunkku. Lanttulaatikko iskee kovaa ja armotta - hitaudestaan huolimatta tämä oranssinen mötkö on pelätty vastustaja.'
    },
    peruna: {
        name: 'Perunalaatikko',
        color: '#ffb74d',
        colorLight: '#f9d49eff',
        colorDark: '#c88b2fff',
        speed: 5,
        power: 11,
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
    },
    bataatti: {
        name: 'Bataattilaatikko',
        color: '#ff8800ff',
        colorLight: '#ffb74d',
        colorDark: '#ce7b00ff',
        speed: 6,
        power: 11,
        maxHp: 110,
        jumpHeight: 13,
        description: 'Eksoottinen haastaja kaukaisilta mailta. Bataattilaatikko yhdistää voiman ja nopeuden vaaralliseksi kokonaisuudeksi. Harvinainen ja arvaamaton!',
        hidden: true // Piilotettu kunnes avataan
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
let challengeMode = false; // Onko haastetila päällä
let bataattiUnlocked = localStorage.getItem('bataattiUnlocked') === 'true';

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
    // Yksi kuusi taustalla (oikealla)
    drawTree(700, 320);

    // Lumiukko taustalla (vasemmalla)
    drawSnowman(100, 350);

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
    // Runko - maahan asti
    ctx.fillStyle = '#5d4037';
    ctx.fillRect(x - 10, y + 50, 20, 60);

    // Lehvästö (kolmiot) - piirretään alhaalta ylös, jotta ylemmät peittävät alemmat
    ctx.fillStyle = '#2e7d32';

    // Alin kerros (isoin)
    ctx.beginPath();
    ctx.moveTo(x, y + 20);
    ctx.lineTo(x - 45, y + 60);
    ctx.lineTo(x + 45, y + 60);
    ctx.closePath();
    ctx.fill();

    // Keskikerros
    ctx.beginPath();
    ctx.moveTo(x, y - 15);
    ctx.lineTo(x - 35, y + 30);
    ctx.lineTo(x + 35, y + 30);
    ctx.closePath();
    ctx.fill();

    // Ylin kerros (pienin)
    ctx.beginPath();
    ctx.moveTo(x, y - 45);
    ctx.lineTo(x - 25, y);
    ctx.lineTo(x + 25, y);
    ctx.closePath();
    ctx.fill();

    // Koristeet
    ctx.fillStyle = '#f44336';
    ctx.beginPath();
    ctx.arc(x - 12, y + 40, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 15, y + 15, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x - 8, y - 5, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.arc(x + 8, y + 45, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x - 18, y + 20, 4, 0, Math.PI * 2);
    ctx.fill();

    // Tähti huipulla
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    const starY = y - 55;
    ctx.moveTo(x, starY - 10);
    for (let i = 0; i < 5; i++) {
        ctx.lineTo(x + Math.cos((i * 144 - 90) * Math.PI / 180) * 10,
                   starY + Math.sin((i * 144 - 90) * Math.PI / 180) * 10);
        ctx.lineTo(x + Math.cos((i * 144 - 90 + 72) * Math.PI / 180) * 4,
                   starY + Math.sin((i * 144 - 90 + 72) * Math.PI / 180) * 4);
    }
    ctx.closePath();
    ctx.fill();
}

function drawSnowman(x, y) {
    // Varjo
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.ellipse(x, y + 55, 35, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Alapallo (isoin)
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y + 30, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Keskipallo
    ctx.beginPath();
    ctx.arc(x, y - 10, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Yläpallo (pää)
    ctx.beginPath();
    ctx.arc(x, y - 45, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Silmät
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(x - 6, y - 50, 3, 0, Math.PI * 2);
    ctx.arc(x + 6, y - 50, 3, 0, Math.PI * 2);
    ctx.fill();

    // Porkkananenä
    ctx.fillStyle = '#ff6600';
    ctx.beginPath();
    ctx.moveTo(x, y - 45);
    ctx.lineTo(x + 15, y - 42);
    ctx.lineTo(x, y - 40);
    ctx.closePath();
    ctx.fill();

    // Suu (hiilenpalaset)
    ctx.fillStyle = '#333';
    for (let i = 0; i < 5; i++) {
        const angle = (i - 2) * 0.2;
        ctx.beginPath();
        ctx.arc(x + Math.sin(angle) * 10, y - 35 + Math.cos(angle) * 3, 2, 0, Math.PI * 2);
        ctx.fill();
    }

    // Napit
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(x, y - 15, 3, 0, Math.PI * 2);
    ctx.arc(x, y - 3, 3, 0, Math.PI * 2);
    ctx.arc(x, y + 10, 3, 0, Math.PI * 2);
    ctx.fill();

    // Hattu
    ctx.fillStyle = '#222';
    ctx.fillRect(x - 15, y - 65, 30, 5); // Hatun reuna
    ctx.fillRect(x - 10, y - 85, 20, 20); // Hatun yläosa

    // Huivi
    ctx.fillStyle = '#c41e3a';
    ctx.fillRect(x - 12, y - 30, 24, 8);
    // Huivin roikkuva osa
    ctx.fillRect(x + 10, y - 30, 8, 20);
}

// Näppäimistön tila
const keys = {};

// Menu-navigaatio
let selectedCharIndex = 0;
// charTypes päivitetään dynaamisesti initMenu():ssa
let charTypes = ['lanttu', 'peruna', 'porkkana'];

function updateMenuSelection() {
    // Valitse vain näkyvät napit
    const visibleButtons = document.querySelectorAll('.char-btn:not(.hidden)');
    visibleButtons.forEach((btn, index) => {
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
        const charCount = charTypes.length;
        if (e.code === 'ArrowLeft') {
            selectedCharIndex = (selectedCharIndex - 1 + charCount) % charCount;
            updateMenuSelection();
        } else if (e.code === 'ArrowRight') {
            selectedCharIndex = (selectedCharIndex + 1) % charCount;
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

    // Haaste-ilmoituksessa välilyönti aloittaa haasteen
    if (gameState === GameState.CHALLENGE_INTRO && e.code === 'Space') {
        startChallenge();
    }

    // Haasteen voiton jälkeen välilyönti palaa menuun
    if (gameState === GameState.CHALLENGE_VICTORY && e.code === 'Space') {
        document.getElementById('challenge-victory').classList.add('hidden');
        resetGame();
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
    const totalRounds = opponents.length;
    if (opponent.hp <= 0) {
        if (challengeMode) {
            // Haaste voitettu - avaa bataatti!
            gameState = GameState.CHALLENGE_VICTORY;
            bataattiUnlocked = true;
            localStorage.setItem('bataattiUnlocked', 'true');
            document.getElementById('challenge-victory').classList.remove('hidden');
            drawCharacterPreview('unlock-preview-canvas', 'bataatti', 1.5);
            document.getElementById('unlocked-name').textContent = Characters.bataatti.name;
            SoundManager.stopBattleMusic();
            SoundManager.playVictory();
            challengeMode = false;
        } else if (currentRound < totalRounds) {
            // Seuraava kierros - odota välilyöntiä
            gameState = GameState.ROUND_WIN;
            SoundManager.stopBattleMusic();
        } else {
            // Peli voitettu!
            // Jos bataatti ei ole vielä avattu, näytä haaste
            if (!bataattiUnlocked) {
                SoundManager.stopBattleMusic();
                showChallengeIntro();
            } else {
                gameState = GameState.VICTORY;
                document.getElementById('victory').classList.remove('hidden');
                SoundManager.stopBattleMusic();
                SoundManager.playVictory();
            }
        }
        player.expression = 'happy';
        player.expressionTimer = 5;
    } else if (player.hp <= 0) {
        if (challengeMode) {
            // Haaste hävitty - palaa menuun
            challengeMode = false;
            gameState = GameState.DEFEAT;
            document.getElementById('defeat').classList.remove('hidden');
            document.getElementById('defeat-text').textContent = 'Haaste epäonnistui!';
            SoundManager.stopBattleMusic();
            SoundManager.playDefeat();
        } else {
            gameState = GameState.DEFEAT;
            document.getElementById('defeat').classList.remove('hidden');
            document.getElementById('defeat-text').textContent = 'Yritä uudelleen!';
            SoundManager.stopBattleMusic();
            SoundManager.playDefeat();
        }
        opponent.expression = 'happy';
        opponent.expressionTimer = 5;
    }
}

// Näytä haaste-ilmoitus
function showChallengeIntro() {
    gameState = GameState.CHALLENGE_INTRO;
    document.getElementById('challenge-intro').classList.remove('hidden');
    drawCharacterPreview('challenge-preview-canvas', 'bataatti', 1.5);
    SoundManager.playRoundStart();
}

// Aloita haastetaistelu
function startChallenge() {
    challengeMode = true;
    document.getElementById('challenge-intro').classList.add('hidden');

    // Luo pelaaja ja bataatti-vastustaja
    player = new Laatikko(100, playerCharType, true);
    player.hp = player.maxHp; // Täydet HP
    player.stamina = player.maxStamina;

    opponent = new Laatikko(600, 'bataatti', false);
    opponent.difficulty = 2; // Vaikea AI

    // Näytä fight intro
    document.getElementById('fight-intro').classList.remove('hidden');
    document.getElementById('opponent-name').textContent = 'VS Laatikko haastaja';
    document.getElementById('round-text').textContent = 'HAASTE!';

    gameState = GameState.FIGHT_INTRO;
    SoundManager.playRoundStart();

    setTimeout(() => {
        document.getElementById('fight-intro').classList.add('hidden');
        gameState = GameState.PLAYING;
        SoundManager.startBattleMusic();
    }, 2000);
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
        ctx.fillText(`Kierros ${currentRound}/${opponents.length}`, canvas.width / 2, 30);

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
    SoundManager.stopMenuMusic(); // Pysäytä taustamusiikki
    playerCharType = charType;

    // Määritä vastustajat dynaamisesti - kaikki avatut hahmot paitsi pelaajan valitsema
    const availableTypes = ['lanttu', 'peruna', 'porkkana'];
    if (bataattiUnlocked) {
        availableTypes.push('bataatti');
    }
    opponents = availableTypes.filter(t => t !== charType);

    currentRound = 1;
    startRound();
}

function startRound() {
    const totalRounds = opponents.length;

    player = new Laatikko(100, playerCharType, true);
    opponent = new Laatikko(600, opponents[currentRound - 1], false);
    // Vaikeus kasvaa kierrosten edetessä (1-3)
    opponent.difficulty = Math.min(currentRound, 3);

    // Piilota kaikki muut ikkunat ja näytä intro
    document.getElementById('menu').classList.add('hidden');
    document.getElementById('char-confirm').classList.add('hidden');
    document.getElementById('fight-intro').classList.remove('hidden');
    document.getElementById('opponent-name').textContent = `VS ${opponent.char.name}`;
    document.getElementById('round-text').textContent = `Kierros ${currentRound}/${totalRounds}`;

    gameState = GameState.FIGHT_INTRO;
    SoundManager.playRoundStart();

    setTimeout(() => {
        console.log('Fight intro timeout fired, starting battle...');
        document.getElementById('fight-intro').classList.add('hidden');
        gameState = GameState.PLAYING;
        console.log('Calling SoundManager.startBattleMusic...');
        SoundManager.startBattleMusic();
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
    // Päivitä menu (näytä bataatti jos juuri avattu)
    initMenu();
    drawAllPreviews();
    selectedCharIndex = 0;
    updateMenuSelection();
    // Käynnistä taustamusiikki
    SoundManager.startMenuMusic();
}

// Valikkotoiminnot
document.querySelectorAll('.char-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
        const charType = btn.dataset.char;
        const index = charTypes.indexOf(charType);
        if (index !== -1) {
            selectedCharIndex = index;
            showCharConfirm(charType);
        }
    });

    // Hiiren hover päivittää valinnan
    btn.addEventListener('mouseenter', () => {
        const charType = btn.dataset.char;
        const index = charTypes.indexOf(charType);
        if (index !== -1) {
            selectedCharIndex = index;
            updateMenuSelection();
        }
    });
});

// Vahvistusikkunan napit
document.getElementById('confirm-back').addEventListener('click', backToMenu);
document.getElementById('confirm-select').addEventListener('click', () => {
    startGame(charTypes[selectedCharIndex]);
});

document.getElementById('play-again').addEventListener('click', resetGame);
document.getElementById('try-again').addEventListener('click', resetGame);
document.getElementById('challenge-continue').addEventListener('click', () => {
    document.getElementById('challenge-victory').classList.add('hidden');
    resetGame();
});

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
    if (bataattiUnlocked) {
        drawCharacterPreview('preview-bataatti', 'bataatti', 1);
    }
}

// Alusta menu - näytä bataatti jos avattu
function initMenu() {
    // Päivitä charTypes dynaamisesti
    charTypes = ['lanttu', 'peruna', 'porkkana'];
    if (bataattiUnlocked) {
        charTypes.push('bataatti');
        // Näytä bataatti-nappi
        document.getElementById('bataatti-btn').classList.remove('hidden');
    }
}

// Aloita peli
initSnowflakes();
initMenu(); // Alusta menu ja näytä bataatti jos avattu
updateMenuSelection(); // Valitse ensimmäinen hahmo oletuksena
drawAllPreviews(); // Piirrä laatikko-previewit
requestAnimationFrame(gameLoop);

// Käynnistä taustamusiikki kun käyttäjä tekee minkä tahansa interaktion
// (Web Audio API vaatii käyttäjän interaktion ennen äänen toistoa)
let menuMusicStarted = false;

function tryStartMenuMusic() {
    if (menuMusicStarted) return;
    if (gameState === GameState.MENU || gameState === GameState.CHAR_CONFIRM) {
        menuMusicStarted = true;
        SoundManager.startMenuMusic();
        // Remove all listeners once music started
        ['click', 'keydown', 'touchstart', 'mousedown'].forEach(event => {
            document.removeEventListener(event, tryStartMenuMusic);
        });
    }
}

// Start on any interaction
['click', 'keydown', 'touchstart', 'mousedown'].forEach(event => {
    document.addEventListener(event, tryStartMenuMusic);
});
