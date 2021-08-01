// Canvas settings
const canvasWidth = 600.0;
const canvasHeight = 500.0;
const backgroundColor = [50, 200, 255];

// Objects and physics settings
const birdRadius = 12.5; // Radius of the bird's body
const holeHeight = 125.0; // Height of the gaps
const pipeWidth = 50.0; // Width of the barrier
const jumpHeight = 5.0; // Vertical speed to gain when jumping
const birdLeftOffset = 10; // Gap between the left wall and the bird

// Game settings
const birdsTotal = 50; // Total birds spawned

// Game variables
let bird = []; // Array of all the birds
let pipe; // A pipe. Only one exists at a time
let topScoreThisGen = 0; // Top score of the last generation
let topScoreAllGens = 0; // Top score of all generations
let speed; // Game speed
let mouse = 0; // Variable just to make sure clicking results in jumping only once
let runNumber = 0; // "Generation number"
const frameRateDivisor = 10; //Speed is based on actual framerate divided by this number

// AI settings
const aiToggle = 1; // Toggle controlling the birds by a neural network
const mutationProbability = 20.0; // Probability of a certain weight to be mutated (percent)
const initialMutationVariability = 20.0; // How much to mutate the weight (max percent)
const minMutationVariability = 0.001; // Mutation variability won't go lower than this (percent)
let mutationVariability = initialMutationVariability; 

// AI variables
// const inputNodes = 3; // Inputs: vertical speed, X difference, Y difference
const inputNodes = 2; // Inputs: X difference, Y difference
const hiddenNodes = 4;
const outputNodes = 2;
let highestScoreGen; // = 1 if this generation has a bird with the highest score of all generations
let bestWeights = []; // Best weights taken from the best bird of the last generation


// Runs once at the beginning
function setup(){
  // Prepare the HTML
  document.getElementById("info").style.top = canvasHeight + 100 + "px";
  document.getElementById("info").style.width = canvasWidth + "px";
  document.getElementById("score").innerHTML = "Highest score of this generation: 0";
  document.getElementById("topScore").innerHTML = "Highest score of all generations: 0";
  document.getElementById("alive").innerHTML = "Birds alive: 0";
  document.getElementById("generation").innerHTML = "Generation: 0";

  // Create the canvas
  let canvas = createCanvas(canvasWidth, canvasHeight);
  canvas.position(50, 50);

  // Restart button
  let restartBtn = createButton("Restart");
  restartBtn.position(canvasWidth / 4 + 50, 10);
  restartBtn.size(canvasWidth / 2, 25);
  restartBtn.mousePressed(restart);

  // Set up the first pipe and the birds
  restart();

  document.getElementById("speedSlider").value = document.cookie;
}

// Runs in a continuous loop - once per frame
function draw(){
  frameRate(int(speed));
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
      // Also give the neural network the bird's vertical speed
      // let prediction = bird[i].nn.predict([bird[i].vertSpeed, xDiff, yDiff]);
      let prediction = bird[i].nn.predict([xDiff, yDiff]);
      // Follow the decision to jump or not
      if(prediction[0] > prediction[1]){
        bird[i].jump();
      }
    }
  }
}


// A bird...
function Bird(){
  this.score = 0;
  this.y = canvasHeight / 2;
  this.x = birdRadius + birdLeftOffset;
  this.vertSpeed = 0.0;
  this.dead = 0;
  this.color = [Math.random() * 255, Math.random() * 255, Math.random() * 255];
  this.nn = nnSetup(inputNodes, hiddenNodes, outputNodes); // A bird's neural network

  // Move the bird based on "physics" and draw it on the canvas
  this.draw = function(){
    fill(this.color);
    this.y -= this.vertSpeed * (frameRate() / frameRateDivisor);
    this.vertSpeed -= 0.2 * (frameRate() / frameRateDivisor);
    ellipse(this.x, this.y, birdRadius * 2, birdRadius * 2);
  }

  // Jumping is simply changing the vertical speed
  this.jump = function(){
    this.vertSpeed = jumpHeight;
  }
}

// A pipe...
function Pipe(){
  this.y = Math.random() * (canvasHeight - holeHeight * 2) + holeHeight;
  this.x = canvasWidth;

  this.draw = function(){
    fill(50, 200, 50);
    stroke(5);
    // Animate the pipe if there is a bird alive
    if(howManyBirdsAlive() != 0){ 
      this.x -= 5 * (frameRate() / frameRateDivisor);
    }
    // Generate new pipe if the old one is out of the canvas
    if(this.x <= - pipeWidth){ 
      this.y = Math.random() * (canvasHeight - holeHeight * 2) + holeHeight;
      this.x = canvasWidth;
      incrementScore();
      getHighestScore();
    }
    // Draw the pipe
    rect(this.x, 0, pipeWidth, this.y - (holeHeight / 2));
    rect(this.x, this.y + (holeHeight / 2), pipeWidth, canvasHeight);
  }
}

// Begin new run (generation) by resetting pretty much everything
function restart(){
  runNumber++;
  document.getElementById("score").innerHTML = "Highest score of this generation: 0";
  document.getElementById("topScore").innerHTML = "Highest score of all generations: " + topScoreAllGens;
  document.getElementById("alive").innerHTML = "Birds alive: 0";
  document.getElementById("generation").innerHTML = "Generation: " + runNumber;

  // Clone and mutate weights of the previous generation to use with a new one
  if(aiToggle){
    tf.tidy(() => {
      let mutateWeights = runNumber != 1 && topScoreThisGen;
      if(mutateWeights){
        // Adjust the mutation variability based on the highest score
        adjustMutation();
        // Get the best weights from the last run if they are better than the
        // previous best ones
        if(highestScoreGen){
          bestWeights = getBestWeights(); 
        }
      }
      // Create new birds
      for(let i = 0; i < birdsTotal; i++){
        bird[i] = new Bird();
      }
      // Mutate the weights (if this is not the first run and if the weights have been used to cross at least one pipe)
      if(mutateWeights){
        for(let i = 0; i < birdsTotal; i++){
          bird[i].nn.model.setWeights(mutation(bestWeights, mutationProbability / 100, mutationVariability / 100));
        }
      }
    });
  }else{
    // Create new birds
    for(let i = 0; i < birdsTotal; i++){
      bird[i] = new Bird();
    }
  }

  // Create a new pipe
  pipe = new Pipe();
}
