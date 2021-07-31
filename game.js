var birdRadius = 12.5; //Height and width of the bird
var holeHeight = 100.0; //Height of the gaps
var pipeWidth = 50.0; //Width of the barrier

var jumpHeight = 5.0; //Vertical speed to gain when jumping

var score = 0;
var vertSpeed = 0.0; //Vertical speed (set to 0.0 as initial)
var blockLeft; //X coordinate of the left side of the barrier
var holeTop; //Y coordinate of the top side of the gap

//Don't change these values
var canvasWidth = 500.0;
var canvasHeight = 500.0;

var speed = document.getElementById("speedSlider").value; //Game speed

var aiToggle = 0;
var nn; //Neural network
var nnInputs = [];
var prediction;

var mouse = 0;

var bird;
let button;

function Bird(){
  this.y = canvasHeight / 2;
  this.x = birdRadius + 10;
  this.vertSpeed = 0.0;
  this.dead = 0;

  this.draw = function(){
    fill(0, 255, 0);
    this.y -= this.vertSpeed * speed;
    this.vertSpeed -= 0.2 * speed;
    /* if(this.vertSpeed < -5.0){
      this.vertSpeed = -5.0;
    } */
    ellipse(this.x, this.y, birdRadius * 2, birdRadius * 2);
  }

  this.jump = function(){
    this.vertSpeed = jumpHeight;
  }

}

function Pipe(){
  this.y = Math.random() * 300 + holeHeight / 2;
  this.x = canvasWidth;

  this.draw = function(){
    fill(0);
    if(!bird.dead){
      this.x -= 5 * speed;
    }
    if(this.x <= - pipeWidth){
      this.y = Math.random() * 300 + holeHeight / 2;
      this.x = canvasWidth;
      if(!bird.dead){
        score++;
        document.getElementById("score").innerHTML = "Score: " + score;
      }
    }
    rect(this.x, 0, pipeWidth, this.y - (holeHeight / 2));
    rect(this.x, this.y + (holeHeight / 2), pipeWidth, canvasHeight);
  }
}

function setup(){
  document.getElementById("info").style.top = canvasHeight + 100 + "px";
  document.getElementById("info").style.width = canvasHeight + "px";

  // Create the canvas
  let canvas = createCanvas(canvasWidth, canvasHeight);
  canvas.position(50, 50);

  // Button
  button = createButton("Restart");
  button.position(canvasWidth / 4 + 50, 10);
  button.size(canvasWidth / 2, 25);
  button.mousePressed(restart);

  // Set up the first pipe and the birds
  restart();

  if(aiToggle){
    nnSetup(3, 6, 2);
  }
}

function mouseReleased(){
  mouse = 0;
}

function draw(){
  background(220);
  pipe.draw();

  if(mouseIsPressed && mouse == 0 && !bird.dead){
    bird.jump();
    mouse = 1;
  }

  if(bird.y < birdRadius ||
    bird.y > canvasHeight - birdRadius ||
    (pipe.x < birdRadius + 10 &&
      pipe.x > - pipeWidth &&
      (bird.y + birdRadius > pipe.y + (holeHeight / 2) ||
        bird.y - birdRadius < pipe.y - (holeHeight / 2)
      ))){
    bird.dead = 1;
  }

  if(!bird.dead){
    bird.draw();
  }

  //Speed adjusting
  speed = document.getElementById("speedSlider").value / 10;
  document.getElementById("actualSpeed").innerHTML = "Speed: " + speed + "x";
}

function nnSetup(a, b, c){
  nn = new NeuralNetwork(a, b, c);
  nn.createModel();
  tf.setBackend('cpu');
}

function restart(){
  score = 0;
  document.getElementById("score").innerHTML = "Score: " + score;
  bird = new Bird();
  pipe = new Pipe();
}




/*
 * setInterval(function(){
 *
 *   //Predict and jump with AI
 *   if(aiToggle){
 *     var xDiff = (blockLeft + (pipeWidth / 2)) - (birdRadius / 2); //Horizontal difference of the center of the bird and the center of the block
 *     var yDiff = (birdHeight - (birdRadius / 2)) - (holeTop - (holeHeight / 2)); //Vertical difference of the center of the bird and the center of the hole
 *     prediction = nn.predict([vertSpeed, xDiff, yDiff]);
 *     if(prediction[0] > prediction[1]){
 *       jump();
 *     }
 *   }
 *
 *
 * }, 10); //Every 10 ms
 */

