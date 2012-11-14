Object.prototype.clone = function () {
    var i, newObj = (this instanceof Array) ? [] : {};
    for (i in this) {
        if (i === 'clone') {
            continue;
        }
        if (this[i] && typeof this[i] === "object") {
            newObj[i] = this[i].clone();
        } else {
            newObj[i] = this[i];
        }
    }
    return newObj;
};

var NONE        = 4,
    UP          = 3,
    LEFT        = 2,
    DOWN        = 1,
    RIGHT       = 0,
	PLAYING     = 5,
	DYING       = 6,
	LEVELCLEAR  = 7,
	Game        = {};

Game.WALL  = 0;
Game.LEAF  = 1;
Game.DRUG  = 2;
Game.COPS  = 3;
Game.EXIT  = 4;
Game.EMPTY = 5;
	

Game.MAP = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0],
	[0, 1, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 4, 0, 0],
	[0, 1, 0, 0, 0, 0, 1, 3, 3, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
	[0, 1, 0, 0, 0, 0, 1, 3, 3, 1, 1, 1, 0, 0, 0, 0, 1, 0, 0, 0],
	[0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 1, 0, 5, 0, 0, 1, 0, 0, 0],
	[0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 1, 1, 1, 1, 1, 0, 1, 0, 0, 0],
	[0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 0, 0],
	[0, 1, 0, 0, 2, 2, 1, 0, 0, 1, 1, 1, 0, 2, 1, 1, 1, 1, 0, 0],
	[0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 0],
	[0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
	[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
];

Game.Tiles = function(size, image)
{
	var blockSize = size;
	var tileImage = image;

	function drawTile(ctx, y, x, tiley, tilex)
	{
		ctx.drawImage(tileImage, blockSize * tilex, blockSize * tiley, blockSize, blockSize,
							   x, y, blockSize, blockSize);
	};

	return {
		"drawTile": drawTile
	};
}

Game.Map = function(size, tiles)
{
	var height     = null,
		width      = null,
		blockSize  = size,
		leafCount  = 0,
		map        = null;

	function reset() {       
        map    = Game.MAP.clone();
        height = map.length;
        width  = map[0].length; 
		for (var i = 0; i < height; i++)
		{
			for (var j = 0; j < width; j++)
			{
				if (map[i][j] == Game.LEAF)
				{
					leafCount++;
				}
			}
		}
    };

	function block(y, x) {
        return map[y][x];
    };
    
    function setBlock(y, x, type) {
        map[y][x] = type;
    };

	function drawBlock(y, x, ctx)
	{
		var piece = map[y][x];
		
		
		if (piece === Game.EMPTY || piece === Game.LEAF || piece === Game.DRUG)
		{
			ctx.beginPath();
			ctx.fillStyle = "#000";
			ctx.fillRect((x * blockSize), (y * blockSize), 
						blockSize, blockSize);
			ctx.closePath();

			if (piece === Game.LEAF)
			{
				tiles.drawTile(ctx, y * blockSize, x * blockSize, 0, 0);
			}
			if (piece === Game.DRUG)
			{
				tiles.drawTile(ctx, y * blockSize, x * blockSize, 0, 3);
			}
		}
		else if (piece === Game.WALL)
		{
			tiles.drawTile(ctx, y * blockSize, x * blockSize, 0, 1);
		}
		else if (piece === Game.EXIT)
		{
			tiles.drawTile(ctx, y * blockSize, x * blockSize, 0, 2);
		}
		else if (piece === Game.COPS)
		{
			ctx.beginPath();
			ctx.fillStyle = "#00f";
			ctx.fillRect((x * blockSize), (y * blockSize), 
						blockSize, blockSize);
			ctx.closePath();
		}
		else
		{
			ctx.beginPath();
			ctx.fillStyle = "#f00";
			ctx.fillRect((x * blockSize), (y * blockSize), 
						blockSize, blockSize);
			ctx.closePath();
		}
		
	};

	function draw(ctx)
	{
		for (i = 0; i < height; i += 1) {
		    for (j = 0; j < width; j += 1) {
			    drawBlock(i, j, ctx);
		    }
	    }
	};

	function onWholeSquare(x) {
        return x % blockSize === 0;
    };

	function positionToCoord(pos)
	{
		return {
			"x": Math.round(pos.x / blockSize),
			"y": Math.round(pos.y / blockSize)
		};
	}

	function nextSquare(y, x, dir)
	{
		var newCoord = {
			"x": x + (dir === LEFT && -1 || dir === RIGHT && 1 || 0),
			"y": y + (dir === DOWN && 1 || dir === UP    && -1 || 0)
		};
		return {
			"x": newCoord.x,
			"y": newCoord.y
		};
	}

	function onGridSquare(pos) {
        return onWholeSquare(pos.y) && onWholeSquare(pos.x);
    };

	reset();
    
    return {
        "draw"            : draw,
        "drawBlock"       : drawBlock,
        "block"           : block,
        "setBlock"        : setBlock,
        "reset"           : reset,
        "height"          : height,
        "width"           : width,
        "blockSize"       : blockSize,
		"onGridSquare"    : onGridSquare,
		"nextSquare"      : nextSquare,
		"positionToCoord" : positionToCoord,
		"leafCount"       : leafCount
    };
}

Game.Player = function(game, map, tiles)
{
	var position  = null,
		direction = NONE,
		speed     = 4,
		spaceHit  = false,
		keyMap    = {},
		powerUps  = 1,
		leaves    = 0,
		keyQueue  = [];


	keyMap[37] = LEFT;
    keyMap[38] = UP;
    keyMap[39] = RIGHT;
    keyMap[40] = DOWN;

	function reset()
	{
		position = {"x": 416, "y":160};
		keyQueue = [];
		direction = NONE;
		spaceHit = false;
		speed = 4;
	}

	function setSpeed(s)
	{
		speed = s;
	}

	function keyDown(e) {
		if (e.keyCode == 32)
		{
			spaceHit = true;
			e.preventDefault();
            e.stopPropagation();
            return false;
		}
        if (typeof keyMap[e.keyCode] !== "undefined") { 
            keyQueue.push(keyMap[e.keyCode]);
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
        return true;
	};

	function getNewPosition(dir, current) { 
		
        return {
            "x": current.x + (dir === LEFT && -speed || dir === RIGHT && speed || 0),
            "y": current.y + (dir === DOWN && speed || dir === UP    && -speed || 0)
        };
    };

	function canWalk(square)
	{
		return (square === Game.EMPTY 
			|| square === Game.LEAF 
			|| square === Game.DRUG 
			|| square === Game.EXIT);
	};

	function canStartMove(tick)
	{
		return tick % (map.blockSize / speed) == 0;
	}

	function move()
	{
		if (map.onGridSquare(position))
		{
			var current = map.positionToCoord(position);

			if (spaceHit && canStartMove(game.getTick()))
			{
				spaceHit = false;
				if (powerUps > 0)
				{
					game.powerUp();
					powerUps--;
				}

			}

			for (var i = 0; i < keyQueue.length; i++)
			{
				if (keyQueue[i] !== direction)
				{
					desiredCoord = map.nextSquare(current.y, current.x, keyQueue[i]);
					var desiredSquare = map.block(desiredCoord.y, desiredCoord.x);

					if (canWalk(desiredSquare) && canStartMove(game.getTick()))
					{
						direction = keyQueue[i];
						keyQueue = keyQueue.slice(i+1);
						break;
					}
				}
			}

			var nextCoord = map.nextSquare(current.y, current.x, direction);
			var nextSquare = map.block(nextCoord.y, nextCoord.x);

			if (!canWalk(nextSquare))
			{
				direction = NONE;
			}

			var curSquare = map.block(current.y, current.x)
			if (curSquare === Game.LEAF || curSquare === Game.DRUG)
			{
				map.setBlock(current.y, current.x, Game.EMPTY);
			}
			if (curSquare === Game.DRUG)
			{
				powerUps++;
			}
			if (curSquare === Game.LEAF)
			{
				leaves++;
			}
			if (leaves == map.leafCount && curSquare === Game.EXIT)
			{
				game.levelClear();
			}
		}

		var oldPosition = position;
		position = getNewPosition(direction, position);
		
		return {
			"new" : position,
			"old" : oldPosition
		};
	};

	function draw(ctx) {
		//if (map.onGridSquare(position))
		//{
			//ctx.beginPath();
			//ctx.fillStyle = "#fff";
			//ctx.fillRect(position.x, position.y, blockSize, blockSize);
			//ctx.closePath();
		//}
		tiles.drawTile(ctx, position.y, position.x, 0, 4);
	};

	function getPowerUps()
	{
		return powerUps;
	};

	function getPosition()
	{
		return position;
	};

	reset();

	return {
        "draw"          : draw,
        "keyDown"       : keyDown,
        "move"          : move,
		"reset"         : reset,
		"setSpeed"      : setSpeed,
		"powerUps"      : getPowerUps,
		"getPosition"   : getPosition
    };
}

Game.Enemy = function(game, map, tiles)
{
	var position   = null,
		direction  = null,
		due        = null,
		vulnerable = null,
		speed      = 4;

	function getNewPosition(dir, current) {   
        return {
            "x": current.x + (dir === LEFT && -speed || dir === RIGHT && speed || 0),
            "y": current.y + (dir === DOWN && speed || dir === UP    && -speed || 0)
        };
    };

	function getRandomDirection() {
        var moves = [UP, DOWN, LEFT, RIGHT];
        return moves[Math.floor(Math.random() * 4)];
    };

	function canWalk(square)
	{
		return (square === Game.EMPTY 
			|| square === Game.LEAF 
			|| square === Game.DRUG 
			|| square === Game.EXIT
			|| square === Game.COPS);
	};	

	function chooseMove(current, direction)
	{
		var directions = [UP, DOWN, LEFT, RIGHT];
		var choices = [];

		for (var i = 0; i < directions.length; i++)
		{
			var coord = map.nextSquare(current.y, current.x, directions[i]);
			var square = map.block(coord.y, coord.x);
			if (canWalk(square))
			{
				choices.push(directions[i]);
			}
		}

		if ((Math.random() * 3) < 1)
		{
			return choices[Math.floor(Math.random() * choices.length)];
		}

		var minDistance = null;
		var choice = null;

		for (var i = 0; i < choices.length; i++)
		{
			var playerCoord = game.playerCoord();
			var newCoord = map.nextSquare(current.y, current.x, choices[i]);

			var distance = Math.sqrt(Math.pow(playerCoord.x - newCoord.x, 2) +
									 Math.pow(playerCoord.y - newCoord.y, 2));

			if (minDistance === null || minDistance > distance)
			{
				minDistance = distance;
				choice = choices[i];
			}
		}

		return choice;
	}

	function move()
	{
		if (vulnerable)
		{
			return {
				"new" : position,
				"old" : position
			};
		}

		if (map.onGridSquare(position))
		{
			var current = map.positionToCoord(position);		
			//if (due !== direction)
			//{
				//desiredCoord = map.nextSquare(current.y, current.x, due);
				//var desiredSquare = map.block(desiredCoord.y, desiredCoord.x);

				//if (canWalk(desiredSquare))
				//{
					//direction = due;
				//}
			//}

			direction = chooseMove(current);

			//var nextCoord = map.nextSquare(current.y, current.x, direction);
			//var nextSquare = map.block(nextCoord.y, nextCoord.x);

			//if (!canWalk(nextSquare))
			//{
				//due = getRandomDirection();
				//return move();
			//}
		}

		var oldPosition = position;
		position = getNewPosition(direction, position);

		//due = getRandomDirection();

		return {
			"new" : position,
			"old" : oldPosition
		};
	};

	function draw(ctx) {
		//if (map.onGridSquare(position))
		//{
			//ctx.beginPath();
			//ctx.fillStyle = "#fff";
			//ctx.fillRect(position.x, position.y, blockSize, blockSize);
			//ctx.closePath();
		//}
		if (vulnerable)
		{
			tiles.drawTile(ctx, position.y, position.x, 0, 7);
		}
		else
		{
			tiles.drawTile(ctx, position.y, position.x, 0, 5);
		}
	};

	function reset()
	{
		position = {"x": 256, "y":128};
		due = getRandomDirection();
		direction = getRandomDirection();
		vulnerable = false;
	};

	function makeVulnerable()
	{
		vulnerable = true;
	};

	function stopVulnerable()
	{
		vulnerable = false;
	};

	function setCoord(y, x)
	{
		position = {
			"x": x * map.blockSize,
			"y": y * map.blockSize
		};
	};

	reset();

	return {
		"move": move,
		"draw": draw,
		"reset": reset,
		"makeVulnerable": makeVulnerable,
		"stopVulnerable": stopVulnerable,
		"setCoord": setCoord
	}
}

var GAME = (function() {
	
	var tiles      = null,
		map        = null,
		ctx        = null,
		player     = null,
		state      = null,
		numEnemys  = 3,
		tick       = 0,
		timerStart = 0,
		powerUpTimer = null,
		enemys     = [];

	function powerUp()
	{
		powerUpTimer = tick;
		player.setSpeed(16);
		for (var i = 0; i < enemys.length; i++)
		{
			enemys[i].makeVulnerable();
		}
	};

	function powerDown()
	{
		powerUpTimer = null;
		player.setSpeed(4);
		tick = 0;
		for (var i = 0; i < enemys.length; i++)
		{
			enemys[i].stopVulnerable();
		}

		var newEnemyCount = numEnemys - enemys.length;
		for (var i = 0; i < newEnemyCount; i++)
		{
			enemys.push(new Game.Enemy({"getTick": getTick, "playerCoord": playerCoord}, map, tiles));
		}
	};

	function levelClear()
	{
		drawWin();
		state = LEVELCLEAR;
	};
	
	function init(wrapper) {
        
		blockSize = 32;
        var canvas = document.createElement("canvas");

		var image = new Image();

		tiles = new Game.Tiles(blockSize, image);
		map = new Game.Map(blockSize, tiles);
		player = new Game.Player({"getTick": getTick, "powerUp": powerUp, "levelClear": levelClear}, map, tiles);
		
		for (var i = 0; i < numEnemys; i++)
		{
			enemys.push(new Game.Enemy({"getTick": getTick, "playerCoord": playerCoord}, map, tiles));
		}

		canvas.setAttribute("width", (blockSize * Game.MAP[0].length) + "px");
        canvas.setAttribute("height", (blockSize * (Game.MAP.length + 1)) + "px");

        wrapper.appendChild(canvas);

        ctx  = canvas.getContext('2d');

		image.onload = function ()
		{
			loaded();
		}

		image.src = "tile.png";
    };

	function drawFooter()
	{
		ctx.beginPath();
		ctx.fillStyle = "#000";
		ctx.fillRect(0, map.height * map.blockSize, blockSize * 5, blockSize);
		ctx.closePath();

		for (var i = 0; i < player.powerUps(); i++)
		{
			var x = i * map.blockSize;
			var y = map.height * map.blockSize;


			tiles.drawTile(ctx, y, x, 0, 3);
		}
	}

	function keyPress(e) 
	{ 
		e.preventDefault();
		e.stopPropagation();
    };

	function keyDown(e)
	{
		return player.keyDown(e);
	};

	function redrawBlock(pos) {
        map.drawBlock(Math.floor(pos.y/32), Math.floor(pos.x/32), ctx);
        map.drawBlock(Math.ceil(pos.y/32), Math.ceil(pos.x/32), ctx);
    };

	function collided(player, enemy) {
        return (Math.sqrt(Math.pow(enemy.x - player.x, 2) + 
                          Math.pow(enemy.y - player.y, 2))) < (map.blockSize / 2);
    };

	function playerCoord()
	{
		return map.positionToCoord(player.getPosition());
	};

	function mainDraw()
	{
		pos = player.move();
		enemyPos = [];
		
		for (var i = 0; i < enemys.length; i++)
		{
			enemyPos.push(enemys[i].move());
		}

		redrawBlock(pos.old);
		
		for (var i = 0; i < enemys.length; i++)
		{
			redrawBlock(enemyPos[i].old);
		}

		player.draw(ctx);
		for (var i = 0; i < enemys.length; i++)
		{
			enemys[i].draw(ctx)
		}

		for (var i = 0; i < enemys.length; i++)
		{
			if (collided(pos["new"], enemyPos[i]["new"]))
			{
				if (powerUpTimer !== null)
				{
					enemys.splice(i,1);
					enemyPos.splice(i,1);
					i--;
				}
				else
				{
					state = DYING;
					timerStart = tick;
					break;
				}
			}
		}
	};

	function drawWin()
	{
		alert("you win!");
	}

	function startLevel()
	{
		state = PLAYING;
		tick = 0;
		powerUpTimer = null;
		player.reset();

		for (var i = 0; i < enemys.length; i++)
		{
			enemys[i].reset();
		}

		enemys[0].setCoord(2,3);
		enemys[1].setCoord(2,15);
		enemys[2].setCoord(9,13);
	}

	function mainLoop()
	{
		
		if (state === PLAYING)
		{
			if (tick - powerUpTimer >= 64)
			{
				powerDown();
			}
			mainDraw()
		}
		else if (state === LEVELCLEAR)
		{
		}
		else if (state === DYING)
		{
			if ((tick - timerStart) > 50)
			{
				startLevel();
				map.draw(ctx);
				tick--;
			}
		}

		drawFooter();

		tick++;

	};

	function getTick()
	{
		return tick;
	};

	function loaded()
	{
		map.draw(ctx);
		startLevel();
		document.addEventListener("keydown", keyDown, true);
        document.addEventListener("keypress", keyPress, true); 
        
        timer = window.setInterval(mainLoop, 35);
	};

	return {
        "init" : init,
    };

}());



