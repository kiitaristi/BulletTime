class GalleryLevel1 extends Phaser.Scene {
    constructor() {
        super("galleryLevel1");

        // Initialize a class variable "my" which is an object.
        // The object has two properties, both of which are objects
        //  - "sprite" holds bindings (pointers) to created sprites
        //  - "text"   holds bindings to created bitmap text objects
        this.my = {sprite: {}, text: {}};

        this.levelOneScore;
        this.curveA;
        this.curveB;

        // Create a property inside "sprite" named "bullet".
        // The bullet property has a value which is an array.
        // This array will hold bindings (pointers) to bullet sprites
        this.my.sprite.bullet = [];   
        this.maxBullets = 10;           // Don't create more than this many bullets

        this.my.sprite.enemyBullet = [];
        this.maxEnemyBullets = 20;
        this.enemyBulletSpeed = 10;

        // create property inside "sprite" for shooting enemies
        // enemyShoot property has an array value, holding bindings to shooting enemy sprites
        this.my.sprite.enemyShoot = [];
        this.maxEnemyShoot = 10;      // amount of shooting enemies defeated to reach next level
        this.maxShootOnScreen = 3;      // don't have more than this many sprites on screen
        this.enemyShootPoints = 25;

        // create property inside "sprite" for dashing enemies
        this.my.sprite.enemyDash = [];
        this.maxEnemyDash = 30;         // amount of dashing enemies defeated to reach next level
        this.maxDashOnScreen = 2;         // don't have more that this many sprites on screen
        this.enemyDashPoints = 15;
        this.enemyDashSpeed = 10;

        // More typically want to use a global variable for score, since
        // it will be used across multiple scenes
        
        // variable checks for update loop
        this.playerHealth = 5;
        this.dodgeCooldown = 0;
        this.dodgeDuration = 0;
        this.levelEndTimer = 0;
        this.playerCanCollide = true;
        this.playerInvulnTimer = 120;
        this.shootSpawnTimer = 0;
        this.shootProjTimer = 0;
        this.shootCurrIter = 0;
        this.shootSpawnedCounter = 0;
        this.shootMaxIter = 0;
        this.dashIter = 0;
    }

    init(data)
    {
        this.levelOneScore = data.score;
    }

    create() {
        let my = this.my;

        my.sprite.player = this.add.sprite(game.config.width/2, game.config.height - 40, "player");
        my.sprite.player.setScale(0.80);
        my.sprite.player.flipY = true;

        this.createCurveA();
        this.createCurveB();
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
            repeat: 5,
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
                this.dodgeDuration = 40;
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
        my.text.score = this.add.bitmapText(game.config.width-140, 5, "rocketSquare", "Score\n" + this.levelOneScore);
        my.text.score.setRightAlign();
    }

    update() {
        let my = this.my;

        if (this.playerHealth < 1)
        {
            this.scene.start("reset", {score: this.levelOneScore});
        }

        if (this.shootSpawnTimer % 150 == 0 && this.shootCurrIter < this.maxShootOnScreen && this.shootSpawnedCounter < this.maxEnemyShoot) {
            this.createEnemyShoot();
        }
        this.shootSpawnTimer++;
        this.shootProjTimer++;

        if (this.shootMaxIter >= this.maxEnemyShoot && this.dashIter >= this.maxEnemyDash) {
            this.levelEndTimer++;

            my.text.success.setVisible(true);

            if (this.levelEndTimer >= 240) {
                this.scene.start("galleryLevel2", {score: this.levelOneScore});
            }
        }

        this.dodgeCooldown -= 1;
        this.dodgeDuration -= 1;
        this.playerInvulnTimer -= 1;
        
        if (this.dodgeDuration <= 0) 
        { 
            this.playerSpeed = 10;
            if (this.playerInvulnTimer <= 0) {
                this.playerCanCollide = true;
            }
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

        if (this.dashIter <= this.maxEnemyDash) {
            if (my.sprite.enemyDash.length < this.maxDashOnScreen)
            {
                my.sprite.enemyDash.push(this.add.sprite(
                        Math.floor(Math.random() * 801) + 100, -100, "spaceShooterAssets", "spaceShips_002.png").setScale(0.75)
                    );
                    this.dashIter++;
            }
        }

        // cull array objects
        my.sprite.bullet = my.sprite.bullet.filter((bullet) => bullet.y > -(bullet.displayHeight/2));
        my.sprite.enemyShoot = my.sprite.enemyShoot.filter((enemyShoot) => enemyShoot.y < game.config.height + 100);
        my.sprite.enemyBullet = my.sprite.enemyBullet.filter((enemyBullet) => enemyBullet.y < game.config.height + 100);
        my.sprite.enemyDash = my.sprite.enemyDash.filter((enemyDash) => enemyDash.y < game.config.height + 100);
        
        // Check for collision with enemy

        for (let enemy of my.sprite.enemyDash) {
            for (let bullet of my.sprite.bullet) {
                if (this.collides(enemy, bullet)) {
                    // start animation
                    this.puff = this.add.sprite(enemy.x, enemy.y, "whitePuff03").setScale(0.25).play("puff");
                    // clear out bullet -- put y offscreen, will get reaped next update
                    bullet.y = -100;
                    // clear out enemy -- puts enemy beyond filter condition, culls next update
                    enemy.visible = false;
                    enemy.y = game.config.height + 200;
                    // Update score
                    this.levelOneScore += this.enemyDashPoints;
                    this.updateScore();
                    // Have new enemy appear after end of animation
                }
            }
            if (this.collides(enemy, my.sprite.player) && this.playerCanCollide) {
                this.playerHealth--;
                this.playerCanCollide = false;
                this.playerInvulnTimer = 120;
                this.updateHealth();
            }
        }

        for (let enemy of my.sprite.enemyShoot) {
            if (this.shootProjTimer % 60 == 0 && enemy.y >= 300) {
                my.sprite.enemyBullet.push(this.add.sprite(
                    enemy.x, enemy.y+(enemy.displayHeight/2), "spaceShooterAssets", "spaceMissiles_001.png").setFlipY(true)
                );
            }          
            for (let bullet of my.sprite.bullet) {
                if (this.collides(enemy, bullet)) {
                    // start animation
                    this.puff = this.add.sprite(enemy.x, enemy.y, "whitePuff03").setScale(0.25).play("puff");
                    // clear out bullet -- put y offscreen, will get reaped next update
                    bullet.y = -100;
                    // clear out enemy -- puts enemy beyond filter condition, culls next update
                    enemy.stopFollow();
                    enemy.setActive(false).setVisible(false);
                    enemy.y = 10000;
                    this.shootCurrIter--;
                    this.shootMaxIter++;
                    console.log("amount shot: " + this.shootMaxIter + " amount needed: " + this.maxEnemyShoot);
                    // Update score
                    this.levelOneScore += this.enemyShootPoints;
                    this.updateScore();
                    // Have new enemy appear after end of animation
                }
            }
            for (let enemyBullet of my.sprite.enemyBullet) {
                if (this.collides(enemyBullet, my.sprite.player)) {
                    if (this.playerCanCollide == true) {
                        enemyBullet.visible = false;
                        enemyBullet.y = 10000;
                        this.playerHealth--;
                        this.playerCanCollide = false;
                        this.playerInvulnTimer = 120;
                        this.updateHealth();
                    }
                }
            }
        }

        // Make all of the bullets move
        for (let bullet of my.sprite.bullet) {
            bullet.y -= this.bulletSpeed;
        }

        for (let enemyBullet of my.sprite.enemyBullet) {
            enemyBullet.y += this.enemyBulletSpeed;
        }

        for (let enemy of my.sprite.enemyDash) {
            enemy.y += this.enemyDashSpeed;
        }
    }

    // A center-radius AABB collision check
    collides(a, b) {
        if (Math.abs(a.x - b.x) > (a.displayWidth/2 + b.displayWidth/2)) return false;
        if (Math.abs(a.y - b.y) > (a.displayHeight/2 + b.displayHeight/2)) return false;
        return true;
    }

    updateScore() {
        let my = this.my;
        my.text.score.setText("Score\n" + this.levelOneScore);
    }

    updateHealth() {
        let my = this.my;
        my.text.health.setText("Health: " + this.playerHealth);
    }

    createCurveA()
    {
        this.points = [
            0, -100,
            0, 20,
            20, 300,
            100, 400 
        ]

        this.curveA = new Phaser.Curves.Spline(this.points);
    }

    createCurveB()
    {
        this.points = [
            0, -100,
            0, 20,
            -20, 300,
            -100, 400 
        ]

        this.curveB = new Phaser.Curves.Spline(this.points);
    }

    clearCurve(curve)
    {
        curve.points = [];
    }

    createEnemyShoot()
    {
        let my = this.my;

        my.sprite.enemyShoot.push(this.add.sprite(
            Math.floor(Math.random() * 601) + 200, 10).setScale(0.75)
        );
        this.shootCurrIter++;
        
        if (my.sprite.enemyShoot[my.sprite.enemyShoot.length - 1].x < game.config.width/2) {
            my.sprite.enemyShoot[my.sprite.enemyShoot.length - 1] = this.add.follower(
                this.curveA, my.sprite.enemyShoot[my.sprite.enemyShoot.length - 1].x, -200, "spaceShooterAssets", "spaceShips_001.png").setScale(0.75);
        }
        else {
            my.sprite.enemyShoot[my.sprite.enemyShoot.length - 1] = this.add.follower(
                this.curveB, my.sprite.enemyShoot[my.sprite.enemyShoot.length - 1].x, -200, "spaceShooterAssets", "spaceShips_001.png").setScale(0.75);
        }
        this.setPath(my.sprite.enemyShoot[my.sprite.enemyShoot.length - 1]);
        this.shootSpawnedCounter++;
    }

    setPath(enemy)
    {
        let followVars = {
            from: 0,
            to: 1,
            delay: 0,
            duration: 2000,
            repeat: 0,
            yoyo: false,
            rotateToPath: false,
            rotationOffset: 0
        };
        enemy.startFollow(followVars);
    }
}
         