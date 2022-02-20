// Define the game area size (21 x 9 blocks)
const gameCanvasHeight = 21;
const gameCanvasWidth = 9

// Define the size of the blocks
let BLOCKSIZE = 40;

// Get the canvas object from the document and resize it
let canvas = document.querySelector('canvas')
let ctx = canvas.getContext('2d');

let scoreText = document.getElementById('scoreText')

// Define the array to get the input from the keyboard
let keyPresses = {};

const Status = {
    INIT: 0,
    FALLING: 1,
    DELETING: 2,
    WAITING: 3,
    NEWBLOCK: 4,
    GAMEOVER: 5
};
Object.freeze(Status);

// Define the variable for the game 
let posX = 0;       // X position of the falling block 
let posY = 0;       // Y position of the falling block
let Speed = 0;       // Speed of the game (higher value = slower game)
let count = 0;        // Initialize the counter (when count=0 the block is moved to the new position)
let enable = false;   // this value is used to limit the input of the user (when true the input is captured)
let gameMap = [];     // this is the map of the game area (array of 21 x 9)
let deleteMap = [];
let blockColors = [];
let score = 0;
let startLevel=0;
let level = 0;
let blockCount=0;
let pause = false;
let gameStatus = Status.INIT;


// register the listener for the key input
window.addEventListener('keydown', keyDownListener, false);
function keyDownListener(event) {
    keyPresses[event.key] = true;
}

window.addEventListener('keyup', keyUpListener, false);
function keyUpListener(event) {
    keyPresses[event.key] = false;
}

window.addEventListener('resize', resizeCanvas, false);


init();
window.requestAnimationFrame(gameLoop);


function resizeCanvas() {
    scaleX=window.innerWidth/gameCanvasWidth|0;
    scaleY=(window.innerHeight-50)/gameCanvasHeight|0;

    scale=Math.min(scaleX,scaleY);
    BLOCKSIZE=scale;

    canvas.height = gameCanvasHeight * BLOCKSIZE;
    canvas.width = gameCanvasWidth * BLOCKSIZE;

}

function init() {
    resizeCanvas();

    posX = gameCanvasWidth / 2 | 0;     // initialized to the center column of the game
    posY = 0;                         // Initialized to the top row
    Speed = 20;                       // Speed of the game (The block will fall once every 20 frames)
    level=0;
    startLevel=0;
    blockCount=0;
    score=0;
    
    count = Speed;
    enable = true;

    // Initialize the gameMap (0 = no block in the position i,j)
    for (i = 0; i < gameCanvasWidth; i++) {
        gameMap[i] = [];
        for (j = 0; j < gameCanvasHeight; j++)
            gameMap[i][j] = 0;
    }

    // Initialize the block to be deleted
    for (i = 0; i < gameCanvasWidth; i++) {
        deleteMap[i] = [];
        for (j = 0; j < gameCanvasHeight; j++)
            deleteMap[i][j] = 0;
    }

    CreateBlock();
    gameStatus = Status.FALLING;
}

function gameLoop() {
    scoreText.textContent = "Score: " + score +"\nLevel: " + level;

    switch (gameStatus) {
        case Status.GAMEOVER:
            if (keyPresses.Escape)
            {
                init();
                gameStatus.FALLING;
            }
            break;
        case Status.FALLING:
            oldX = posX;
            oldY = posY;
            bottom = false;

            if (!keyPresses.ArrowLeft & !keyPresses.ArrowRight & !keyPresses.ArrowUp &!keyPresses.l)
                enable = true;

            if (enable & keyPresses.ArrowRight) {
                posX += 1;
                enable = false;
            }

            if (enable & keyPresses.ArrowLeft) {
                posX -= 1;
                enable = false;
            }

            if (enable & keyPresses.ArrowUp) {
                temp = blockColors[0];
                blockColors[0] = blockColors[1];
                blockColors[1] = blockColors[2];
                blockColors[2] = temp;
                enable = false;
            }

            if (enable & keyPresses.l) {
                startLevel++;
                enable = false;
            }

            if (enable & keyPresses.d) {
                for (i = 0; i < gameCanvasWidth; i++) {
                    for (j = 0; j < gameCanvasHeight; j++) {
                        if (gameMap[i][j] == 1)
                            gameMap[i][j] = 0;
                    }
                }
                updateMap();
                enable = false;
            }


            if (posX < 0 | posX >= gameCanvasWidth) {
                posX = oldX;
            }


            if (count == 0 | keyPresses.ArrowDown) {
                if (posY + 2 < gameCanvasHeight) {
                    posY += 1;
                } else {
                    bottom = true;
                }
                count = Speed-level;
                enable = true;
            } else {
                count--;
            }

            if (gameMap[posX][posY] == 0 & gameMap[posX][posY + 1] == 0 & gameMap[posX][posY + 2] == 0) {

            } else {
                posX = oldX;
                posY = oldY;
                if (gameMap[posX][posY + 3] != 0)
                    bottom = true;
            }

            if (bottom) {
                for (i = 0; i < 3; i++) {
                    gameMap[posX][posY + i] = blockColors[i];
                }
                gameStatus=Status.DELETING;
            }
            break;

        case Status.DELETING:
            let punti = checkMap2();
            if (punti > 0) // If there is something to remove...
            {
                score += (punti*(10+level));
                gameStatus = Status.WAITING;
                count = 10;
            }
            else {
                gameStatus=Status.NEWBLOCK;
            }
            break;

        case Status.WAITING:
            if (count == 0) {
                updateMap();
                gameStatus = Status.DELETING;
            }
            else
                count--
            break;

        case Status.NEWBLOCK:
            posX = gameCanvasWidth / 2 | 0;
            posY = 0;
            if (gameMap[posX][posY]==0 & gameMap[posX][posY+1]==0 & gameMap[posX][posY+2]==0) {
                CreateBlock();
                gameStatus = Status.FALLING;
            } else {
                gameStatus = Status.GAMEOVER;
            }
            break;
    }

    draw();

    window.requestAnimationFrame(gameLoop);
}

function CreateBlock() {
    blockCount++;
    level=Math.min(startLevel + blockCount/30|0 , 16);

    if (level>=7)
        MaxColor=5;
    else if (level >= 5)
        MaxColor=4;
    else
        MaxColor=3;

    blockColors = [0, 0, 0];
    for (i = 0; i < 3; i++) {
        blockColors[i] = Math.floor(Math.random() * MaxColor) + 1;
    }
}


function checkMap2() {
    let points = 0;
    loop = true;
    loop = false;

    // Initialize the block to be deleted
    for (i = 0; i < gameCanvasWidth; i++) {
        deleteMap[i] = [];
        for (j = 0; j < gameCanvasHeight; j++)
            deleteMap[i][j] = 0;
    }

    for (i = 0; i < gameCanvasWidth; i++) {
        for (j = 0; j < gameCanvasHeight; j++) {
            if (gameMap[i][j] != 0) {
                color = gameMap[i][j]

                // Look for vertical
                if (j < gameCanvasHeight - 2) {
                    if (gameMap[i][j + 1] == color & gameMap[i][j + 2] == color) {
                        deleteMap[i][j] = 1;
                        deleteMap[i][j + 1] = 1;
                        deleteMap[i][j + 2] = 1;
                        loop = true;
                        points += 3;
                    }
                }

                // Look for Horizontal
                if (i < gameCanvasWidth - 2) {
                    if (gameMap[i + 1][j] == color & gameMap[i + 2][j] == color) {
                        deleteMap[i][j] = 1;
                        deleteMap[i + 1][j] = 1;
                        deleteMap[i + 2][j] = 1;
                        loop = true;
                        points += 3;
                    }
                }

                // Look for Diagonal-Right
                if (i < gameCanvasWidth - 2 & j < gameCanvasHeight - 2) {
                    if (gameMap[i + 1][j + 1] == color & gameMap[i + 2][j + 2] == color) {
                        deleteMap[i][j] = 1;
                        deleteMap[i + 1][j + 1] = 1;
                        deleteMap[i + 2][j + 2] = 1;
                        loop = true;
                        points += 3
                    }
                }

                // Look for Diagonal-Left
                if (i >= 2 & j < gameCanvasHeight - 2) {
                    if (gameMap[i - 1][j + 1] == color & gameMap[i - 2][j + 2] == color) {
                        deleteMap[i][j] = 1;
                        deleteMap[i - 1][j + 1] = 1;
                        deleteMap[i - 2][j + 2] = 1;
                        loop = true;
                        points += 3;
                    }
                }

            }

        }

    }

    // Mark the block for deletion in gameMap
    for (i = 0; i < gameCanvasWidth; i++) {
        for (j = 0; j < gameCanvasHeight; j++)
            if (deleteMap[i][j] == 1)
                gameMap[i][j] = -1;
    }
    return points;
}


function updateMap() {
    for (i = 0; i < gameCanvasWidth; i++) {
        for (j = 0; j < gameCanvasHeight; j++)
            if (deleteMap[i][j] == 1)
                gameMap[i][j] = 0;
    }
    found = true;
    while (found) {
        found = false;
        for (col = 0; col < gameCanvasWidth; col++) {
            for (row = gameCanvasHeight - 1; row > 0; row--) {
                if (gameMap[col][row] == 0 & gameMap[col][row - 1] != 0) {
                    gameMap[col][row] = gameMap[col][row - 1];
                    gameMap[col][row - 1] = 0;
                    found = true;
                }

            }

        }
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawMap();
    if (gameStatus == Status.FALLING)
        drawBlock(posX, posY);
}

function drawMap() {
    for (i = 0; i < gameCanvasWidth; i++)
        for (j = 0; j < gameCanvasHeight; j++)
            if (gameMap[i][j] != 0) {
                drawBox(i, j, gameMap[i][j]);
            }
}

function drawBox(x, y, colorIndex) {
    const BORDERSIZE = 2;
    ctx.beginPath();
    ctx.fillStyle = "#000000";
    ctx.fillRect(x * BLOCKSIZE, y * BLOCKSIZE, BLOCKSIZE, BLOCKSIZE);
    switch (colorIndex) {
        case -1:
            ctx.fillStyle = "#000000";
            break;
        case 1:
            ctx.fillStyle = "#FF0000";
            break;
        case 2:
            ctx.fillStyle = "#00FF00";
            break;
        case 3:
            ctx.fillStyle = "#0000FF";
            break;
        case 4:
            ctx.fillStyle= "#9400D3";
            break;
        case 5:
            ctx.fillStyle= "#FFFF00";
            break;
        case 0:
            ctx.fillStyle = "#FFFFFF";
            break;
    }

    ctx.fillRect(
        x * BLOCKSIZE + BORDERSIZE,
        y * BLOCKSIZE + BORDERSIZE,
        BLOCKSIZE - 2 * BORDERSIZE,
        BLOCKSIZE - 2 * BORDERSIZE);
    ctx.stroke();

}

function drawBlock(x, y) {
    for (i = 0; i < 3; i++) {
        drawBox(x, y + i, blockColors[i]);
    }


}
