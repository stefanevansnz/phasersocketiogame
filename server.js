var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io').listen(server);
var Filter = require('bad-words'),
    filter = new Filter();

var players = {};
var goal = {
  x: 0.25,
  y: 0.25
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
    x: 0.5,
    y: 0.5,
    playerId: socket.id,
    playerName: '',
    score: 0
  };
  // send the players object to the new player
  socket.emit('currentPlayers', players);
  // send the goal object to the new player
  console.log('goal create at x: ' + goal.x + ' y: ' + goal.y)
  socket.emit('goalLocation', goal);
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
    players[socket.id].score += 1;
    goal.x = Math.random();
    goal.y = Math.random();
    console.log('goal updated to: x: ' + goal.x + ' y: ' + goal.y);
    io.emit('goalLocation', goal);
    console.log('playerScored name: ' + players[socket.id].playerName + ' score: ' +players[socket.id].score);    
    io.emit('playerScored', players[socket.id]);
  });
});

server.listen(3070, function () {
  console.log(`Unicorn Game is listening on ${server.address().port}`);
});
