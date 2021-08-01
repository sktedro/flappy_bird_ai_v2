let canvasWidth = 600.0;
let canvasHeight = 500.0;
let backgroundColor = 220;

let birdRadius = 12.5; // Radius of the bird's body
let holeHeight = 125.0; // Height of the gaps
let pipeWidth = 50.0; // Width of the barrier
let jumpHeight = 5.0; // Vertical speed to gain when jumping


let birdsTotal = 100; // Total birds spawned
let bird = []; // Array of all the birds
let birdLeftOffset = 10; // Gap between the left wall and the bird
let topScore = 0; // Top score of all generations
let pipe; // A pipe. Only one exists at a time
let speed = document.getElementById("speedSlider").value; // Game speed
let mouse = 0; // Variable just to make sure clicking results in jumping only once
let restartBtn; // Restart button
let runNumber = 0; // "Generation number"

let aiToggle = 1; // Toggle controlling the birds by a neural network
let nn = []; // Neural networks (one for every bird)
let mutationProbability = 0.20; // Probability of a certain weight to be mutated
let mutationVariability = 0.05; // How much to mutate the weight
let bestWeights = []; // Best weights taken from the best bird of the last generation


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
    if(howManyBirdsAlive() != 0){
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
  // Prepare the HTML
  document.getElementById("info").style.top = canvasHeight + 100 + "px";
  document.getElementById("info").style.width = canvasWidth + "px";
  document.getElementById("score").innerHTML = "Highest score: 0";
  document.getElementById("topScore").innerHTML = "Highest score of all generations: 0";
  document.getElementById("alive").innerHTML = "Birds alive: 0";
  document.getElementById("generation").innerHTML = "Generation: 0";

  // Create the canvas
  let canvas = createCanvas(canvasWidth, canvasHeight);
  canvas.position(50, 50);

  // Restart button
  restartBtn = createButton("Restart");
  restartBtn.position(canvasWidth / 4 + 50, 10);
  restartBtn.size(canvasWidth / 2, 25);
  restartBtn.mousePressed(restart);

  // Set up the first pipe and the birds
  restart();
}

function mouseReleased(){
  mouse = 0;
}

function draw(){
  background(backgroundColor);
  pipe.draw();

  // Jump if mouse is pressed
  if(!aiToggle && mouseIsPressed && mouse == 0){
    for(let i = 0; i < birdsTotal; i++){
      if(!bird[i].dead){
        bird[i].jump();
      }
    }
    mouse = 1;
  }

  // Detect collision and draw the bird if it is still alive
  for(let i = 0; i < birdsTotal; i++){
    if(!bird[i].dead){
      bird[i].dead = detectCollision(i);
      if(!bird[i].dead){
        bird[i].draw();
      }
    }
  }

  // Get speed from the slider and apply it
  adjustSpeed();

  // Update the number of living birds
  document.getElementById("alive").innerHTML = "Birds alive: " + howManyBirdsAlive();

  // Predict and jump with AI
  if(aiToggle){
    // Restart automatically if all birds are dead
    if(howManyBirdsAlive() == 0){
      restart();
    }
    for(let i = 0; i < birdsTotal; i++){
      // Horizontal difference of the center of the bird and the center of the pipe 
      let xDiff = pipe.x - (birdLeftOffset + (birdRadius / 2)); 
      // Vertical difference of the center of the bird and the center of the hole
      let yDiff = bird[i].y - pipe.y; 
      // Also give the neural network the bird's vertical speed and height
      let prediction = nn[i].predict([bird[i].vertSpeed, bird[i].y, xDiff, yDiff]);
      // Follow the decision to jump or not
      if(prediction[0] > prediction[1]){
        bird[i].jump();
      }
    }
  }
}

function nnSetup(a, b, c){
  let nn = new NeuralNetwork(a, b, c);
  nn.createModel();
  tf.setBackend('cpu');
  return nn;
}

function restart(){
  runNumber++;
  document.getElementById("score").innerHTML = "Highest score: 0";
  document.getElementById("topScore").innerHTML = "Highest score of all generations: " + topScore;
  document.getElementById("alive").innerHTML = "Birds alive: 0";
  document.getElementById("generation").innerHTML = "Generation: " + runNumber;

  if(aiToggle){
    tf.tidy(() => {
      if(runNumber == 1){
        // Create the neural networks
        for(let i = 0; i < birdsTotal; i++){
          nn[i] = nnSetup(4, 6, 2);
        }
      }else{ // Only get best weights and mutate if this is not the first run
        // Get best weights from the last run
        getBestWeights(); 
        // Mutate the weights
        for(let i = 0; i < birdsTotal; i++){
          if(getHighestScore(0) != 0){
            nn[i].model.setWeights(mutation());
          }
        }
      }
    });
  }

  for(let i = 0; i < birdsTotal; i++){
    bird[i] = new Bird();
  }
  pipe = new Pipe();
}


// Return highest score of all birds this generation (and prior to that,
// increment their score if increment == 1)
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

// Return number of birds still alive
function howManyBirdsAlive(){
  let alive = 0;
  for(let i = 0; i < birdsTotal; i++){
    if(!bird[i].dead){
      alive++;
    }
  }
  return alive;
}

// Check if a bird hit a pipe. Return 1 if yes
function detectCollision(i){
  if(bird[i].y < birdRadius){
    return 1;
  }else if(bird[i].y > canvasHeight - birdRadius){
    return 1;
  }else if(
    pipe.x < birdRadius + 10 &&
    pipe.x > - pipeWidth &&
    (bird[i].y + birdRadius > pipe.y + (holeHeight / 2) || bird[i].y - birdRadius < pipe.y - (holeHeight / 2))){
    return 1;
  }
  return 0;
}

function adjustSpeed(){
  speed = document.getElementById("speedSlider").value / 10;
  document.getElementById("actualSpeed").innerHTML = "Speed: " + speed + "x";
}

// A simple function to get the weights of the best bird
function getBestWeights(){ 
  let bestBird = 0;
  for(let i = 0; i < birdsTotal; i++){
    if(bird[i].score > bestBird){
      bestBird = i;
    }
  }
  bestWeights = nn[bestBird].model.getWeights();
}

// Take the best weights and mutate them (once for every bird)
function mutation(){ 
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
}
