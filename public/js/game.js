
class UnicornGame extends Phaser.Scene
{
  GAME_WIDTH = 640;
  GAME_HEIGHT = 1190;

  backgroundScene;
  parent;
  sizer;
  player;
  playername;

  otherPlayers;

  inputText;
  inputName = '';

  joyStickState = '';

  preload() {
    this.load.image('player', 'assets/friendly_unicorn.png');
    this.load.image('otherPlayer', 'assets/friendly_unicorn.png');
    this.load.image('goal', 'assets/rainbow.png');

    var url;
    url = 'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexvirtualjoystickplugin.min.js';
    this.load.plugin('rexvirtualjoystickplugin', url, true);

    this.load.plugin('rexinputtextplugin', 'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexinputtextplugin.min.js', true);
  }

  create() {
    console.log('create');
    let { width, height } = this.sys.game.canvas;

    this.inputText = this.add.rexInputText(width / 2, height / 3, width - 50, 100, {
        type: 'text',
        border: 4,
        color: '#000000',
        borderColor: '#1b5e20',
        fontSize: '70px',
        backgroundColor: '#ffffff',
        maxLength: 10,
        minLength: 0,    
        placeholder: 'Press to enter name',
        autoComplete: 'off',
        align: 'center'
    })
    .on('blur', function (inputText) {
      console.log('On blur');
    })

    this.inputText.setFocus();

    this.startGameButton = this.add.text(width / 2, (height / 3) + 200, 'Join game', { 
      fill: '#cccccc',
      fontSize: '80px',
      color: '#000000',
      backgroundColor: '#1b5e20',
    }).setOrigin(0.5,0.5);
    this.startGameButton.setInteractive();
    this.startGameButton.on('pointerdown', () => this.startGame() );

  }

  startGame() {
    var name = this.inputText.text;
    console.log('start game with name ' + name);
    if(name.value != "") {
        // get value and remove form
        this.inputName = name;

        this.startGameButton.destroy();
        this.inputText.destroy();

        const width = this.scale.gameSize.width;
        const height = this.scale.gameSize.height;
    
        this.parent = new Phaser.Structs.Size(width, height);
        this.sizer = new Phaser.Structs.Size(this.GAME_WIDTH, this.GAME_HEIGHT, Phaser.Structs.Size.FIT, this.parent);
    
        this.parent.setSize(width, height);
        this.sizer.setSize(width, height);
    
        console.log('size width: ' + width + ' height:' + height);
    
        this.updateCamera();
    
        this.scale.on('resize', this.resize, this);
    
        this.joyStick = this.plugins.get('rexvirtualjoystickplugin').add(this, {
          x: width / 2,
          y: height / 2,
          radius: 100,
          base: this.add.circle(0, 0, 100, 0x888888),
          thumb: this.add.circle(0, 0, 50, 0xcccccc),
          // dir: '8dir',   // 'up&down'|0|'left&right'|1|'4dir'|2|'8dir'|3
          // forceMin: 16,
          // enable: true
        })
        .on('update', this.dumpJoyStickState, this);
    
        this.dumpJoyStickState();
    
        // game below
        var self = this;
        this.socket = io();
        this.otherPlayers = this.physics.add.group();
        this.socket.on('currentPlayers', function (players) {
          Object.keys(players).forEach(function (id) {
            if (players[id].playerId === self.socket.id) {
              self.addPlayer(self, players[id]);
            } else {
              self.addOtherPlayers(self, players[id]);
            }
          });
        });
        this.socket.on('newPlayer', function (playerInfo) {
          self.addOtherPlayers(self, playerInfo);
        });
        this.socket.on('disconnect', function (playerId) {
          self.otherPlayers.getChildren().forEach(function (otherPlayer) {
            if (playerId === otherPlayer.playerId) {
              otherPlayer.destroy();
              otherPlayer.playerText.destroy(); 
            }
          });
        });
        this.socket.on('playerMoved', function (playerInfo) {
          self.otherPlayers.getChildren().forEach(function (otherPlayer) {
            if (playerInfo.playerId === otherPlayer.playerId) {
              otherPlayer.setRotation(playerInfo.rotation);
              otherPlayer.setPosition(playerInfo.x, playerInfo.y);
              // change player text on move
              otherPlayer.playerText.x = playerInfo.x - 60;
              otherPlayer.playerText.y = playerInfo.y - 60;
            }
          });
        });
        this.socket.on('playerCreatedComplete', function (playerInfo) {
          console.log('playerCreatedComplete for ' + playerInfo.playerName);
          self.otherPlayers.getChildren().forEach(function (otherPlayer) {
            if (playerInfo.playerId === otherPlayer.playerId) {
              // update player text field
              otherPlayer.playerText.text = playerInfo.playerName;
            }
          });
        });
        ////
        this.cursors = this.input.keyboard.createCursorKeys();
    
        this.blueScoreText = this.add.text(16, 16, '', { fontSize: '32px', fill: '#7777FF' });
        this.redScoreText = this.add.text(484, 16, '', { fontSize: '32px', fill: '#FF7777' });
        
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
  }

  addPlayer(self, playerInfo) {

    this.player = self.physics.add.image(playerInfo.x, playerInfo.y, 'player').setOrigin(0.5, 0.5);
    var playerName = this.inputName;

    console.log('Add playername: ' + playerName + ' x: ' + playerInfo.x + ' y:' + playerInfo.y);
    this.playername = this.add.text(playerInfo.x - 60, playerInfo.y - 60, playerName, {fill: "#ff0044", align: "center", backgroundColor: "#ffff00" }); 

    // if (playerInfo.team === 'blue') {
    //   self.player.setTint(0x7777ff);
    // } else {
    //   self.player.setTint(0xff7777);
    // }
    self.playerName = playerName;
    console.log('Add playerCreated id : ' + playerInfo.playerId + ' name : ' + self.playerName );
    // send details like name etc back when player created
    this.socket.emit('playerCreated', { id: playerInfo.playerId , name: self.playerName });

    self.player.setDrag(100);
    self.player.setAngularDrag(100);
    self.player.setMaxVelocity(200);
  }

  addOtherPlayers(self, playerInfo) {
    const otherPlayer = self.add.sprite(playerInfo.x, playerInfo.y, 'otherPlayer').setOrigin(0.5, 0.5);
    // if (playerInfo.team === 'blue') {
    //   otherPlayer.setTint(0x7777ff);
    // } else {
    //   otherPlayer.setTint(0xff7777);
    // }
    otherPlayer.setTint(0xAAAAAA);
    otherPlayer.playerId = playerInfo.playerId;

    //var playerName = playerInfo.playerId.substring(0, 3);
    var playerName = playerInfo.playerName;
    console.log('Add other playername: ' + playerName + ' x: ' + playerInfo.x + ' y:' + playerInfo.y);
    otherPlayer.playerName = playerName;

    //this.add.text(playerInfo.x, playerInfo.y, 'Other Unicorn: ' + playerName, { fontSize: '24px', fill: '#FFFFFF' });
    var playerText = this.add.text(playerInfo.x - 60, playerInfo.y - 60, playerName, {fill: "#ff0044", align: "center", backgroundColor: "#CCCCCC" }); 
    otherPlayer.playerText = playerText;

    self.otherPlayers.add(otherPlayer);
  }

  update() {
    if (this.player) {
      // update player
      if (this.cursors.left.isDown || this.joyStickState == 'Key down: left ' || this.joyStickState == 'Key down: up left ' ) {
        this.player.setAngularVelocity(-150);
      } else if (this.cursors.right.isDown || this.joyStickState == 'Key down: right ' || this.joyStickState == 'Key down: up right ') {
        this.player.setAngularVelocity(150);
      } else {
        this.player.setAngularVelocity(0);
      }
    
      if (this.cursors.up.isDown || this.joyStickState == 'Key down: up ' || this.joyStickState == 'Key down: up left ' || this.joyStickState == 'Key down: up right ') {
        this.physics.velocityFromRotation(this.player.rotation + 1.5, 100, this.player.body.acceleration);
      } else {
        this.player.setAcceleration(0);
      }

      // update player name
      this.playername.x = this.player.x - 60;
      this.playername.y = this.player.y - 60;
    
      this.physics.world.wrap(this.player);

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

  //  ------------------------
  //  ------------------------
  //  ------------------------
  //  Resize related functions
  //  ------------------------
  //  ------------------------
  //  ------------------------

  resize (gameSize)
  {
      const width = gameSize.width;
      const height = gameSize.height;
      console.log('size width: ' + width + ' height:' + height);
      
      this.parent.setSize(width, height);
      this.sizer.setSize(width, height);

      this.updateCamera();
  }

  updateCamera ()
  {
      const camera = this.cameras.main;

      const x = Math.ceil((this.parent.width - this.sizer.width) * 0.5);
      const y = 0;
      const scaleX = this.sizer.width / this.GAME_WIDTH;
      const scaleY = this.sizer.height / this.GAME_HEIGHT;

      camera.setViewport(x, y, this.sizer.width, this.sizer.height);
      camera.setZoom(Math.max(scaleX, scaleY));
      camera.centerOn(this.GAME_WIDTH / 2, this.GAME_HEIGHT / 2);
  }

  getZoom ()
  {
      return this.cameras.main.zoom;
  }

  dumpJoyStickState() {
    //console.log('create dumpJoyStickState');
    var cursorKeys = this.joyStick.createCursorKeys();
    var s = 'Key down: ';
    var localState = '';
    for (var name in cursorKeys) {
        if (cursorKeys[name].isDown) {
            s += `${name} `;
        }
    }
    localState = s;

    s += `
        Force: ${Math.floor(this.joyStick.force * 100) / 100}
        Angle: ${Math.floor(this.joyStick.angle * 100) / 100}
        `;

    s += '\nTimestamp:\n';
    for (var name in cursorKeys) {
        var key = cursorKeys[name];
        s += `${name}: duration=${key.duration / 1000}\n`;
    }
    this.joyStickState = localState;
    //console.log('localState = ' + localState);
  }
}

var config = {
  type: Phaser.AUTO,
  backgroundColor: '#69c4df',  
  parent: 'phaser-game',
  width: 640,
  height: 960,
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
      gravity: { y: 0 }
    }
  },
  dom: {
    createContainer: true
  },
  scene: UnicornGame,
  scale: {
    mode: Phaser.Scale.RESIZE,
    parent: 'phaser-example',
    width: 640,
    height: 960,
    min: {
        width: 320,
        height: 480
    },
    max: {
        width: 1400,
        height: 1200
    }
  }
};

var game = new Phaser.Game(config);  
