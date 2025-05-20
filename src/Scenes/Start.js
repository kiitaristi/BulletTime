class Start extends Phaser.Scene {
    constructor() {
        super("start");

        this.startScore = 0;
        //  - "text"   holds bindings to created bitmap text objects
        this.my = {text: {}};
    }

    preload() {
        this.load.setPath("./assets/");
        this.load.atlasXML("spaceShooterAssets", "spaceShooter2_spritesheet.png", "spaceShooter2_spritesheet.xml");

        this.load.image("player", "enemyGreen1.png");

        // For animation
        this.load.image("whitePuff00", "whitePuff00.png");
        this.load.image("whitePuff01", "whitePuff01.png");
        this.load.image("whitePuff02", "whitePuff02.png");
        this.load.image("whitePuff03", "whitePuff03.png");

        // Load the Kenny Rocket Square bitmap font
        // This was converted from TrueType format into Phaser bitmap
        // format using the BMFont tool.
        // BMFont: https://www.angelcode.com/products/bmfont/
        // Tutorial: https://dev.to/omar4ur/how-to-create-bitmap-fonts-for-phaser-js-with-bmfont-2ndc
        this.load.bitmapFont("rocketSquare", "KennyRocketSquare_0.png", "KennyRocketSquare.fnt");

        // Sound asset from the Kenny Music Jingles pack
        // https://kenney.nl/assets/music-jingles
    }

    create() {
        let my = this.my;

        my.text.title = this.add.bitmapText(game.config.width/4 + 10, game.config.height/2 - 150, "rocketSquare", "Slipstream");
        my.text.title.setFontSize(60);
        my.text.title.setCenterAlign();

        my.text.controls = this.add.bitmapText(my.text.title.x - 40, my.text.title.y + 100, "rocketSquare",
            "Controls\n A/D: Move left/right\n Shift: Dodge\n Space: Fire projectiles\n\n Press S to start"
        );
        my.text.controls.setCenterAlign();

        this.input.keyboard.on('keydown-S', (event) => {
            this.scene.start("galleryLevel1", {score: this.startScore});
        });
    }
}