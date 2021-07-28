var birdRadius = 25.0; //Height and width of the bird
var holeHeight = 100.0; //Height of the gaps
var blockWidth = 50.0; //Width of the barrier

var jumpHeight = 5.0; //Vertical speed to gain when jumping

var dead = 0; //Is the bird dead?
var score = -1;
var scoreHelper = 0; //Helps to only count one barrier as one point
var vertSpeed = 0.0; //Vertical speed (set to 0.0 as initial)
var blockLeft; //X coordinate of the left side of the barrier
var holeTop; //Y coordinate of the top side of the gap

//Don't change these values
var canvasWidth = 500.0;
var canvasHeight = 500.0;

var block = document.getElementById("block");
var hole = document.getElementById("hole");
var character = document.getElementById("character");
var speed = document.getElementById("speedSlider").value; //Game speed

var aiToggle = 0;
var nn; //Neural network
var nnInputs = [];
var prediction;

//Y coordinate of the top of the bird
var birdHeight = canvasHeight - parseInt(window.getComputedStyle(character).getPropertyValue("top")); 


function setup(){
  block.style.width = blockWidth + "px";
  hole.style.width = blockWidth + "px";
  hole.style.height = holeHeight + "px";
  character.style.width = character.style.height = birdRadius + "px";

  if(aiToggle){
    nnSetup(3, 6, 2);
  }
}

function nnSetup(a, b, c){
  nn = new NeuralNetwork(a, b, c);
  nn.createModel();
  tf.setBackend('cpu');
}

//Generate new barrier
hole.addEventListener('animationiteration', () => {
  var random = -(Math.random() * 300 + holeHeight);
  hole.style.top = random + "px";
});

setInterval(function(){

  //Predict and jump with AI
  if(aiToggle){
    var xDiff = (blockLeft + (blockWidth / 2)) - (birdRadius / 2); //Horizontal difference of the center of the bird and the center of the block
    var yDiff = (birdHeight - (birdRadius / 2)) - (holeTop - (holeHeight / 2)); //Vertical difference of the center of the bird and the center of the hole
    prediction = nn.predict([vertSpeed, xDiff, yDiff]);
    if(prediction[0] > prediction[1]){
      jump();
    }
  }

  //Count score
  if(blockLeft > canvasWidth / 2 && scoreHelper == 0){
    scoreHelper = 1;
    score++;
  }else if(blockLeft < canvasWidth / 2 && scoreHelper == 1){
    scoreHelper = 0;
  }
  document.getElementById("score").innerHTML = score;

  //Adjust the bird height and his vertical speed
  birdHeight = birdHeight + vertSpeed * speed;
  character.style.top = (canvasHeight - birdHeight) + "px";
  vertSpeed -= 0.2 * speed;
  if(vertSpeed < -5.0 * speed){
    vertSpeed = -5.0 * speed;
  }

  //Did the bird die?
  blockLeft = parseInt(window.getComputedStyle(block).getPropertyValue("left"));
  holeTop = parseInt(window.getComputedStyle(hole).getPropertyValue("top"));
  if(birdHeight <= birdRadius || 
    birdHeight >= canvasHeight || 
    (blockLeft < birdRadius && 
      blockLeft > - blockWidth && 
      (birdHeight > - holeTop || 
        birdHeight - birdRadius < - holeTop - holeHeight
      ))){
    dead = 1;
    vertSpeed = 0.0;
  }

  //Pause if the bird is dead and make it red 
  if(dead){
    document.getElementById("character").style.backgroundColor = "red";
    document.getElementById('block').style.animationPlayState = "paused";
    document.getElementById('hole').style.animationPlayState = "paused";
  }

  //Speed adjusting
  speed = document.getElementById("speedSlider").value / 10;
  document.getElementById("actualSpeed").innerHTML = "Actual setting: " + speed;
  if(!dead){
    document.getElementById("block").style.animation = "block " + 1.5*(1/speed) + "s infinite linear";
    document.getElementById("hole").style.animation = "block " + 1.5*(1/speed) + "s infinite linear";
  }

}, 10); //Every 10 ms

document.body.onkeyup = function(e){
  //Press space to jump
  if(e.key == " " && !dead){
    jump();
  }
  //Press escape to restart
  if(e.key == "Escape"){
    restart();
  }
}

function jump(){
  vertSpeed = jumpHeight;
}

function restart(){
  dead = 0;
  score = -1;

  vertSpeed = 0.0;

  //Reset the bird
  birdHeight = canvasHeight/2.0 + birdRadius/2.0;
  character.style.top = birdHeight + "px";
  document.getElementById("character").style.backgroundColor = "green";

  //Reset the animation
  document.getElementById('hole').style.animation = "none";
  document.getElementById('block').style.animation = "none";
  document.getElementById("hole").offsetHeight;
  document.getElementById('block').offsetHeight;
  document.getElementById('hole').style.animation = null;
  document.getElementById('block').style.animation = null;
  document.getElementById('hole').style.animationPlayState = "running";
  document.getElementById('block').style.animationPlayState = "running";
}
