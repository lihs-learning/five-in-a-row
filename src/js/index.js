var fir = (function () {
  // setting
  var options = {
    width: 800,
    height: 800,
    padding: 30,
    rows: 15,
    winLen: 5,
    gameMode: 'PVP'
  }


  var padding = options.padding;
  var width = options.width;
  var height = options.height;
  var rows = options.rows;
  var rowDiv = (width - 4 * padding) / (rows - 1);
  var chesspiece = rowDiv / 2 * 0.8;
  var winLen = options.winLen;
  var gameMode = options.gameMode;

  var chessboard = [];


  // start
  var imgUrlList = [];

  var start = function () {
    draw(function (ctx) {
      ctx.clearRect(0, 0, width, height);
    })

    var count = 0;
    var imgResources = [];

    if (imgUrlList.length) {
      imgUrlList.forEach(function (imgUrl) {
        var img = new Image();
  
        img.src = imgUrl;
  
        img.onload = (function (img) {
          return function () {
            imgResources.push(img);
            if (imgResources.length === imgUrlList.length) {
              init();
            }
          }
        })(img)
      });
    }
    else {
      init();
    }
  };

  var canvas = (function () {
    
    var cvs = document.getElementById('cvs');
    cvs.width = width;
    cvs.height = height;

    return cvs;
  })();

  // draw
  var draw = (function (canvas) {
    var ctx = canvas.getContext('2d');

    var _draw = function (fn) {
      ctx.save();
      fn(ctx);
      ctx.restore();
    }

    _draw.step = function (x, y, player) {
      var posX = 2 * padding + x * rowDiv;
      var posY = 2 * padding + y * rowDiv;
      var gradient = ctx.createRadialGradient(posX - 3, posY - 3, 0.1 * chesspiece, posX, posY, chesspiece);
      ctx.save();
      ctx.beginPath();
      ctx.arc(posX, posY, chesspiece, 0, 2 * Math.PI);
      ctx.closePath();
      if (player) {
        gradient.addColorStop(0, '#e1e1e1');
        gradient.addColorStop(1, '#f9f9f9');
      }
      else {
        gradient.addColorStop(0, '#0a0a0a');
        gradient.addColorStop(1, '#636363');
      }
      ctx.fillStyle = gradient;
      ctx.fill();
      ctx.restore();
    };

    _draw.clear = function () {
      
    }

    return _draw;

  })(canvas);

  var init = function () {

    for (var i = 0; i < rows; i++) {
      chessboard.push([]);
      for (var j = 0; j < rows; j++) {
        chessboard[i][j] = -1;
      }
    }


    var calcAllWins = function () {
      var winArr = [];
      var count = 0;
      var winPadding = rows - winLen + 1;
      var i, j, k;

      for (i = 0; i < rows; i++) {
        winArr.push([]);
        for (j = 0; j < rows; j++) {
          winArr[i].push({});
        }
      }

      for (i = 0; i < rows; i++) {
        for (j = 0; j < winPadding; j++) {
          for (k = 0; k < winLen; k++) {
            winArr[i][j + k][count] = true;
          }
          count++;
        }
      }

      for (i = 0; i < rows; i++) {
        for (j = 0; j < winPadding; j++) {
          for (k = 0; k < winLen; k++) {
            winArr[j + k][i][count] = true;
          }
          count++;
        }
      }

      for (i = 0; i < winPadding; i++) {
        for (j = 0; j < winPadding; j++) {
          for (k = 0; k < winLen; k++) {
            winArr[i + k][j + k][count] = true;
          }
          count++;
        }
      }

      for (i = winLen - 1; i < rows; i++) {
        for (j = 0; j < winPadding; j++) {
          for (k = 0; k < winLen; k++) {
            winArr[i - k][j + k][count] = true;
          }
          count++;
        }
      }

      winArr.count = count;

      return winArr;
    }


    var stepEvent = (function () {
      var player = 0;

      var i, j;
      // 所有胜利情况
      var wins = calcAllWins();

      // 在某个胜法的步数
      var _playerWin = [];
      for (i = 0; i < 2; i++) {
        _playerWin.push([]);
        for (j = 0; j < wins.count; j++) {
          _playerWin[i].push(0);
        }
      }

      var _step = function (x, y) {
        var k;
        if (chessboard[x][y] === -1) {
          chessboard[x][y] = player;
          draw.step(x, y, player);

          for (k = 0; k < wins.count; k++) {
            if (wins[x][y][k]) {
              _playerWin[player][k]++;
              _playerWin[player ? 0 : 1][k]--;
              if (_playerWin[player][k] >= winLen) {
                // console.log('player' + (player + 1) + ' win!');
                alert('player' + (player + 1) + ' win!');
                fir.start();
              }
            }
          }
        }
      };
      // PVP local
      var PVP = function (e) {
        var x = Math.floor((e.offsetX + rowDiv / 2 - 2 * padding) / rowDiv);
        var y = Math.floor((e.offsetY + rowDiv / 2 - 2 * padding) / rowDiv);
        if (chessboard[x][y] !== -1) {
          return;
        }
        _step(x, y);
        player = player ? 0 : 1;
      };

      // PVE
      var PVE0 = (function () {
        var i, j, m;
        var isEnvironmentStep = false;
        var max = 0, u, v;
        var _playerScore = [];
        for (m = 0; m < 2; m++) {
          _playerScore.push([]);
          for (i = 0; i < rows; i++) {
            _playerScore[m].push([]);
            for (var j = 0; j < rows; j++) {
              _playerScore[m][i].push(0);
            }
          }
        }

        var _eStep = function () {
          var i, j, k, m;
          var max = 0, x = 0, y = 0;
          var player1 = player;
          var player2 = player ? 0 : 1;
          // for debug;
          var max1, max2;
          // for debug;

          for (var i = 0; i < rows; i++) {
            for (var j = 0; j < rows; j++) {
              if (chessboard[i][j] < 0) {

                for (var k = 0; k < wins.count; k++) {
                  if (wins[i][j][k]) {
                    switch(_playerWin[player1][k]) {
                      case 1: _playerScore[player1][i][j] += 10;break;

                      case 2: _playerScore[player1][i][j] += 200;break;

                      case 3: _playerScore[player1][i][j] += 1000;break;

                      case 4: _playerScore[player1][i][j] += 5000;break;
                    }

                    switch(_playerWin[player2][k]) {
                      case 1: _playerScore[player2][i][j] += 10;break;

                      case 2: _playerScore[player2][i][j] += 200;break;

                      case 3: _playerScore[player2][i][j] += 1000;break;

                      case 4: _playerScore[player2][i][j] += 5000;break;
                    }
                  }
                }

                if (_playerScore[player1][i][j] > max) {
                  max = _playerScore[player1][i][j];
                  x = i;
                  y = j;
                  max1 = {x: i + 1, y: j + 1, val: max}
                }

                if (_playerScore[player2][i][j] > max) {
                  max = _playerScore[player2][i][j];
                  x = i;
                  y = j;
                  max2 = {x: i + 1, y: j + 1, val: max}
                }


              }
            }
          }

          console.log('----------------player1----------------');
          // for (var i = 0; i < rows; i++) {
          //   console.log(_playerScore[player1][i]);
          // }
          console.log(max1);
          console.log('----------------player2------------------');
          // for (var i = 0; i < rows; i++) {
          //   console.log(_playerScore[player2][i]);
          // }
          console.log(max2);
          console.log('----------------------------------------');

          _step(x, y);
          player = player ? 0 : 1;
          isEnvironmentStep = false;
        }

        return function (e) {
          var x, y, k;
          x = Math.floor((e.offsetX + rowDiv / 2 - 2 * padding) / rowDiv);
          y = Math.floor((e.offsetY + rowDiv / 2 - 2 * padding) / rowDiv);
          if (chessboard[x][y] !== -1) {
            return;
          }
          if (isEnvironmentStep) {
            return;
          }
          else {
            _step(x, y);
            player = player ? 0 : 1;
            isEnvironmentStep = true;
            setTimeout(_eStep, Math.floor(Math.random() * 1000));
          }
        }
      })();

      var PVE1 = (function () {

        return function (e) {
          
        }
      })();

      // PVP network


      return {
        PVP: PVP, PVE0: PVE0
      }
    })();


    canvas.onclick = stepEvent[gameMode];

    // draw chessboard
    draw(function (ctx) {
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fillRect(padding, padding, width - 2 * padding, height - 2 * padding);
    });
    draw(function (ctx) {
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1;
      for (var i = 0; i < rows; i++) {
        ctx.moveTo(2 * padding + i * rowDiv, 2 * padding);
        ctx.lineTo(2 * padding + i * rowDiv, width - 2 * padding);
        ctx.stroke();
        ctx.moveTo(2 * padding, 2 * padding + i * rowDiv);
        ctx.lineTo(height - 2 * padding, 2 * padding + i * rowDiv);
        // ctx.lineTo(2 * padding + i * rowDiv, height - 2 * padding);
        ctx.stroke();
      }
    });

  }

  var set = function (size, mode) {
    gameMode = mode;
    rows = size;
    rowDiv = (width - 4 * padding) / (rows - 1);
    chesspiece = rowDiv / 2 * 0.8;
  }

  return {
    start: start,
    set: set
  }
})()

