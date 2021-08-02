// Canvas settings
const canvasWidth = 600.0;
const canvasHeight = 500.0;
const backgroundColor = [50, 200, 255];

// Objects and physics settings
const birdRadius = 15.0; // Radius of the bird's body
const holeHeight = 150.0; // Height of the gaps
const pipeWidth = 75.0; // Width of the barrier
// const jumpHeight = 15.0; // Vertical speed to gain when jumping
const jumpHeight = 13.5; // Vertical speed to gain when jumping
const fallSpeed = 1.25;
const birdLeftOffset = 10; // Gap between the left wall and the bird

// Game settings
const birdsTotal = 100; // Total birds spawned

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
const inputNodes = 3; // Inputs: vertical speed, X difference, Y difference
// const inputNodes = 2; // Inputs: X difference, Y difference
const hiddenNodes = 2;
const outputNodes = 2;
const allRandomBirds = 10; // Percentage of birds which will not be mutated, but randomly initialized instead
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
  document.getElementById("slidecontainer").style.width = canvasWidth + "px";

  // Create the canvas
  let canvas = createCanvas(canvasWidth, canvasHeight);
  canvas.position(50, 50);

  // Create a restart button
  let restartBtn = createButton("Restart");
  restartBtn.position(canvasWidth / 4 + 50, 10);
  restartBtn.size(canvasWidth / 2, 25);
  restartBtn.mousePressed(restart);

  // Set up the first pipe and the birds
  for(let i = 0; i < birdsTotal; i++){
    bird[i] = new Bird();
  }
  pipe = new Pipe();

  // Initialize by calling this function
  restart(); 

  document.getElementById("speedSlider").value = document.cookie;
}

// Runs in a continuous loop - once per frame
function draw(){
  // frameRate(int(speed));
  frameRate(30);
  document.getElementById("fps").innerHTML = "Framerate: " + int(frameRate()) + "fps";

  for(let iter = 0; iter < speed; iter++){
    background(backgroundColor);

    // Generate a new pipe if the old one has passed. Also, increment scores
    // Otherwise, move it to the left to create an animation
    if(pipe.x <= - pipeWidth){ 
      pipe.init();
      incrementScore();
      getHighestScore();
    }else{
      pipe.move();
    }
    // And draw it on the canvas
    pipe.draw();

    // Detect collision and draw the bird if it is still alive
    for(let i = 0; i < birdsTotal; i++){
      if(!bird[i].dead){
        bird[i].detectCollision();
        if(!bird[i].dead){
          bird[i].move();
          bird[i].draw();
        }
      }
    }

    if(aiToggle){
      // Restart automatically if all birds are dead
      if(getBirdsAlive() == 0){
        restart();
      }
      // Should the bird (birds) jump?
      for(let i = 0; i < birdsTotal; i++){
        if(!bird[i].dead){
          if(predictJump(pipe, bird[i])){
            bird[i].jump();
          }
        }
      }
    }else{
      // Jump if mouse is pressed
      if(mouseIsPressed && mouse == 0){
        for(let i = 0; i < birdsTotal; i++){
          if(!bird[i].dead){
            bird[i].jump();
          }
        }
        mouse = 1;
      }
    }
  }

  // Get speed from the slider and apply it
  adjustSpeed();

  // Update the number of living birds
  document.getElementById("alive").innerHTML = "Birds alive: " + getBirdsAlive();

}


// A bird...
function Bird(){
  this.x = birdRadius + birdLeftOffset;
  this.color = [Math.random() * 255, Math.random() * 255, Math.random() * 255];

  // Initialize/reset the bird
  this.init = function(){
    this.score = 0;
    this.y = canvasHeight / 2;
    this.vertSpeed = 0.0;
    this.dead = 0;
    this.nn = nnSetup(inputNodes, hiddenNodes, outputNodes); // A bird's neural network
  }
  // Move the bird "according to physics"
  this.move = function(){
    /* this.y -= this.vertSpeed * (frameRate() / frameRateDivisor);
    this.vertSpeed -= 0.2 * (frameRate() / frameRateDivisor); */
    this.y -= this.vertSpeed;
    this.vertSpeed -= fallSpeed;
  }
  // Jumping is simply changing the vertical speed
  this.jump = function(){
    this.vertSpeed = jumpHeight;
  }
  // Check if a bird hit a pipe. Return 1 if yes
  this.detectCollision = function(){
    if(this.y < birdRadius){
      this.dead = 1;
    }else if(this.y > canvasHeight - birdRadius){
      this.dead = 1;
    }else if(
        pipe.x < birdRadius + 10 &&
        pipe.x > - pipeWidth &&
        (this.y + birdRadius > pipe.y + (holeHeight / 2) || this.y - birdRadius < pipe.y - (holeHeight / 2))){
      this.dead = 1;
    }
  }
  // Draw the bord on the canvas
  this.draw = function(){
    fill(this.color);
    ellipse(this.x, this.y, birdRadius * 2, birdRadius * 2);
  }
}

// A pipe...
function Pipe(){
  // Initialize/reset the pipe
  this.init = function(){
    this.y = Math.random() * (canvasHeight - holeHeight * 2) + holeHeight;
    this.x = canvasWidth;
  }
  // Animate the pipe if there is a bird alive
  this.move = function(){
    if(getBirdsAlive() != 0){ 
      /* this.x -= 5 * (frameRate() / frameRateDivisor); */
      this.x -= 15;
    }
  }
  // Draw the pipe
  this.draw = function(){
    fill(50, 200, 50);
    stroke(5);
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
      // Only mutate if this is not the first generation and a score > 0 has
      // been achieved
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
      // Reset the birds
      for(let i = 0; i < birdsTotal; i++){
        bird[i].init();
      }
      // Mutate the weights (if this is not the first run and if the weights have been used to cross at least one pipe)
      if(mutateWeights){
        for(let i = 0; i < birdsTotal * (1 - (allRandomBirds / 100)); i++){
          bird[i].nn.model.setWeights(mutation(bestWeights, mutationProbability / 100, mutationVariability / 100));
        }
      }
    });
  }else{
    // Reset the birds
    for(let i = 0; i < birdsTotal; i++){
      bird[i].init();
    }
  }

  // Reset the pipe
  pipe.init();
}
