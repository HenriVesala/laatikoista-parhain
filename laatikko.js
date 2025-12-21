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

        // Mehevyys (stamina)
        this.stamina = 100;
        this.maxStamina = 100;
        this.staminaRegenDelay = 0; // Aika viimeisestä toiminnosta
        this.staminaRegenRate = 40; // Palautuminen per sekunti

        // Stamina-kulutukset
        this.punchStaminaCost = 15;
        this.jumpStaminaCost = 20;
        this.blockStaminaCost = 8; // Per sekunti

        // Raajojen tila
        this.leftArm = { angle: 0, punching: false, punchTime: 0 };
        this.rightArm = { angle: 0, punching: false, punchTime: 0 };
        this.blocking = false;

        // Ilmahyökkäys
        this.powerJump = false; // Onko hyppy staminallinen
        this.jumpStartY = 350; // Hypyn aloituskorkeus (seurataan vahinkoa varten)
        // Stomp-vahinko lasketaan hypyn korkeuden perusteella

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

        // Törmäys toiseen laatikkoon - estä läpiliikkuminen ja työnnä
        // Mutta vain jos molemmat ovat suunnilleen samalla tasolla (ei hyppää päälle)
        if (other) {
            const overlap = this.checkCollision(other);
            if (overlap > 0) {
                // Tarkista onko kyseessä päälle hyppääminen
                // Jos toinen on selvästi ylempänä ja tulossa alas, älä työnnä sivulle
                const myBottom = this.y + this.height;
                const otherBottom = other.y + other.height;

                // Hyppääkö joku päälle? (jalat ovat toisen pään tasolla tai ylempänä)
                const iAmJumpingOnTop = myBottom <= other.y + 25 && this.vy > 0;
                const otherIsJumpingOnTop = otherBottom <= this.y + 25 && other.vy > 0;

                // Työnnä vain jos molemmat ovat maassa tai samalla tasolla
                if (!iAmJumpingOnTop && !otherIsJumpingOnTop) {
                    // Laske työntövoima voiman (power) perusteella
                    const myPower = this.char.power;
                    const otherPower = other.char.power;
                    const totalPower = myPower + otherPower;

                    // Vahvempi työntää enemmän (0.0 - 1.0)
                    const myPushRatio = myPower / totalPower;
                    const otherPushRatio = otherPower / totalPower;

                    // Kumpi on vasemmalla?
                    if (this.x < other.x) {
                        // Minä vasemmalla, työnnän itseäni vasemmalle ja toista oikealle
                        this.x -= overlap * otherPushRatio;
                        other.x += overlap * myPushRatio;
                    } else {
                        // Minä oikealla
                        this.x += overlap * otherPushRatio;
                        other.x -= overlap * myPushRatio;
                    }

                    // Varmista ettei mene seinien läpi työnnön jälkeen
                    if (this.x < 10) this.x = 10;
                    if (this.x > canvas.width - this.width - 10) this.x = canvas.width - this.width - 10;
                    if (other.x < 10) other.x = 10;
                    if (other.x > canvas.width - other.width - 10) other.x = canvas.width - other.width - 10;
                }
            }
        }

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

        // Mehevyyden palautuminen
        if (this.staminaRegenDelay > 0) {
            this.staminaRegenDelay -= dt;
        } else if (this.stamina < this.maxStamina && !this.blocking) {
            this.stamina += this.staminaRegenRate * dt;
            if (this.stamina > this.maxStamina) this.stamina = this.maxStamina;
        }

        // Puolustuksen stamina-kulutus (jatkuva)
        if (this.blocking) {
            this.useStamina(this.blockStaminaCost * dt);
            // Jos stamina loppuu, lopeta puolustus
            if (this.stamina <= 0) {
                this.blocking = false;
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

    useStamina(amount) {
        this.stamina -= amount;
        if (this.stamina < 0) this.stamina = 0;
        this.staminaRegenDelay = 1; // 1 sekunnin viive ennen palautumista
    }

    gainStamina(amount) {
        this.stamina += amount;
        if (this.stamina > this.maxStamina) this.stamina = this.maxStamina;
    }

    punch(isLeft) {
        const arm = isLeft ? this.leftArm : this.rightArm;
        // Tarkista onko tarpeeksi staminaa
        if (!arm.punching && !this.blocking && this.stamina >= this.punchStaminaCost) {
            arm.punching = true;
            arm.punchTime = 0;
            this.useStamina(this.punchStaminaCost);
            SoundManager.playPunch();
            return true;
        }
        return false;
    }

    jump() {
        if (this.grounded) {
            if (this.stamina >= this.jumpStaminaCost) {
                // Täysi hyppy - voi tehdä ilmahyökkäyksen
                // Käytetään hahmon hyppykorkeutta (jumpHeight)
                this.vy = -this.char.jumpHeight;
                this.useStamina(this.jumpStaminaCost);
                this.powerJump = true;
                this.jumpStartY = this.y; // Tallennetaan aloituskorkeus
            } else {
                // Heikko hyppy ilman staminaa (60% normaalista)
                this.vy = -this.char.jumpHeight * 0.6;
                this.powerJump = false;
            }
            this.grounded = false;
            return true;
        }
        return false;
    }

    // Tarkista ilmahyökkäys (stomping)
    // Palauttaa vahingon määrän (0 = ei osumaa)
    checkStomp(other) {
        // Tarkista vain jos on ilmassa, tulossa alas, ja hyppy oli staminallinen
        if (!this.grounded && this.vy > 0 && this.powerJump) {
            // Tarkista osuuko vastustajan päälle
            const myBottom = this.y + this.height;
            const otherTop = other.y;

            // Horisontaalinen osuma
            const horizontalOverlap =
                this.x < other.x + other.width &&
                this.x + this.width > other.x;

            // Putoaa vastustajan päälle
            if (horizontalOverlap &&
                myBottom >= otherTop &&
                myBottom <= otherTop + 30 && // Osuu ylhäältä
                this.y < otherTop) {
                // Laske vahinko hypyn korkeuden perusteella
                // Perusvahinko 8, + 0.5 per hyppykorkeus-piste
                // Porkkana (15): 8 + 7.5 = 15.5 -> 15
                // Peruna (12): 8 + 6 = 14
                // Lanttu (10): 8 + 5 = 13
                const stompDamage = Math.floor(8 + this.char.jumpHeight * 0.5);
                return stompDamage;
            }
        }
        return 0;
    }

    // Ota stomp-vahinko (ei voi puolustaa)
    takeStompDamage(amount) {
        SoundManager.playHit();
        this.hp -= amount;
        this.hitFlash = 1;
        this.expression = 'hit';
        this.expressionTimer = 0.3;
        if (this.hp < 0) this.hp = 0;
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

    takeDamage(amount, attacker) {
        if (this.blocking) {
            amount = Math.floor(amount * 0.2);
            SoundManager.playBlock();
            // Onnistunut puolustus antaa mehevyyttä 2x hyökkääjän kulutus
            this.gainStamina(attacker.punchStaminaCost * 2);
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

        // Hyppyjen väistö - nopeammat hahmot väistävät paremmin
        // Tarkista onko pelaaja ilmassa ja tulossa kohti
        if (player.powerJump && !player.grounded && player.vy > 0) {
            const horizontalDistance = Math.abs(this.x - player.x);
            // Väistön todennäköisyys perustuu nopeuteen (speed 3-7 -> 30%-70%)
            const dodgeChance = this.char.speed / 10;
            // Vaikeampi AI väistää paremmin
            const difficultyBonus = this.difficulty === 2 ? 0.15 : 0;

            if (horizontalDistance < 100 && Math.random() < (dodgeChance + difficultyBonus) * dt * 5) {
                // Väistä poispäin pelaajasta
                this.aiAction = 'dodge_jump';
                this.aiTimer = 0.3;
            }
        }

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
            case 'dodge_jump':
                // Väistä hyppyä nopeasti liikkumalla poispäin
                this.vx = -this.facing * this.char.speed * 1.2;
                break;
            case 'attack':
                // Tarkista onko staminaa
                if (this.stamina >= this.punchStaminaCost) {
                    if (Math.random() < 0.5) {
                        this.punch(true);
                    } else {
                        this.punch(false);
                    }
                }
                break;
            case 'block':
                // Puolusta vain jos on staminaa
                if (this.stamina > 0) {
                    this.blocking = true;
                }
                break;
        }

        // Hyppyhyökkäys - suositaan jos hyvä hyppäämään mutta ei vahva
        // Lasketaan hyppyhyökkäyksen houkuttelevuus: korkea hyppy + matala voima = hyvä
        // jumpHeight: 9-15, power: 8-14
        // Porkkana (jump 15, power 8) -> haluaa hyppiä
        // Lanttu (jump 9, power 14) -> ei halua hyppiä
        const jumpPreference = (this.char.jumpHeight / 15) * (1 - this.char.power / 20);
        const baseJumpChance = 0.01 + jumpPreference * 0.04; // 0.01 - 0.05
        const difficultyBonus = this.difficulty === 2 ? 0.02 : 0;

        if (this.grounded && this.stamina >= this.jumpStaminaCost) {
            const distance = Math.abs(this.x - player.x);
            // Hyppää todennäköisemmin kun sopivalla etäisyydellä
            const distanceBonus = (distance > 60 && distance < 150) ? 0.02 : 0;

            if (Math.random() < baseJumpChance + difficultyBonus + distanceBonus) {
                this.jump();
                // Liiku pelaajaa kohti hypyn aikana
                this.aiAction = 'approach';
                this.aiTimer = 0.5;
            }
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

        // Tarkista HP-taso ruksisilmiä ja mustelmia varten
        const hpPercent = this.hp / this.maxHp;
        const isDead = this.hp <= 0;
        const isHurt = hpPercent < 0.2 && !isDead;

        // Mustelmat silmien ympärille kun HP < 50%
        if (hpPercent < 0.5) {
            // Mustelman tummuus kasvaa vahingon mukana (0.5 -> 0 = 0 -> 0.6 opacity)
            const bruiseIntensity = Math.min(0.6, (0.5 - hpPercent) * 1.2);
            ctx.fillStyle = `rgba(75, 0, 130, ${bruiseIntensity})`; // Tumma violetti/sininen

            // Vasen silmän mustelma
            ctx.beginPath();
            ctx.ellipse(centerX - eyeSpacing, eyeY, 12, 14, 0, 0, Math.PI * 2);
            ctx.fill();

            // Oikea silmän mustelma (voimakkaampi kun enemmän vahinkoa)
            if (hpPercent < 0.35) {
                ctx.fillStyle = `rgba(75, 0, 130, ${bruiseIntensity * 0.8})`;
                ctx.beginPath();
                ctx.ellipse(centerX + eyeSpacing, eyeY, 12, 14, 0, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Vasen silmä
        if (isDead || isHurt) {
            // Ruksisilmä
            this.drawXEye(centerX - eyeSpacing, eyeY);
        } else {
            // Normaali silmä
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.ellipse(centerX - eyeSpacing, eyeY, 8, 10, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#333';
            const pupilOffset = this.facing * 2;
            ctx.beginPath();
            ctx.arc(centerX - eyeSpacing + pupilOffset, eyeY, 4, 0, Math.PI * 2);
            ctx.fill();
        }

        // Oikea silmä
        if (isDead) {
            // Ruksisilmä (molemmat kun kuollut)
            this.drawXEye(centerX + eyeSpacing, eyeY);
        } else {
            // Normaali silmä
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.ellipse(centerX + eyeSpacing, eyeY, 8, 10, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#333';
            const pupilOffset = this.facing * 2;
            ctx.beginPath();
            ctx.arc(centerX + eyeSpacing + pupilOffset, eyeY, 4, 0, Math.PI * 2);
            ctx.fill();
        }

        // Suu
        const mouthY = y + 42;
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.beginPath();

        // Määritä suun ilme HP:n perusteella (jos ei ole väliaikainen ilme)
        let mouthExpression = this.expression;
        if (this.expression === 'normal') {
            // Vahinko prosentti (0 = ei vahinkoa, 1 = kuollut)
            const damagePercent = 1 - hpPercent;
            if (damagePercent >= 0.85) {
                mouthExpression = 'pained'; // Tuskallinen irvistys
            } else if (damagePercent >= 0.7) {
                mouthExpression = 'sad'; // Alakuloinen
            } else if (damagePercent >= 0.5) {
                mouthExpression = 'serious'; // Vakava
            }
        }

        switch (mouthExpression) {
            case 'hit':
                // Irvistys iskusta - hampaat näkyvissä
                // Suun tausta
                ctx.fillStyle = '#8B0000'; // Tummanpunainen suu
                ctx.beginPath();
                ctx.rect(centerX - 12, mouthY - 2, 24, 10);
                ctx.fill();
                // Hampaat (ylähammasrivi)
                ctx.fillStyle = '#fff';
                for (let i = 0; i < 4; i++) {
                    ctx.fillRect(centerX - 10 + i * 6, mouthY - 2, 4, 5);
                }
                // Hampaat (alahammasrivi)
                for (let i = 0; i < 4; i++) {
                    ctx.fillRect(centerX - 10 + i * 6, mouthY + 3, 4, 4);
                }
                // Suun reunat
                ctx.strokeStyle = '#333';
                ctx.lineWidth = 2;
                ctx.strokeRect(centerX - 12, mouthY - 2, 24, 10);
                break;
            case 'pained':
                // Tuskallinen irvistys (eri kuin hit) - aaltoileva suu
                ctx.beginPath();
                ctx.moveTo(centerX - 10, mouthY + 2);
                ctx.quadraticCurveTo(centerX - 5, mouthY - 3, centerX, mouthY + 2);
                ctx.quadraticCurveTo(centerX + 5, mouthY + 7, centerX + 10, mouthY + 2);
                ctx.stroke();
                break;
            case 'sad':
                // Alakuloinen - alaspäin kaartuva suu
                ctx.beginPath();
                ctx.arc(centerX, mouthY + 10, 8, Math.PI * 1.2, Math.PI * 1.8);
                ctx.stroke();
                break;
            case 'serious':
                // Vakava - suora viiva
                ctx.beginPath();
                ctx.moveTo(centerX - 8, mouthY);
                ctx.lineTo(centerX + 8, mouthY);
                ctx.stroke();
                break;
            case 'happy':
                // Iloinen suu
                ctx.arc(centerX, mouthY - 5, 10, 0, Math.PI);
                ctx.stroke();
                break;
            case 'angry':
                // Vihainen suu
                ctx.moveTo(centerX - 10, mouthY);
                ctx.lineTo(centerX + 10, mouthY);
                ctx.stroke();
                break;
            default:
                // Normaali pieni hymy
                ctx.arc(centerX, mouthY - 3, 8, Math.PI * 0.1, Math.PI * 0.9);
                ctx.stroke();
        }

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

    // Piirrä ruksisilmä (X)
    drawXEye(x, y) {
        const size = 6;
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x - size, y - size);
        ctx.lineTo(x + size, y + size);
        ctx.moveTo(x + size, y - size);
        ctx.lineTo(x - size, y + size);
        ctx.stroke();
        ctx.lineCap = 'butt';
    }

    // Tarkista törmäys toiseen laatikkoon
    // Palauttaa päällekkäisyyden määrän (0 = ei törmäystä)
    checkCollision(other) {
        // Tarkista onko päällekkäin horisontaalisesti
        const myRight = this.x + this.width;
        const otherRight = other.x + other.width;

        // Tarkista myös pystysuunnassa (vain jos samalla korkeudella)
        const myBottom = this.y + this.height;
        const otherBottom = other.y + other.height;

        const verticalOverlap = this.y < otherBottom && myBottom > other.y;

        if (verticalOverlap) {
            // Laske horisontaalinen päällekkäisyys
            const overlapLeft = myRight - other.x;
            const overlapRight = otherRight - this.x;

            if (overlapLeft > 0 && overlapRight > 0) {
                // Palauta pienempi päällekkäisyys (se mitä pitää korjata)
                return Math.min(overlapLeft, overlapRight);
            }
        }

        return 0;
    }
}
