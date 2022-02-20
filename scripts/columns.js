// Define the game area size (21 x 9 blocks)
const gameCanvasHeight = 21;
const gameCanvasWidth = 9

// Define the size of the blocks
let BLOCKSIZE = 40;
let BORDERSIZE = 2;

// Get the canvas object from the document and resize it
//let canvas = document.querySelector('gameScene')
let canvas = document.getElementById('GameScene');
let ctx = canvas.getContext('2d');

let preview = document.getElementById('Preview');
let ctxPreview = preview.getContext('2d');

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
let posX = 0;           // X position of the falling block 
let posY = 0;           // Y position of the falling block
let Speed = 0;          // Speed of the game (higher value = slower game)
let count = 0;          // Initialize the counter (when count=0 the block is moved to the new position)
let enable = false;     // this value is used to limit the input of the user (when true the input is captured)
let gameMap = [];       // this is the map of the game area (array of 21 x 9)
let deleteMap = [];     // this map marks the blocks to be deleted
let blockColors = [];  
let nextBlock = []; 
let score = 0;          // Score
let startLevel=0;       // This variable offsets the level number
let level = 0;          // Current level
let blockCount=0;       // number of blocks generated (used mainly to manage the level switch)
let pause = false;
let gameStatus = Status.INIT;   // status of the game state machine


// register the listener for the key input
window.addEventListener('keydown', keyDownListener, false);
function keyDownListener(event) {
    keyPresses[event.key] = true;
}

window.addEventListener('keyup', keyUpListener, false);
function keyUpListener(event) {
    keyPresses[event.key] = false;
}

// register the listener for the window resize event
window.addEventListener('resize', resizeCanvas, false);


init();
window.requestAnimationFrame(gameLoop);


function resizeCanvas() {
    scaleX=window.innerWidth/gameCanvasWidth|0;
    scaleY=(window.innerHeight-50)/gameCanvasHeight|0;

    scale=Math.min(scaleX,scaleY);
    BLOCKSIZE=scale;
    BORDERSIZE=Math.max(BLOCKSIZE/20|0,1);

    canvas.height = gameCanvasHeight * BLOCKSIZE;
    canvas.width = gameCanvasWidth * BLOCKSIZE;

    preview.height = 5 * BLOCKSIZE;
    preview.width = 3 * BLOCKSIZE;


}

function init() {
    resizeCanvas();

    posX = gameCanvasWidth / 2 | 0;     // initialized to the center column of the game
    posY = 0;                           // Initialized to the top row
    Speed = 20;                         // Speed of the game (The block will fall once every 20 frames)
    level=0;                            // reset of starting level
    startLevel=0;                       // reset of level offset
    blockCount=0;                       // reset the block count
    score=0;                            // reset the score

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

    nextBlock=GenerateBlock();
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

            // To improve the control the key are enabled only if they are previosly released
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
            
            // ArrowUp Shift the block colors
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


            // for debug only d deletes all the red blocks from the map
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

            // check if the new requested position is inside the game area, else do nothing and decrease counter
            if (posX < 0 | posX >= gameCanvasWidth) {
                posX = oldX;
            }


            // if the block has to be redrawn in the new positon
            if (count == 0 | keyPresses.ArrowDown) {
                // if is not at the bottom if the pit, then the posY is increased
                if (posY + 2 < gameCanvasHeight) {
                    posY += 1;
                } else {
                    bottom = true;
                }
                // count is set to the new value derived from level
                count = Speed-level;

                // key input is enabled (even if the key has not been released)
                enable = true;
            } else {
                count--;
            }

            if (gameMap[posX][posY] == 0 & gameMap[posX][posY + 1] == 0 & gameMap[posX][posY + 2] == 0) {

            } else { // if the requested position of the block is not free, then the block is kept in the old position and reached the bottom
                posX = oldX;
                posY = oldY;
                if (gameMap[posX][posY + 3] != 0)
                    bottom = true;
            }

            // if the block is landed, then update gameMap with the new block
            if (bottom) {
                for (i = 0; i < 3; i++) {
                    gameMap[posX][posY + i] = blockColors[i];
                }
                gameStatus=Status.DELETING;
            }
            break;

        case Status.DELETING:
            // check the Map for deletion
            let punti = checkMap2();
            if (punti > 0) // If there is something to remove...
            {
                score += (punti*(10+level)); // increase the score
                gameStatus = Status.WAITING; // change status
                count = 10;                  // set the count to 10 (to highlight the deletion)
            }
            else { // if nothing to remove, generate a new block
                gameStatus=Status.NEWBLOCK;
            }
            break;

        case Status.WAITING:
            if (count == 0) {
                // if waiting time is expired update map and change the game status
                updateMap(); // this function remove the deleted block and move the block towards the bottom
                gameStatus = Status.DELETING;   // status is deleting to check if after the update other blocks must be deleted
            }
            else
                count--
            break;

        case Status.NEWBLOCK:
            // set the new posX and posY position of the new block
            posX = gameCanvasWidth / 2 | 0;
            posY = 0;

            // if there is enough room to draw the new block, create the block and continue the game
            if (gameMap[posX][posY]==0 & gameMap[posX][posY+1]==0 & gameMap[posX][posY+2]==0) {
                CreateBlock();
                gameStatus = Status.FALLING;
            } else { // else game over :(
                gameStatus = Status.GAMEOVER;
            }
            break;
    }

    draw();

    window.requestAnimationFrame(gameLoop);
}

function CreateBlock() {
    blockCount++;

    // every 30 blocks the level is increased (max level is 16)
    level=Math.min(startLevel + blockCount/30|0 , 16);

    blockColors=nextBlock;
    nextBlock=GenerateBlock();
}

function GenerateBlock() {
    let block = [0, 0, 0];
    // At level 7 the number of available color is incresed to 5
    if (level>=7)
        MaxColor=5;
    else if (level >= 5) // at level 5 the number of available color is increased to 4
        MaxColor=4;
    else        // level lower than 5 has only 3 colors
        MaxColor=3;

    for (i = 0; i < 3; i++) {
        block[i] = Math.floor(Math.random() * MaxColor) + 1;
    }
    return block;
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

function drawPreview() {
    ctxPreview.clearRect(0,0,preview.width,preview.height);

    for (i=0;i<3;i++)
    {
        drawBox(ctxPreview,1,1+i,nextBlock[i]);
    }

}

function draw() {
    drawPreview();

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawMap();
    if (gameStatus == Status.FALLING)
        drawBlock(posX, posY);
}

function drawMap() {
    for (i = 0; i < gameCanvasWidth; i++)
        for (j = 0; j < gameCanvasHeight; j++)
            if (gameMap[i][j] != 0) {
                drawBox(ctx,i, j, gameMap[i][j]);
            }
}

function drawBox(context, x, y, colorIndex) {
    
    context.beginPath();
    context.fillStyle = "#000000";
    context.fillRect(x * BLOCKSIZE, y * BLOCKSIZE, BLOCKSIZE, BLOCKSIZE);
    switch (colorIndex) {
        case -1:
            context.fillStyle = "#000000";
            break;
        case 1:
            context.fillStyle = "#FF0000";
            break;
        case 2:
            context.fillStyle = "#00FF00";
            break;
        case 3:
            context.fillStyle = "#0000FF";
            break;
        case 4:
            context.fillStyle= "#9400D3";
            break;
        case 5:
            context.fillStyle= "#FFFF00";
            break;
        case 0:
            context.fillStyle = "#FFFFFF";
            break;
    }

    context.fillRect(
        x * BLOCKSIZE + BORDERSIZE,
        y * BLOCKSIZE + BORDERSIZE,
        BLOCKSIZE - 2 * BORDERSIZE,
        BLOCKSIZE - 2 * BORDERSIZE);
    context.stroke();

}


function drawBlock(x, y) {
    for (i = 0; i < 3; i++) {
        drawBox(ctx,x, y + i, blockColors[i]);
    }


}
