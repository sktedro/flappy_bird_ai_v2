# Brief

This is the second version of AI flappy bird which I only wrote to learn. This 
time it's programmed in JavaScript using p5.js and tf.js libraries, so it runs 
in a browser.

I understand this is ugly and inefficient and that if I was to read my code in 
a month I would get very confused. My goal was only to learn the basics. 

All variables you might want to adjust are on top of the game.js file.
Speed is adjustable in the user interface and goes up to 100x. Keep in mind
that with 100 birds, even 10x speed might make it laggy and slow. However, on
my computer, when there is only one, two or three birds left, even 100x works
fine.

You can let AI learn to play, but by disabling aiToggle and setting birdsTotal
to 1, you can try and play it yourself.
With default settings it was able to achieve more than 280'000 score by 10th
generation (check img/screenshot2.png). What I don't understand is how does a 
bird "die" by a pipe if it has successfully passed more than 280'000 of them 
already...

I wanted to create a branch and try to solve this using ml5, but that is not a
possibility since ml5 needs data to learn, while this problem requires a "try
and adjust" solution.

# Screenshot

![Alt text](./img/screenshot.png?raw=true "Title")

# Differences from the v1

The first version was coded (mainly) in C. This one is in JS (with p5). This
has major efficiency effects.

The second version runs in a browser!

The second version has much better graphics, lol.

The second version uses a library that was written by someone who knows
what he is doing (tensorflow.js).

The second version has adjustable speed.

And many more which I can't think of right now.

# Credits and sources

Huge thanks to Daniel Shiffman ("The Coding Train") for his online videos which
inspired this small project and helped when I was stuck.
