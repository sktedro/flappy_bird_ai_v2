class NeuralNetwork{
  constructor(a, b, c){
    this.input_nodes = a;
    this.hidden_nodes = b;
    this.output_nodes = c;
    this.createModel();
  }

  createModel(){
    this.model = tf.sequential();

    const hidden = tf.layers.dense({
      units: this.hidden_nodes,
      inputShape: [this.input_nodes],
      activation: "sigmoid" //TODO RELU: ?tf.keras.activations.relu,
    });
    const output = tf.layers.dense({
      units: this.output_nodes,
      activation: "softmax"
    });
    this.model.add(hidden);
    this.model.add(output);
  }

  predict(inputs){
    return tf.tidy(() => {
      const xs = tf.tensor2d([inputs]);
      const ys = this.model.predict(xs);
      return ys.dataSync();
    });
  }
}


// Set up a neural network
function nnSetup(a, b, c){
  let nn = new NeuralNetwork(a, b, c);
  nn.createModel();
  tf.setBackend('cpu');
  return nn;
}

// A simple function to get the weights of the best bird
function getBestWeights(){
  let bestBird = 0;
  for(let i = 0; i < birdsTotal; i++){
    if(bird[i].score > bestBird){
      bestBird = i;
    }
  }
  return bird[bestBird].nn.model.getWeights();
}

// Take the best weights and mutate them (once for every bird)
function mutation(bestWeights){
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
