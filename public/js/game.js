
class UnicornGame extends Phaser.Scene
{
  GAME_WIDTH;
  GAME_HEIGHT;

  version = '0.6';

  backgroundScene;
  parent;
  sizer;
  player;
  playerId;
  playername;

  otherPlayers;

  inputText;
  inputName = '';

  joyStickState = '';

  preload() {
    this.load.image('player', 'assets/unicorn.png');
    this.load.image('otherPlayer', 'assets/unicorn.png');
    this.load.image('goal', 'assets/rainbow.png');

    var url;
    url = 'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexvirtualjoystickplugin.min.js';
    this.load.plugin('rexvirtualjoystickplugin', url, true);

    this.load.plugin('rexinputtextplugin', 'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexinputtextplugin.min.js', true);
  }

  create() {
    console.log('create');

    //var { width, height } = this.sys.game.canvas;
    this.GAME_WIDTH = this.scale.width;
    this.GAME_HEIGHT = this.scale.height;

    this.welcomeText = this.add.text(this.GAME_WIDTH / 2, 150, 
      'Beta Game (v' + this.version + ')', { 
      fontSize: '40px',
      color: '#000000',
    }).setOrigin(0.5,0.5);

    this.inputText = this.add.rexInputText(this.GAME_WIDTH / 2, this.GAME_HEIGHT / 3, this.GAME_WIDTH - 50, 100, {
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

    this.startGameButton = this.add.text(this.GAME_WIDTH / 2, (this.GAME_HEIGHT / 3) + 200, 'Join Game', { 
      fill: '#cccccc',
      fontSize: '80px',
      color: '#000000',
      backgroundColor: '#1b5e20',
    }).setOrigin(0.5,0.5).setPadding(64, 16);
    this.startGameButton.setInteractive();
    this.startGameButton.on('pointerdown', () => this.startGame() );

  }

  startGame() {
    var name = this.inputText.text;
    console.log('start game with name ' + name);
    if(name != "") {
        // get value and remove form
        this.inputName = name;

        this.startGameButton.destroy();
        this.inputText.destroy();
        this.welcomeText.destroy();
    
        this.parent = new Phaser.Structs.Size(this.GAME_WIDTH, this.GAME_HEIGHT );
        this.sizer = new Phaser.Structs.Size(this.GAME_WIDTH, this.GAME_HEIGHT, Phaser.Structs.Size.FIT, this.parent);
    
        this.parent.setSize(this.GAME_WIDTH, this.GAME_HEIGHT);
        this.sizer.setSize(this.GAME_WIDTH, this.GAME_HEIGHT);
    
        //console.log('game size width: ' + this.GAME_WIDTH + ' height: ' + this.GAME_HEIGHT);
    
        //this.updateCamera();
    
        this.scale.on('resize', this.resize, this);
    
        this.joyStick = this.plugins.get('rexvirtualjoystickplugin').add(this, {
          x: this.GAME_WIDTH / 2,
          y: this.GAME_HEIGHT / 2,
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
              otherPlayer.playerText.x = playerInfo.x - 220;
              otherPlayer.playerText.y = playerInfo.y - 180;
            }
          });
        });
        this.socket.on('playerCreatedComplete', function (playerInfo) {
          console.log('playerCreatedComplete for ' + playerInfo.playerName);
          self.otherPlayers.getChildren().forEach(function (otherPlayer) {
            if (playerInfo.playerId === otherPlayer.playerId) {
              // update player text field
              var playerScoreText = self.playerScoreText(self, playerInfo.score);
              otherPlayer.playerText.text = playerInfo.playerName + '\n ' + playerScoreText;                
            }
          });
        });
        this.socket.on('playerScored', function (playerInfo) {
          console.log('playerScored ' + playerInfo.playerName + ' score now ' + playerInfo.score);
          console.log('current player is ' + self.playerId)
          // if current player scored then update
          if (playerInfo.playerId === self.playerId) {
            console.log('your player scored ' + playerInfo.playerName + ' score ' + playerInfo.score);
            var playerScoreText = self.playerScoreText(self, playerInfo.score);
            self.playername.text = playerInfo.playerName + '\n' + playerScoreText;
          }
          // otherwise update other player
          self.otherPlayers.getChildren().forEach(function (otherPlayer) {
            console.log('other player ' + otherPlayer.playerName)
            if (playerInfo.playerId === otherPlayer.playerId) {
              console.log('other player scored ' + playerInfo.playerName + ' score ' + playerInfo.score);
              var playerScoreText = self.playerScoreText(self, playerInfo.score);
              // update other player text field
              otherPlayer.playerText.text = playerInfo.playerName + '\n' + playerScoreText;
            }
          });
        });
        ////
        this.cursors = this.input.keyboard.createCursorKeys();
        
        this.socket.on('goalLocation', function (goalLocation) {
          console.log('removing goal x ' + goalLocation.x + ' goal y ' + goalLocation.y);
          if (self.goal) self.goal.destroy();

          // place next goal (rainbow)
          var halfWidth = self.GAME_WIDTH / 2;
          var halfHeight = self.GAME_HEIGHT / 2;
          var thirdHeight = self.GAME_HEIGHT / 3;
        
          goalLocation.x = (goalLocation.x  * halfWidth) + (halfWidth / 2);
          goalLocation.y = (goalLocation.y  * thirdHeight) + (halfHeight / 2);

          console.log('placed goal x:' + goalLocation.x + ' in width :' + self.GAME_WIDTH); 
          console.log('       goal y:' + goalLocation.y + ' in height:' + self.GAME_HEIGHT);

          self.goal = self.physics.add.image(goalLocation.x, goalLocation.y, 'goal');

          self.physics.add.overlap(self.player, self.goal, function () {
            if (self.goal) self.goal.destroy();
            this.socket.emit('goalCollected');
          }, null, self);
        });
    }
  }

  playerScoreText(self, score) { 
    console.log('score: ' + score);   
    var scoreText = '(no rainbows)';
    if (score === 1) {
      scoreText = '(has 1 rainbow)';
    } else if (score > 1) {
      scoreText = '(has ' + score + ' rainbows)';  
    }
    console.log('scoreText: ' + scoreText);
    return scoreText;
  }

  addPlayer(self, playerInfo) {

    // start near the middle
    playerInfo.x = (playerInfo.x * self.GAME_WIDTH / 2) + self.GAME_WIDTH / 4;
    playerInfo.y = (playerInfo.y * self.GAME_HEIGHT / 4) + self.GAME_HEIGHT / 4;

    this.player = self.physics.add.sprite(playerInfo.x, playerInfo.y, 'player').setOrigin(0.5, 0.5);
    //this.player.rotation = 90;

    var playerName = this.inputName;

    console.log('Add playername: ' + playerName + ' x: ' + playerInfo.x + ' y:' + playerInfo.y);
    this.playername = this.add.text(playerInfo.x, playerInfo.y, playerName + ' \n (catch a rainbow)', {fontSize: '40px', fill: "#ffffff", align: "center" }); 

    self.playerId = playerInfo.playerId;
    self.playerName = playerName;
    console.log('Add playerCreated id : ' + playerInfo.playerId + ' name : ' + self.playerName );
    // send details like name etc back when player created
    this.socket.emit('playerCreated', { id: playerInfo.playerId , name: self.playerName });

    self.player.setDrag(50);
    self.player.setAngularDrag(150);
    self.player.setMaxVelocity(150);
  }

  addOtherPlayers(self, playerInfo) {

    // adjust other player coorids
    playerInfo.x = (playerInfo.x * self.GAME_WIDTH);
    playerInfo.y = (playerInfo.y * self.GAME_HEIGHT);

    const otherPlayer = self.add.sprite(playerInfo.x, playerInfo.y, 'otherPlayer').setOrigin(0.5, 0.5);
    otherPlayer.setTint(0xAAAAAA);
    otherPlayer.playerId = playerInfo.playerId;

    var playerName = playerInfo.playerName;
    var playerScore = playerInfo.score;
    console.log('Add other playername: ' + playerName +  ' score: ' + playerScore + ' x: ' + playerInfo.x + ' y:' + playerInfo.y) ;
    otherPlayer.playerName = playerName;
    otherPlayer.score = playerScore;

    var playerScoreText = self.playerScoreText(self, otherPlayer.score);
    // update other player text field    
    var playerText = this.add.text(playerInfo.x - 180, playerInfo.y - 180, playerName + ' \n ' + playerScoreText, {fontSize: '40px', fill: "#666666", align: "center" }); 
    otherPlayer.playerText = playerText;

    self.otherPlayers.add(otherPlayer);
  }

  update() {
    if (this.player) {
      // rotate player
      if (this.cursors.left.isDown || this.joyStickState == 'Key down: left ' || this.joyStickState == 'Key down: up left ' || this.joyStickState == 'Key down: down left ') {
        this.player.setAngularVelocity(-150);
      } else if (this.cursors.right.isDown || this.joyStickState == 'Key down: right ' || this.joyStickState == 'Key down: up right ' || this.joyStickState == 'Key down: down right ') {
        this.player.setAngularVelocity(150);
      } else {
        this.player.setAngularVelocity(0);
      }
    
      // add velocity
      if (this.cursors.up.isDown || this.joyStickState == 'Key down: up ' || this.joyStickState == 'Key down: up left ' || this.joyStickState == 'Key down: up right ') {
        this.physics.velocityFromRotation(this.player.rotation, -100, this.player.body.acceleration);
      } else if (this.cursors.down.isDown || this.joyStickState == 'Key down: down ' || this.joyStickState == 'Key down: down left ' || this.joyStickState == 'Key down: down right ') {
          this.physics.velocityFromRotation(this.player.rotation, 100, this.player.body.acceleration);        
      } else {
        this.player.setAcceleration(0);
      }

      // update player name
      this.playername.x = this.player.x - 220;
      this.playername.y = this.player.y - 180;
    
      this.physics.world.wrap(this.player, 40);

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

  resize (gameSize, baseSize, displaySize, resolution)
  {
      const width = gameSize.width;
      const height = gameSize.height;

      this.cameras.resize(width, height);
      console.log('size width: ' + width + ' height:' + height);
      
      //this.parent.setSize(width, height);
      //this.sizer.setSize(width, height);

      //this.updateCamera();
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
    width: '100%',
    height: '100%'
  }
};

var game = new Phaser.Game(config);  
