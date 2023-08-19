var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io').listen(server);
var Filter = require('bad-words'),
    filter = new Filter();

var players = {};
var goal = {
  x: Math.random(),
  y: Math.random()
};
var scores = {
  blue: 0,
  red: 0
};

app.use(express.static(__dirname + '/public'));

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function (socket) {
  console.log('a user connected: ', socket.id);
  // create a new player and add it to our players object
  players[socket.id] = {
    rotation: 0,
    x: Math.floor(Math.random() * 700) + 50,
    y: Math.floor(Math.random() * 500) + 50,
    playerId: socket.id,
    playerName: '',
    team: (Math.floor(Math.random() * 2) == 0) ? 'red' : 'blue'
  };
  // send the players object to the new player
  socket.emit('currentPlayers', players);
  // send the goal object to the new player
  console.log('goal create at x: ' + goal.x + ' y: ' + goal.y)
  socket.emit('goalLocation', goal);
  // send the current scores
  socket.emit('scoreUpdate', scores);
  // update all other players of the new player
  socket.broadcast.emit('newPlayer', players[socket.id]);

  // when a player disconnects, remove them from our players object
  socket.on('disconnect', function () {
    console.log('user disconnected: ', socket.id);
    delete players[socket.id];
    // emit a message to all players to remove this player
    io.emit('disconnect', socket.id);
  });

  // when a player is created update the player data
  socket.on('playerCreated', function (newPlayer) {    
    console.log('player was created: ' + socket.id + ' and entered name: ' + newPlayer.name)
    var filteredName = filter.clean( newPlayer.name);
    players[socket.id].playerName = filteredName;
    console.log('player name updated to filtered name: ' + filteredName)
    // emit a message to all players about the player name
    socket.broadcast.emit('playerCreatedComplete', players[socket.id]);
  });

  // when a player moves, update the player data
  socket.on('playerMovement', function (movementData) {
    //console.log('playerMovement ' + movementData.x + ' ' + movementData.y)
    players[socket.id].x = movementData.x;
    players[socket.id].y = movementData.y;
    players[socket.id].rotation = movementData.rotation;
    // emit a message to all players about the player that moved
    socket.broadcast.emit('playerMoved', players[socket.id]);
  });

  socket.on('goalCollected', function () {
    if (players[socket.id].team === 'red') {
      scores.red += 10;
    } else {
      scores.blue += 10;
    }
    goal.x = Math.random();
    goal.y = Math.random();
    console.log('goal updated to: x: ' + goal.x + ' y: ' + goal.y)
    io.emit('goalLocation', goal);
    io.emit('scoreUpdate', scores);
  });
});

server.listen(3070, function () {
  console.log(`Unicorn Game is listening on ${server.address().port}`);
});
