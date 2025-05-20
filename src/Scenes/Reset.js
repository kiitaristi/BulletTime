class Reset extends Phaser.Scene {
    constructor() {
        super("reset");

        this.finalScore;
        //  - "text"   holds bindings to created bitmap text objects
        this.my = {text: {}};
    }

    init(data)
    {
        this.finalScore = data.score;
    }

    create() {
        let my = this.my;

        my.text.gameOver = this.add.bitmapText(game.config.width/8 + 175, game.config.height/2 - 100, "rocketSquare", "Game Over");
        my.text.gameOver.setFontSize(60);
        my.text.gameOver.setCenterAlign();

        my.text.scoreTxt = this.add.bitmapText(my.text.gameOver.x, my.text.gameOver.y + 100, "rocketSquare",
            "Total Score: " + this.finalScore + "\nPress S to restart"
        );
        my.text.scoreTxt.setCenterAlign();

        this.input.keyboard.on('keydown-S', (event) => {
            this.scene.start("start");
        });
    }
}