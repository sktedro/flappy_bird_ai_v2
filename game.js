let birdLeftOffset = 10;
var birdRadius = 12.5; //Height and width of the bird
var holeHeight = 125.0; //Height of the gaps
var pipeWidth = 50.0; //Width of the barrier

var jumpHeight = 5.0; //Vertical speed to gain when jumping

var vertSpeed = 0.0; //Vertical speed (set to 0.0 as initial)
var blockLeft; //X coordinate of the left side of the barrier
var holeTop; //Y coordinate of the top side of the gap

var canvasWidth = 750.0;
var canvasHeight = 500.0;

var speed = document.getElementById("speedSlider").value; //Game speed

var aiToggle = 1;
var nn = []; //Neural network
var nnInputs = [];
var prediction;

var mouse = 0;

let runNumber = 0;

let birdsTotal = 100;
let bestWeights = [];
let mutationProbability = 0.10; 
let mutationVariability = 0.10; // How much to mutate the weight
let bird = [];
let button;

let topScore = 0;

function Bird(){
  this.score = 0;
  this.y = canvasHeight / 2;
  this.x = birdRadius + birdLeftOffset;
  this.vertSpeed = 0.0;
  this.dead = 0;
  this.color = Math.random() * 155 + 50;

  this.draw = function(){
    fill(this.color);
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
  this.y = Math.random() * (canvasHeight - holeHeight * 2) + holeHeight;
  this.x = canvasWidth;

  this.draw = function(){
    fill(0);
    if(isAnyBirdAlive()){
      this.x -= 5 * speed;
    }
    if(this.x <= - pipeWidth){
      this.y = Math.random() * (canvasHeight - holeHeight * 2) + holeHeight;
      this.x = canvasWidth;

      document.getElementById("score").innerHTML = "Highest score: " + getHighestScore(1);
      document.getElementById("topScore").innerHTML = "Highest score of all generations: " + topScore;

    }
    rect(this.x, 0, pipeWidth, this.y - (holeHeight / 2));
    rect(this.x, this.y + (holeHeight / 2), pipeWidth, canvasHeight);
  }
}

function setup(){
  document.getElementById("info").style.top = canvasHeight + 100 + "px";
  document.getElementById("info").style.width = canvasWidth + "px";
  document.getElementById("score").innerHTML = "Highest score: 0";
  document.getElementById("topScore").innerHTML = "Highest score of all generations: 0";
  document.getElementById("alive").innerHTML = "Birds alive: 0";
  document.getElementById("generation").innerHTML = "Generation: 0";

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

}

function mouseReleased(){
  mouse = 0;
}

function draw(){
  background(220);
  pipe.draw();

  if(mouseIsPressed && mouse == 0){
    for(let i = 0; i < birdsTotal; i++){
      if(!bird[i].dead){
        bird[i].jump();
      }
    }
    mouse = 1;
  }

  for(let i = 0; i < birdsTotal; i++){
    if(!bird[i].dead){
      bird[i].draw();
      bird[i].dead = detectCollision(i);
    }
  }

  adjustSpeed();
  document.getElementById("alive").innerHTML = "Birds alive: " + howManyBirdsAlive();

  //Predict and jump with AI
  if(aiToggle){
    if(!isAnyBirdAlive()){
      restart();
    }
    for(let i = 0; i < birdsTotal; i++){
      var xDiff = pipe.x - (birdLeftOffset + (birdRadius / 2)); //Horizontal difference of the center of the bird and the center of the pipe 
      var yDiff = bird[i].y - pipe.y; //Vertical difference of the center of the bird and the center of the hole
      prediction = nn[i].predict([bird[i].vertSpeed, bird[i].y, xDiff, yDiff]);
      if(prediction[0] > prediction[1]){
        bird[i].jump();
      }
    }
  }
}

function nnSetup(a, b, c){
  return tf.tidy(() => {
    let nn = new NeuralNetwork(a, b, c);
    nn.createModel();
    tf.setBackend('cpu');
    return nn;
  });
}

function restart(){
  runNumber++;
  document.getElementById("score").innerHTML = "Highest score: 0";
  document.getElementById("topScore").innerHTML = "Highest score of all generations: " + topScore;
  document.getElementById("alive").innerHTML = "Birds alive: 0";
  document.getElementById("generation").innerHTML = "Generation: " + runNumber;
  /* if(mutationVariability > 0.01){
    mutationVariability /= runNumber;
  } */

  if(aiToggle){
    tf.tidy(() => {
      if(runNumber > 1){ // Only get best weights and mutate if this is not the first run
        getBestWeights(); // Get best weights from the last run
      }
      for(let i = 0; i < birdsTotal; i++){
        nn[i] = nnSetup(4, 6, 2);
        if(runNumber > 1 && getHighestScore(0) != 0){
          nn[i].model.setWeights(mutation());
        }
      }
    });
  }

  for(let i = 0; i < birdsTotal; i++){
    bird[i] = new Bird();
  }
  pipe = new Pipe();
}


function getHighestScore(increment){
  let highestScore = 0;
  for(let i = 0; i < birdsTotal; i++){
    if(!bird[i].dead && increment){
      bird[i].score++;
    }
    if(bird[i].score > highestScore){
      highestScore = bird[i].score;
    }
  }
  if(highestScore > topScore){
    topScore = highestScore;
  }
  return highestScore;
}

function howManyBirdsAlive(){
  let alive = 0;
  for(let i = 0; i < birdsTotal; i++){
    if(!bird[i].dead){
      alive++;
    }
  }
  return alive;
}

function isAnyBirdAlive(){
  for(let i = 0; i < birdsTotal; i++){
    if(!bird[i].dead){
      return 1;
    }
  }
  return 0;
}

function detectCollision(i){
  if(bird[i].y < birdRadius){
    return 1;
  }else if(bird[i].y > canvasHeight - birdRadius){
    return 1;
  }else if(
    pipe.x < birdRadius + 10 &&
    pipe.x > - pipeWidth &&
    (bird[i].y + birdRadius > pipe.y + (holeHeight / 2) || bird[i].y - birdRadius < pipe.y - (holeHeight / 2))
  ){
    return 1;
  }
  return 0;
}

function adjustSpeed(){
  speed = document.getElementById("speedSlider").value / 10;
  document.getElementById("actualSpeed").innerHTML = "Speed: " + speed + "x";
}

function getBestWeights(){ // A simple function to get indexes of the best birds
  let bestBird = 0;
  for(let i = 0; i < birdsTotal; i++){
    if(bird[i].score > bestBird){
      bestBird = i;
    }
  }

  bestWeights = nn[bestBird].model.getWeights();
}

function mutation(){
  return tf.tidy(() => {
    let mutatedWeights = [];
    for(let i = 0; i < bestWeights.length; i++){
      let shape = bestWeights[i].shape;
      let tensor = bestWeights[i];
      let values = tensor.dataSync().slice();
      for(let j = 0; j < values.length; j++){
        if(Math.random(0, 1) < mutationProbability){
          values[j] *= (1 + Math.random(- mutationVariability, mutationVariability));
        }
      }
      let newTensor = tf.tensor(values, shape);
      mutatedWeights[i] = newTensor;
    }
    return mutatedWeights;
  });
}
