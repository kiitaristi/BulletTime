class GalleryLevelBoss extends Phaser.Scene {
    constructor() {
        super("galleryLevelBoss");

        // Initialize a class variable "my" which is an object.
        // The object has two properties, both of which are objects
        //  - "sprite" holds bindings (pointers) to created sprites
        //  - "text"   holds bindings to created bitmap text objects
        this.my = {sprite: {}, text: {}};

        this.bossScore;

        this.points;
        this.curve;
        // Create a property inside "sprite" named "bullet".
        // The bullet property has a value which is an array.
        // This array will hold bindings (pointers) to bullet sprites
        this.my.sprite.bullet = [];   
        this.maxBullets = 10;           // Don't create more than this many bullets

        this.my.sprite.bossBullet = [];   
        this.maxBossBullets = 20;           // Don't create more than this many bullets
        this.bossBulletSpeed = 8;
        
        this.playerHealth = 5;
        this.dodgeCooldown = 0;
        this.dodgeDuration = 0;
        this.hitIndicateTimer = 30;
        this.levelEndTimer = 0;
        this.playerCanCollide = true;
        this.bossTimerOuter = 0;
        this.bossTimerInner = 0;
        this.toggleNewDirection = false;
    }

    init(data)
    {
        this.bossScore = data.score;
    }

    create() {
        let my = this.my;

        my.sprite.player = this.add.sprite(game.config.width/2, game.config.height - 40, "player");
        my.sprite.player.setScale(0.80);
        my.sprite.player.flipY = true;

        this.createCurve();

        my.sprite.boss = this.add.follower(
            this.curve, 250, 400, "spaceShooterAssets", "spaceShips_007.png").setScale(2.5);
        this.bossHealth = 75;
        this.setPath(my.sprite.boss);

        // Notice that in this approach, we don't create any bullet sprites in create(),
        // and instead wait until we need them, based on the number of space bar presses

        // Create white puff animation
        this.anims.create({
            key: "puff",
            frames: [
                { key: "whitePuff00" },
                { key: "whitePuff01" },
                { key: "whitePuff02" },
                { key: "whitePuff03" },
            ],
            frameRate: 20,    // Note: case sensitive (thank you Ivy!)
            repeat: 20,
            hideOnComplete: true
        });

        // Create key objects
        this.left = this.input.keyboard.addKey("A");
        this.right = this.input.keyboard.addKey("D");
        this.space = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        // Set movement speeds (in pixels/tick)
        this.playerSpeed = 10;
        this.bulletSpeed = 15;

        this.input.keyboard.on('keydown-SHIFT', (event) => {
            if (this.dodgeCooldown <= 0)
            {
                this.dodgeDuration = 20;
                this.dodgeCooldown = 100;

                if (this.dodgeDuration > 0) 
                { 
                    this.playerSpeed = 30;
                    this.playerCanCollide = false;
                }
            }
        });

        // title text
        my.text.health = this.add.bitmapText(10, 5, "rocketSquare", "Health: " + this.playerHealth);

        my.text.success = this.add.bitmapText(game.config.width/2 - 180, game.config.height/2, "rocketSquare", "Success!");
        my.text.success.setCenterAlign().setVisible(false);
        my.text.success.setFontSize(60);

        // score text
        my.text.score = this.add.bitmapText(game.config.width-140, 5, "rocketSquare", "Score\n" + this.bossScore);
        my.text.score.setRightAlign();
    }

    update() {
        let my = this.my;

        if (my.sprite.boss.x == this.points[0].x) { this.toggleNewDirection = false; }
        if (my.sprite.boss.x == this.points[1].x) { this.toggleNewDirection = true; }

        if (this.playerHealth < 1)
        {
            this.scene.start("reset", {score: this.bossScore});
        }

        if (this.bossHealth <= 0) {
            if (this.levelEndTimer < 1) { 
                this.bossScore += 1000 
                this.updateScore();
            };
            my.sprite.boss.stopFollow();
            my.sprite.boss.setActive(false).setVisible(false);
            this.puff = this.add.sprite(my.sprite.boss.x, my.sprite.boss.y, "whitePuff03").setScale(1).play("puff");
            this.levelEndTimer++;
            my.text.success.visible = true;

            if (this.levelEndTimer >= 240)
            {
                this.scene.start("reset", {score: this.bossScore});
            }
        }
        else {
            if (this.bossTimerOuter % 120 < 80) {
                if (this.bossTimerInner % 20 == 0) {
                    if (my.sprite.bossBullet.length < this.maxBossBullets) {
                        my.sprite.bossBullet.push(this.add.sprite(
                            my.sprite.boss.x-(my.sprite.boss.displayWidth/2), my.sprite.boss.y+(my.sprite.boss.displayHeight/2), "spaceShooterAssets", "spaceMissiles_001.png").setFlipY(true).setScale(2)
                        );
                        my.sprite.bossBullet.push(this.add.sprite(
                            my.sprite.boss.x+(my.sprite.boss.displayWidth/2), my.sprite.boss.y+(my.sprite.boss.displayHeight/2), "spaceShooterAssets", "spaceMissiles_001.png").setFlipY(true).setScale(2)
                        );
                    }
                }
            }
        }

        this.dodgeCooldown -= 1;
        this.dodgeDuration -= 1;
        this.hitIndicateTimer--;
        this.bossTimerInner++;
        this.bossTimerOuter++;
        
        /*
        if (this.hitIndicateTimer <= 0)
        {
            my.sprite.boss.clearTint();
        }
            */

        if (this.dodgeDuration <= 0) 
        { 
            this.playerSpeed = 10;
            this.playerCanCollide = true; 
        }

        // Moving left
        if (this.left.isDown) {
            // Check to make sure the sprite can actually move left
            if (my.sprite.player.x > (my.sprite.player.displayWidth/2)) {
                my.sprite.player.x -= this.playerSpeed;
            }
        }

        // Moving right
        if (this.right.isDown) {
            // Check to make sure the sprite can actually move right
            if (my.sprite.player.x < (game.config.width - (my.sprite.player.displayWidth/2))) {
                my.sprite.player.x += this.playerSpeed;
            }
        }

        // Check for bullet being fired
        if (Phaser.Input.Keyboard.JustDown(this.space)) {
            // Are we under our bullet quota?
            if (my.sprite.bullet.length < this.maxBullets) {
                my.sprite.bullet.push(this.add.sprite(
                    my.sprite.player.x, my.sprite.player.y-(my.sprite.player.displayHeight/2), "spaceShooterAssets", "spaceMissiles_001.png")
                );
            }
        }

        // Remove all of the bullets which are offscreen
        // filter() goes through all of the elements of the array, and
        // only returns those which **pass** the provided test (conditional)
        // In this case, the condition is, is the y value of the bullet
        // greater than zero minus half the display height of the bullet? 
        // (i.e., is the bullet fully offscreen to the top?)
        // We store the array returned from filter() back into the bullet
        // array, overwriting it. 
        // This does have the impact of re-creating the bullet array on every 
        // update() call. 
        my.sprite.bullet = my.sprite.bullet.filter((bullet) => bullet.y > -(bullet.displayHeight/2));
        my.sprite.bossBullet = my.sprite.bossBullet.filter((bossBullet) => bossBullet.y < game.config.height + 100);

        // Check for collision with enemy
        for (let bullet of my.sprite.bullet) {
            if (this.collides(my.sprite.boss, bullet)) {
                // clear out bullet -- put y offscreen, will get reaped next update
                bullet.y = -100;
                my.sprite.boss.setTint(0xff00ff, 0xff0000, 0x00ff00, 0x0000ff);
                this.bossHealth -= 1;
                this.hitIndicateTimer = 30;
            }
        }

        for (let bullet of my.sprite.bossBullet) {
                if (this.collides(bullet, my.sprite.player)) {
                    if (this.playerCanCollide == true) {
                        bullet.visible = false;
                        bullet.y = 10000;
                        this.playerHealth--;
                        this.playerCanCollide = false;
                        this.playerInvulnTimer = 120;
                        this.updateHealth();
                    }
                }
            }

        // Make all of the bullets move
        for (let bullet of my.sprite.bullet) {
            bullet.y -= this.bulletSpeed;
        }

        for (let bullet of my.sprite.bossBullet) {
            bullet.y += this.bossBulletSpeed;
        }

        // FIXME: repurpose this into a game over scene - "r" key restarts game
        /*
        if (Phaser.Input.Keyboard.JustDown(this.nextScene)) {
            this.scene.start("fixedArrayBullet");
        }
        */
    }

    // A center-radius AABB collision check
    collides(a, b) {
        if (Math.abs(a.x - b.x) > (a.displayWidth/2 + b.displayWidth/2)) return false;
        if (Math.abs(a.y - b.y) > (a.displayHeight/2 + b.displayHeight/2)) return false;
        return true;
    }

    updateScore() {
        let my = this.my;
        my.text.score.setText("Score\n" + this.bossScore);
    }

    updateHealth() {
        let my = this.my;
        my.text.health.setText("Health: " + this.playerHealth);
    }

    createCurve()
    {
        this.points = [
            0, 0,
            500, 0
        ]

        this.curve = new Phaser.Curves.Spline(this.points);
    }

    setPath(enemy)
    {
        let followVars = {
            from: 0,
            to: 1,
            delay: 0,
            duration: 6000,
            repeat: -1,
            yoyo: true,
            rotateToPath: false,
            rotationOffset: 0
        };
        enemy.startFollow(followVars);
    }
}
         