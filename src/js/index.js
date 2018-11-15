var fir = (function () {
  // setting
  var options = {
    width: 800, // canvas宽
    height: 800, // canvas高
    padding: 30, // canvas 与 棋盘 的间距
    rows: 15, // 棋盘的分割行数
    winLen: 5, // 胜利长度
    gameMode: 'PVP' // 游戏模式
  }


  var padding = options.padding;
  var width = options.width;
  var height = options.height;
  var rows = options.rows;
  var rowDiv = (width - 4 * padding) / (rows - 1); // 每格的大小
  var chesspiece = rowDiv / 2 * 0.8; // 棋子的半径
  var winLen = options.winLen;
  var gameMode = options.gameMode;

  var chessboard = []; // 棋盘数组


  // start
  var imgUrlList = [];

  // 开始游戏，整个游戏加载流程
  var start = function () {

    // 清空 canvas
    draw(function (ctx) {
      ctx.clearRect(0, 0, width, height);
    })

    var count = 0;
    var imgResources = [];

    // 如果存在图片，先加载图片资源
    if (imgUrlList.length) {
      imgUrlList.forEach(function (imgUrl) {
        var img = new Image();
  
        img.src = imgUrl;

        // 闭包解决作用域问题
        img.onload = (function (img) {
          return function () {
            imgResources.push(img);
            // 加载完毕后初始化
            if (imgResources.length === imgUrlList.length) {
              init();
            }
          }
        })(img)
      });
    }
    // 否则直接初始化
    else {
      init();
    }
  };

  // 初始化画布
  var canvas = (function () {
    
    var cvs = document.getElementById('cvs');
    cvs.width = width;
    cvs.height = height;

    return cvs;
  })();

  // draw
  var draw = (function (canvas) {
    var ctx = canvas.getContext('2d');

    // 保护 canvas 状态
    var _draw = function (fn) {
      ctx.save();
      fn(ctx);
      ctx.restore();
    }

    // 绘制落子点
    _draw.step = function (x, y, player) {
      var posX = 2 * padding + x * rowDiv; // 落子中心 X 位置
      var posY = 2 * padding + y * rowDiv; // 落子中心 Y 位置
      var gradient = ctx.createRadialGradient(posX - 3, posY - 3, 0.1 * chesspiece, posX, posY, chesspiece); // 渐变
      ctx.save(); // 保护 canvas 状态

      // 开始绘制圆
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
      // 绘制结束

      ctx.restore(); // 恢复 canvas 状态
    };

    _draw.clear = function () {
      
    }

    return _draw;

  })(canvas);

  // 初始化
  var init = function () {

    // 初始化棋盘数据，-1 代表该位置上都没有玩家的棋子
    for (var i = 0; i < rows; i++) {
      chessboard.push([]);
      for (var j = 0; j < rows; j++) {
        chessboard[i][j] = -1;
      }
    }

    // 计算所有可能胜利的情况的私有方法
    var calcAllWins = function () {
      var winArr = []; // 胜利情况的数据存放容器
      var count = 0;
      var winPadding = rows - winLen + 1; // 不可能胜利的边界大小，即默认 5连子胜 时，边界只有4个空位也无法取胜
      var i, j, k;

      // 初始化数据模型
      for (i = 0; i < rows; i++) {
        winArr.push([]);
        for (j = 0; j < rows; j++) {
          winArr[i].push({});
        }
      }

      // 统计在 横方向 位置各个位置的胜利机会
      for (i = 0; i < rows; i++) {
        for (j = 0; j < winPadding; j++) {
          for (k = 0; k < winLen; k++) {
            winArr[i][j + k][count] = true;
          }
          count++;
        }
      }

      // 统计在 竖方向 位置各个位置的胜利机会
      for (i = 0; i < rows; i++) {
        for (j = 0; j < winPadding; j++) {
          for (k = 0; k < winLen; k++) {
            winArr[j + k][i][count] = true;
          }
          count++;
        }
      }

      // 统计在 捺方向 位置各个位置的胜利机会
      for (i = 0; i < winPadding; i++) {
        for (j = 0; j < winPadding; j++) {
          for (k = 0; k < winLen; k++) {
            winArr[i + k][j + k][count] = true;
          }
          count++;
        }
      }

      // 统计在 撇方向 位置各个位置的胜利机会
      for (i = winLen - 1; i < rows; i++) {
        for (j = 0; j < winPadding; j++) {
          for (k = 0; k < winLen; k++) {
            winArr[i - k][j + k][count] = true;
          }
          count++;
        }
      }

      // 总胜利情况
      winArr.count = count;

      return winArr;
    }

    // 走一步棋的方法初始化
    var stepEvent = (function () {
      var player = 0;

      var i, j;

      // 初始化所有胜利情况
      var wins = calcAllWins();

      // 初始化玩家在某中胜利情况下落子个数的数据模型（个数够 winLen 时胜利）
      var _playerWin = [];
      for (i = 0; i < 2; i++) {
        _playerWin.push([]);
        for (j = 0; j < wins.count; j++) {
          _playerWin[i].push(0);
        }
      }

      // 走一步棋
      var _step = function (x, y) {
        var k;
        // 该位置不能有棋子
        if (chessboard[x][y] === -1) {
          chessboard[x][y] = player; // 为玩家占领位置
          draw.step(x, y, player); // 绘制落子

          for (k = 0; k < wins.count; k++) {
            if (wins[x][y][k]) { // 在该位置上有胜利机会
              _playerWin[player][k]++; // 当前玩家在该胜法上更容易获胜
              _playerWin[player ? 0 : 1][k]--; // 另一个玩家在该胜法上胜率下降
              if (_playerWin[player][k] >= winLen) { // 当前玩家获胜
                // console.log('player' + (player + 1) + ' win!');
                alert('player' + (player + 1) + ' win!');
                fir.start();
              }
            }
          }
        }
      };

      // PVP local
      // PVP 事件模式，直接暴露该模式的API
      var PVP = function (e) {

        // 计算落子在棋盘数据模型上的位置
        var x = Math.floor((e.offsetX + rowDiv / 2 - 2 * padding) / rowDiv);
        var y = Math.floor((e.offsetY + rowDiv / 2 - 2 * padding) / rowDiv);
        if (chessboard[x][y] !== -1) {
          return;
        }
        _step(x, y); // 落子
        player = player ? 0 : 1; // 切换玩家
      };

      // PVE0
      // 人工智障 事件模式的初始化
      var PVE0 = (function () {
        var i, j, m;
        var isEnvironmentStep = false; // 初始化人工智障为后手
        var max = 0, u, v;

        // 初始化玩家得分，用于人工智障计算
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

        // 人工智障落子
        var _eStep = function () {
          var i, j, k, m;
          var max = 0, x = 0, y = 0;
          var player1 = player;
          var player2 = player ? 0 : 1;
          // for debug;
          var max1, max2;
          // for debug end;

          // 遍历棋盘未落子的位置
          for (var i = 0; i < rows; i++) {
            for (var j = 0; j < rows; j++) {
              if (chessboard[i][j] < 0) {

                // 计算未落子位置双方在胜法上的得分情况
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

                // 是否应该在该处落子
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

          _step(x, y); // 人工智障落子
          player = player ? 0 : 1; // 切换玩家
          isEnvironmentStep = false; // 下一步为玩家
        }

        // 暴露 人工智障模式 的 API
        return function (e) {
          var x, y, k;
          x = Math.floor((e.offsetX + rowDiv / 2 - 2 * padding) / rowDiv);
          y = Math.floor((e.offsetY + rowDiv / 2 - 2 * padding) / rowDiv);

          // 不可落子判断
          if (chessboard[x][y] !== -1) {
            return;
          }
          if (isEnvironmentStep) {
            return;
          }

          _step(x, y); // 落子
          player = player ? 0 : 1; // 切换玩家
          isEnvironmentStep = true; // 下一步为人工智障
          setTimeout(_eStep, Math.floor(Math.random() * 1000)); // 人工智障落子
        }
      })();

      // PVE1
      var PVE1 = (function () {
        return function (e) {
          // TODO
        }
      })();

      // PVP network
      // TODO

      // 暴露已有的游戏模式
      return {
        PVP: PVP, PVE0: PVE0
      }
    })();

    // 初始化画布点击事件
    canvas.onclick = stepEvent[gameMode];

    // draw chessboard. 绘制棋盘
    // 绘制白布
    draw(function (ctx) {
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fillRect(padding, padding, width - 2 * padding, height - 2 * padding);
    });
    // 绘制棋盘格
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

  // 配置项 API
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

