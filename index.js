require('serialport');

var express = require('express');
var bodyParser = require('body-parser');
var player1Connected = false;
var player2Connected = false;
var player1InCalibrationMode = false;
var player2InCalibrationMode = false;

var app = express();

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

var Sphero = require("sphero"),
    player1Orb = Sphero("/COM9");
    //player2Orb = Sphero("/COM9"); 

try {
    connectToSphero(player1Orb, 1, "blue");
    //connectToSphero(player2Orb, 2, "purple");
} catch (err) {
    console.log('Could Not Connect To Sphero');
}


app.get('/connect/:player', function(req, res){
  res.setHeader('Content-Type', 'text/plain');
  console.log(req.body);

  switch(req.params.player) {
    case 1:
      orb = player1Orb;
      orbColor = "red";
      break;
    case 2:
      orb = player2Orb;
      orbColor = "blue";
      break;
    default:
      exit;
  }

  orb.connect(function(err, data) {
    if (null === err) {
      console.log('Sphero Connected'); 

      // turn on listener to detect collisions 
      orb.detectCollisions();

      // when Sphero detects a collision, turn red for a second, then back to green 
      orb.on("collision", function(data) {
        console.log("collision detected");
        console.log("  data:", data);
    
        orb.color("red");
    
        setTimeout(function() {
          orb.color(orbColor);
        }, 400);
      });

      res.write('Sphero ' + req.params.player + ' Connected');
      player1Connected = true;
      res.end();
    } else {
      res.write('Connection Failure: ' + err.message);
      player1Connected = true;
      res.end();
    }
  });
}).listen(9001);

app.post('/setHeading', function(req, res){
  var player = req.body.player; 
  var heading = req.body.direction;

  if (PlayerIsConnected(player)) {
    res.setHeader('Content-Type', 'text/plain');
    console.log('Set Header Request: ' + req.body);

    orb = GetPlayersOrb(player);

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

app.get('/calibrate/:player', function(req, res){
  var player = req.params.player;
  if (PlayerIsConnected(player)) {
    orb = GetPlayersOrb(player);

    orb.startCalibration(function(err, data){
      if (!err){
        SetPlayerCalibrationMode(player, true);
        res.setHeader('Content-Type', 'text/plain');
        res.write('Calibration Started');
        res.end();
      }
    });
  }
}).listen(9000);

app.get('/endCalibration/:player', function(req, res){
  var player = req.params.player;
  if (PlayerIsConnected(player)) {
    orb = GetPlayersOrb(player);

    orb.finishCalibration(function(err, data){
      if (!err){
        SetPlayerCalibrationMode(player, false);
        res.setHeader('Content-Type', 'text/plain');
        res.write('Calibration Ended');
        res.end();
      }
    });
  }
}).listen(9003);

app.get('/disconnect/:player', function(req, res){
  var orb = GetPlayersOrb(req.params.player);
  orb.disconnect(function(){
    console.log('Sphero ' + player + ' Disconnected');

    res.write('Sphero Disconnected');
    //SetPlayerConnected(player, false);
    res.end();
  });
}).listen(9002);

app.post('/', function(req, res){
  var player = req.body.player;

  if (PlayerIsConnected(player)) {
    res.setHeader('Content-Type', 'text/plain');
    console.log(req.body);

    var orb = GetPlayersOrb(player);

    //set color
    // orb.randomColor(function(err, data) {
    //   console.log(err || "Random Color!");
    // });

    //forced SLOW speed 
    //orb.speed = 2;

    // roll Sphero forward 
    orb.roll(req.body.speed, req.body.direction);
    
    res.write('Speed:' + req.body.speed + '\n');
    res.write('Direction:' + req.body.direction);
    res.end();

    // setTimeout(function() {
    //   //orb.randomColor("white");
    //   // orb.stop(function(err, data) {
    //   //   console.log(err || "data" + data);
    //   // });
    //   orb.roll(0, req.body.direction);
    // }, 500);
  }
}); 

app.get('/runMacro/:player/:macroId', function(req, res){
  var player = req.params.player;
  var macroId = req.params.macroId;
  
  console.log('Player ' + player + ', Macro ' + macroId)

  if (PlayerIsConnected(player)) {
    var orb = GetPlayersOrb(player);

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

function connectToSphero(orb, player, orbColor) {
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

      switch (player) {
        case 1:
          player1Connected = true;
          break;
        case 2:
          player2Connected = true;
          break;
        default:
          break;
      }
    }
  });
}

function GetPlayersOrb(player) {
  switch(parseInt(player)) {
    case 1:
      orb = player1Orb;
      break;
    case 2:
      orb = player2Orb;
      break;
    default:
      break;
  }
  return orb;
}

function PlayerIsInCalibrationMode(player) {
  switch(parseInt(player)) {
    case 1:
      return player1InCalibrationMode;
    case 2:
      return player2InCalibrationMode;
    default:
      break;
  }
}

function PlayerIsConnected(player) {
  switch(parseInt(player)) {
    case 1:
      return player1Connected;
    case 2:
      return player2Connected;
    default:
      break;
  }
}

function SetPlayerCalibrationMode(player, value) {
  switch(parseInt(player)) {
    case 1:
      player1InCalibrationMode = value;
      break;
    case 2:
      player2InCalibrationMode = value;
      break;
    default:
      break;
  }
}
