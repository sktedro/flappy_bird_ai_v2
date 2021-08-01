// Don't jump more than once after pressing the left mouse button
function mouseReleased(){
  mouse = 0;
}

// Increment scores of birds that are still alive
function incrementScore(){
  for(let i = 0; i < birdsTotal; i++){
    if(!bird[i].dead){
      bird[i].score++;
    }
  }
}

// Return highest score of all birds this generation
function getHighestScore(){
  topScoreThisGen = 0;
  for(let i = 0; i < birdsTotal; i++){
    if(bird[i].score > topScoreThisGen){
      topScoreThisGen = bird[i].score;
    }
  }
  if(topScoreThisGen > topScoreAllGens){
    topScoreAllGens = topScoreThisGen;
    highestScoreGen = 1;
  }else{
    highestScoreGen = 0;
  }
  document.getElementById("score").innerHTML = "Highest score of this generation: " + topScoreThisGen;
  document.getElementById("topScore").innerHTML = "Highest score of all generations: " + topScoreAllGens;
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

// Adjust speed based on the slider and update the stats
function adjustSpeed(){
  speed = document.getElementById("speedSlider").value;
  document.cookie = speed;
  document.getElementById("actualSpeed").innerHTML = "Framerate setting: " + speed + "fps<br>Actual framerate: " + int(frameRate()) + "fps";
}

// Adjust the mutation variability based on the highest score
function adjustMutation(){
  // Divisor is used to generate a nice decline in mutation variability:
  // We want to mutate "less" the higher the score
  let divisor = Math.pow(topScoreAllGens / 10, 2);
  mutationVariability = initialMutationVariability / divisor;
  // But keep the variability in range of the initial and minimal variability
  if(mutationVariability < minMutationVariability){
    mutationVariability = minMutationVariability;
  }else if(mutationVariability > initialMutationVariability){
    mutationVariability = initialMutationVariability;
  }
  console.log("Mutation variability (%): " + mutationVariability);
}
