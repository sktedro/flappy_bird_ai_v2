var birdRadius = 25.0; //Height and width of the bird
var holeHeight = 100.0; //Height of the gaps
var blockWidth = 50.0; //Width of the barrier

var jumpHeight = 5.0; //Vertical speed to gain when jumping

var dead = 0; //Is the bird dead?
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

//Y coordinate of the top of the bird
var birdHeight = canvasHeight - parseInt(window.getComputedStyle(character).getPropertyValue("top")); 


function setUp(){
  block.style.width = blockWidth + "px";
  hole.style.width = blockWidth + "px";
  hole.style.height = holeHeight + "px";
  character.style.width = character.style.height = birdRadius + "px";
}

//Generate new barrier
hole.addEventListener('animationiteration', () => {
  var random = -(Math.random() * 300 + holeHeight);
  hole.style.top = random + "px";
});

setInterval(function(){
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
