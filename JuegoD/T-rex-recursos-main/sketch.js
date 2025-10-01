var gameOver = false; 
var score = 0;
var highScore = 0;
var jumpSound, dieSound, checkpointSound;
var pixelFont;

var justReset = false; 
var obstacleScale, cloudScale;
var gameSpeed;

// Dimensiones del juego centrado verticalmente
var gameWidth;
var gameHeight;
var offsetY;

var bgImage; // fondo

function preload(){                 
    // Personaje
    trex_running = loadAnimation("Garzav3.png","Garzav32.png","Garzav33.png");
    trex_collided = loadImage("GarzaM2.png");

    // Suelo, nubes y obstáculos
    ground2 = loadImage("ground2.png");
    cloudImage = loadImage("nube.png");   
    obstacle1 = loadImage("estl.png");
    obstacle2 = loadImage("icshu.png");
    obstacle3 = loadImage("icsa.png"); 
    obstacle4 = loadImage("icap.png"); 
    obstacle5 = loadImage("icbi.png"); 
    obstacle6 = loadImage("actopa.png");    

    // Game over y restart
    gameOverImg = loadImage("Gameover2.png");  
    restartImg = loadImage("restart.png");

    // Sonidos
    jumpSound = loadSound("jump.wav");
    dieSound = loadSound("die.wav");
    checkpointSound = loadSound("point.wav");

    // Fuente
    pixelFont = loadFont("PressStart2P-Regular.ttf");

    // Fondo
    bgImage = loadImage("abasolo.png");
}

function setup(){
    createCanvas(windowWidth, windowHeight);

    gameWidth = width;
    gameHeight = height / 3;
    offsetY = (height - gameHeight) / 2;

    calculateScales();

    // Trex
    trex = createSprite(60, offsetY + gameHeight - 50, 20,50);
    trex.addAnimation("running", trex_running);
    trex.addAnimation("collided", trex_collided);
    trex.scale = obstacleScale;
    trex.setCollider("rectangle", 0, 0, trex.width*0.7, trex.height*0.9);

    // Suelo
    ground = createSprite(gameWidth/2, offsetY + gameHeight - 10, gameWidth*2, 10);
    ground.addImage(ground2);

    invisibleGround = createSprite(gameWidth/2, offsetY + gameHeight - 10, gameWidth*2, 10);
    invisibleGround.visible = false;  

    cloudGroup = new Group();
    obstacleGroup = new Group();

    // Game over y restart
    gameOverSprite = createSprite(gameWidth/2, offsetY + gameHeight/2 - 50);
    gameOverSprite.addImage(gameOverImg);
    gameOverSprite.scale = 0.6;
    gameOverSprite.visible = false;

    restartSprite = createSprite(gameWidth/2, offsetY + gameHeight/2 + 20);
    restartSprite.addImage(restartImg);
    restartSprite.scale = 0.5;
    restartSprite.visible = false;

    spawnInitialObstacle();
}

function calculateScales(){
    obstacleScale = (gameHeight / 300) * 0.7; // obstáculos más pequeños
    cloudScale = obstacleScale * 1.2;
    gameSpeed = gameWidth / 133.33;
}

function windowResized(){
    resizeCanvas(windowWidth, windowHeight);
    gameWidth = width;
    gameHeight = height / 3;
    offsetY = (height - gameHeight)/2;
    calculateScales();
}

function draw(){
    // Fondo ocupa toda la pantalla
    if(bgImage){
        image(bgImage, 0, 0, width, height);
    } else {
        background(135, 206, 235); // fallback color
    }

    if (!gameOver) {
        ground.velocityX = -gameSpeed;
        if(ground.x < 0) ground.x = ground.width/2;

        // Salto del personaje
        if (!justReset && (keyDown("space") || keyDown("UP_ARROW")) && trex.collide(invisibleGround)) {
            trex.velocityY = -16; // salto alto
            jumpSound.play();
        }
// Mover a la derecha
if (keyDown("RIGHT_ARROW")) {
    trex.position.x += 5;
}

// Mover a la izquierda
if (keyDown("LEFT_ARROW")) {
    trex.position.x -= 5;
}

// Agacharse o bajar
if (keyDown("DOWN_ARROW")) {
    if (trex.collide(invisibleGround)) {
        // 👉 Está en el suelo → se agacha
        trex.scale = obstacleScale * 0.6;  // lo haces más chiquito
        trex.setCollider("rectangle", 0, 0, trex.width*0.7, trex.height*0.5); // más bajo
    } else {
        // 👉 Está en el aire → baja más rápido
        trex.velocityY += 2;
    }
} else {
    // Cuando no está presionando ↓ vuelve a su tamaño normal
    trex.scale = obstacleScale;
    trex.setCollider("rectangle", 0, 0, trex.width*0.7, trex.height*0.9);
}


        trex.velocityY += 0.8; 
        trex.collide(invisibleGround);

        spawnClouds();
        spawnObstacles();

        score += Math.round(getFrameRate()/60);
        if(score > 0 && score % 100 === 0){
            checkpointSound.play();
        }

        trex.overlap(obstacleGroup, function(){
            gameOver = true;
            trex.changeAnimation("collided"); 
            gameOverSprite.visible = true; 
            restartSprite.visible = true;
            dieSound.play();
            if(score > highScore){
                highScore = score;
            }
        });

    } else {
        ground.velocityX = 0;
        trex.velocityY = 0;
        cloudGroup.setVelocityXEach(0);
        cloudGroup.setLifetimeEach(-1);
        obstacleGroup.setVelocityXEach(0);
        obstacleGroup.setLifetimeEach(-1);

        if(mousePressedOver(restartSprite) || ((keyDown("space") || keyDown("UP_ARROW")) && !justReset)){
            resetGame();
            return; 
        }
    }

    // Puntaje
    textFont(pixelFont);
    textSize(20);
    fill(50);
    text("Score: " + score, gameWidth - 200, offsetY + 40);
    text("HI: " + highScore, gameWidth - 200, offsetY + 70);

    drawSprites();

    if(justReset){
        justReset = false;
    }
}

function spawnClouds(){
    if(frameCount % 60 === 0){ 
        var cloud = createSprite(gameWidth + 50, offsetY + random(50, gameHeight - 100), 40, 10);
        cloud.addImage(cloudImage); 
        cloud.scale = cloudScale;
        cloud.velocityX = -gameSpeed/2;
        cloud.depth = trex.depth - 1;
        cloud.lifetime = gameWidth / (gameSpeed/2) + 50;
        cloudGroup.add(cloud);
    }
}

function spawnObstacles(){
    if(obstacleGroup.length === 0 || (gameWidth - obstacleGroup[obstacleGroup.length-1].x) >= random(gameWidth/3, gameWidth/2)){
        var obstacle = createSprite(gameWidth, offsetY + gameHeight - 50, 10, 40);
        obstacle.velocityX = -gameSpeed;

        switch(Math.round(random(1,6))){
            case 1: obstacle.addImage(obstacle1); break;
            case 2: obstacle.addImage(obstacle2); break;
            case 3: obstacle.addImage(obstacle3); break;
            case 4: obstacle.addImage(obstacle4); break;
            case 5: obstacle.addImage(obstacle5); break;
            case 6: obstacle.addImage(obstacle6); break;
        }

        obstacle.scale = obstacleScale;
        obstacle.lifetime = gameWidth / gameSpeed + 50;
        obstacleGroup.add(obstacle);
    }
}

function spawnInitialObstacle(){
    var obstacle = createSprite(gameWidth/2 + 100, offsetY + gameHeight - 50, 10, 40); 
    obstacle.velocityX = -gameSpeed;
    var rand = Math.round(random(1,6));
    switch(rand){
        case 1: obstacle.addImage(obstacle1); break;
        case 2: obstacle.addImage(obstacle2); break;
        case 3: obstacle.addImage(obstacle3); break;
        case 4: obstacle.addImage(obstacle4); break;
        case 5: obstacle.addImage(obstacle5); break;
        case 6: obstacle.addImage(obstacle6); break;
    }
    obstacle.scale = obstacleScale;
    obstacle.lifetime = gameWidth / gameSpeed + 50;
    obstacleGroup.add(obstacle);
}

function resetGame(){
    gameOver = false;
    obstacleGroup.destroyEach();
    cloudGroup.destroyEach();
    trex.changeAnimation("running");
    trex.velocityY = 0; 
    gameOverSprite.visible = false;
    restartSprite.visible = false;
    score = 0;

    // 🔑 Reposicionar al inicio
    trex.position.x = 60;  
    trex.position.y = offsetY + gameHeight - 50;  

    spawnInitialObstacle();
    justReset = true; 
}
