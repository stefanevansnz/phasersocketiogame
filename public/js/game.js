var config = {
  type: Phaser.AUTO,
  backgroundColor: '#69c4df',  
  parent: 'phaser-game',
  width: 800,
  height: 600,
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
      gravity: { y: 0 }
    }
  },
  scene: {
    preload: preload,
    create: create,
    update: update
  } 
};

var game = new Phaser.Game(config);

function preload() {
  this.load.image('player', 'assets/friendly_unicorn.png');
  this.load.image('otherPlayer', 'assets/friendly_unicorn.png');
  this.load.image('goal', 'assets/rainbow.png');
}

function create() {
  var self = this;
  this.socket = io();
  this.otherPlayers = this.physics.add.group();
  this.socket.on('currentPlayers', function (players) {
    Object.keys(players).forEach(function (id) {
      if (players[id].playerId === self.socket.id) {
        addPlayer(self, players[id]);
      } else {
        addOtherPlayers(self, players[id]);
      }
    });
  });
  this.socket.on('newPlayer', function (playerInfo) {
    addOtherPlayers(self, playerInfo);
  });
  this.socket.on('disconnect', function (playerId) {
    self.otherPlayers.getChildren().forEach(function (otherPlayer) {
      if (playerId === otherPlayer.playerId) {
        otherPlayer.destroy();
      }
    });
  });
  this.socket.on('playerMoved', function (playerInfo) {
    self.otherPlayers.getChildren().forEach(function (otherPlayer) {
      if (playerInfo.playerId === otherPlayer.playerId) {
        otherPlayer.setRotation(playerInfo.rotation);
        otherPlayer.setPosition(playerInfo.x, playerInfo.y);
      }
    });
  });
  this.cursors = this.input.keyboard.createCursorKeys();

  this.blueScoreText = this.add.text(16, 16, '', { fontSize: '32px', fill: '#7777FF' });
  this.redScoreText = this.add.text(584, 16, '', { fontSize: '32px', fill: '#FF7777' });
  
  this.socket.on('scoreUpdate', function (scores) {
    self.blueScoreText.setText('Blue: ' + scores.blue);
    self.redScoreText.setText('Red: ' + scores.red);
  });

  this.socket.on('goalLocation', function (goalLocation) {
    if (self.goal) self.goal.destroy();
    self.goal = self.physics.add.image(goalLocation.x, goalLocation.y, 'goal');
    self.physics.add.overlap(self.player, self.goal, function () {
      this.socket.emit('goalCollected');
    }, null, self);
  });
}

function addPlayer(self, playerInfo) {
  self.player = self.physics.add.image(playerInfo.x, playerInfo.y, 'player').setOrigin(0.5, 0.5).setDisplaySize(97, 148);
  if (playerInfo.team === 'blue') {
    self.player.setTint(0x7777ff);
  } else {
    self.player.setTint(0xff7777);
  }
  self.player.setDrag(100);
  self.player.setAngularDrag(100);
  self.player.setMaxVelocity(200);
}

function addOtherPlayers(self, playerInfo) {
  const otherPlayer = self.add.sprite(playerInfo.x, playerInfo.y, 'otherPlayer').setOrigin(0.5, 0.5).setDisplaySize(97, 148);
  if (playerInfo.team === 'blue') {
    otherPlayer.setTint(0x7777ff);
  } else {
    otherPlayer.setTint(0xff7777);
  }
  otherPlayer.playerId = playerInfo.playerId;
  self.otherPlayers.add(otherPlayer);
}

function update() {
  if (this.player) {
    if (this.cursors.left.isDown) {
      this.player.setAngularVelocity(-150);
    } else if (this.cursors.right.isDown) {
      this.player.setAngularVelocity(150);
    } else {
      this.player.setAngularVelocity(0);
    }
  
    if (this.cursors.up.isDown) {
      this.physics.velocityFromRotation(this.player.rotation + 1.5, 100, this.player.body.acceleration);
    } else {
      this.player.setAcceleration(0);
    }
  
    this.physics.world.wrap(this.player, 5);

    // emit player movement
    var x = this.player.x;
    var y = this.player.y;
    var r = this.player.rotation;
    if (this.player.oldPosition && (x !== this.player.oldPosition.x || y !== this.player.oldPosition.y || r !== this.player.oldPosition.rotation)) {
      this.socket.emit('playerMovement', { x: this.player.x, y: this.player.y, rotation: this.player.rotation });
    }
    // save old position data
    this.player.oldPosition = {
      x: this.player.x,
      y: this.player.y,
      rotation: this.player.rotation
    };
  }
}