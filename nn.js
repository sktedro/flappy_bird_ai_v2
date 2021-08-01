
class NeuralNetwork{
  constructor(a, b, c){
    tf.tidy(() => {
    this.input_nodes = a;
    this.hidden_nodes = b;
    this.output_nodes = c;
    this.createModel();
    });
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
      const outputs = ys.dataSync();
      return outputs;
    });
  }
}

