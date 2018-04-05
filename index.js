require('serialport');

var express = require('express');
var bodyParser = require('body-parser');
var connected = false;
var inCalibrationMode = false;

var app = express();

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

var Sphero = require("sphero");
var orb = Sphero("/COM9");
var busy = false;

try {
    connectToSphero(orb, "blue");
} catch (err) {
    console.log('Could Not Connect To Sphero');
}


app.get('/connect', function(req, res){
  res.setHeader('Content-Type', 'text/plain');
  console.log(req.body);

  orbColor = "blue";

  orb.connect(function(err, data) {
    if (null === err) {
      console.log('Sphero Connected'); 

      // turn on listener to detect collisions 
      orb.detectCollisions();
      orb.setRotationRate(255, function(err, data) {
        console.log(err || "data: " + data);
      });

      // when Sphero detects a collision, turn red for a second, then back to green 
      orb.on("collision", function(data) {
        console.log("collision detected");
        console.log("  data:", data);
    
        orb.color("red");
    
        setTimeout(function() {
          orb.color(orbColor);
        }, 400);
      });

      res.write('Sphero Connected');
      connected = true;
      res.end();
    } else {
      res.write('Connection Failure: ' + err.message);
      connected = true;
      res.end();
    }
  });
}).listen(9001);

app.post('/setHeading', function(req, res){
  var heading = req.body.direction;

  if (connected) {
    res.setHeader('Content-Type', 'text/plain');
    console.log('Set Header Request: ' + req.body);

    orb.roll(1, heading, 2, function() {
      setTimeout(function() {
        orb.setHeading(0, function() {
          orb.roll(0,0,1);
          res.write('Heading Set');
          res.end();
        });
      }, 300);
    });
  }
}); 

app.get('/calibrate', function(req, res){
  if (connected) {
    orb.startCalibration(function(err, data){
      if (!err){
        inCalibrationMode = true;
        res.setHeader('Content-Type', 'text/plain');
        res.write('Calibration Started');
        res.end();
      }
    });
  }
}).listen(9000);

app.get('/endCalibration', function(req, res){
  if (connected) {
    orb.finishCalibration(function(err, data){
      if (!err){
        inCalibrationMode = false;
        res.setHeader('Content-Type', 'text/plain');
        res.write('Calibration Ended');
        res.end();
      }
    });
  }
}).listen(9003);

app.get('/disconnect', function(req, res){
  orb.disconnect(function(){
    console.log('Sphero Disconnected');

    res.write('Sphero Disconnected');
    res.end();
  });
}).listen(9002);

app.post('/', function(req, res){
  if (connected) {
    res.setHeader('Content-Type', 'text/plain');
    console.log(req.body);

    //set color
    // orb.randomColor(function(err, data) {
    //   console.log(err || "Random Color!");
    // });

    //forced SLOW speed 
    //orb.speed = 2;

    // roll Sphero forward 
    orb.roll(req.body.speed, req.body.direction);
    // busy = true;
    
    res.write('Speed:' + req.body.speed + '\n');
    res.write('Direction:' + req.body.direction);
    res.end();

    // setTimeout(function() {
    //   //orb.randomColor("white");
    //   // orb.stop(function(err, data) {
    //   //   console.log(err || "data" + data);
    //   // });
    //   orb.roll(0, req.body.direction);
    //   busy = false;
    // }, 500);
  }
}); 

app.get('/runMacro/:macroId', function(req, res){
  var macroId = req.params.macroId;
  
  console.log('Macro ' + macroId)

  if (connected) {
    // orb.runMacro(macroId, function(err, data){
    //   if (!err){
    //     res.setHeader('Content-Type', 'text/plain');
    //     res.write('Macro ' + macroId);
    //     res.end();
    //   }
    // });
    orb.getPermOptionFlags(function(err, data) {
      if (err) {
        console.log("error: ", err);
      } else {
        console.log("data:");
        console.log("  sleepOnCharger:", data.sleepOnCharger);
        console.log("  vectorDrive:", data.vectorDrive);
        console.log("  selfLevelOnCharger:", data.selfLevelOnCharger);
        console.log("  tailLedAlwaysOn:", data.tailLedAlwaysOn);
        console.log("  motionTimeouts:", data.motionTimeouts);
        console.log("  retailDemoOn:", data.retailDemoOn);
        console.log("  awakeSensitivityLight:", data.awakeSensitivityLight);
        console.log("  awakeSensitivityHeavy:", data.awakeSensitivityHeavy);
        console.log("  gyroMaxAsyncMsg:", data.gyroMaxAsyncMsg);
      }
    })        
  }
}).listen(9004);

function connectToSphero(orb, orbColor) {
  orb.connect(function(err, data) {
    if (null === err) {
      console.log('Sphero Connected'); 

      // turn on listener to detect collisions 
      orb.detectCollisions();
      orb.color = orbColor;

      // when Sphero detects a collision, turn red for a second, then back to green 
      orb.on("collision", function(data) {
        console.log("collision detected");
        console.log("  data:", data);
    
        //orb.color("red");
    
        // setTimeout(function() {
        //   //orb.color(orbColor);
        // }, 400);
      });

      connected = true;
    }
  });
}