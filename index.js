require('serialport');

console.log('Hello World');
//68:86:e7:08:54:50

var express = require('express');
var bodyParser = require('body-parser');

var app = express();

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

var sphero = require("sphero"),
    orb = sphero("/COM7"); // change port accordingly 
 
orb.connect(function() {
  console.log('Sphero Connected'); 

  // have Sphero tell you when it detect collisions 
  orb.detectCollisions();
 
  // when Sphero detects a collision, turn red for a second, then back to green 
  orb.on("collision", function(data) {
    console.log("collision detected");
    console.log("  data:", data);
 
    orb.color("red");
 
    setTimeout(function() {
      orb.color("white");
    }, 400);
  });
});

app.post('/', function(req, res){
    res.setHeader('Content-Type', 'text/plain');
    console.log(req.body);

    // turn Sphero green 
    orb.color("green");
  
    // roll Sphero forward 
    orb.roll(req.body.speed, req.body.direction);
    
    res.write('Speed:' + req.body.speed + '\n');
    res.write('Direction:' + req.body.direction);
    res.end();

    setTimeout(function() {
      orb.color("white");
    }, 400);
    
}).listen(9000); 

