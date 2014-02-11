var splashyfish = (function(canvas) {
	var canvas = document.getElementById(canvas);
	canvas.width = window.innerWidth;
	canvas.height = 400;
	var context = canvas.getContext("2d");
	var width = canvas.width;
	var height = canvas.height;
	var wallWidth = 50;
	var playing = true;
	var hacks = false;
	var mouseX, mouseY;
	var totalWalls = 0;
	var spaceSize = 200;
	var wallFrequency = 1000;
	var score = 0;
	var scoreTimeout;
	var enabled = false;
	var title = "Splashy Fish!";
	var instructions = "Click or Tap Spacebar to Dive!"

	var fish = {
		"x": width / 4,
		"y": height / 2,
		"yVel": 0,
		"image": null,
		"wings": true,
		"speed": 5,
		"angle": 0,
		"dead": false
	};

	function wall(length) {
		this.direction = totalWalls++ % 2 === 0 ? "up" : "down";
		this.length = length;
		this.x = width;
	}
	var walls = [];
	var points = [{
		"x": fish.x,
		"y": fish.y
	}];

	function newWall() {
		setTimeout(function() {
			if (playing && enabled) {
				var wallHeight = getRand(0, height - spaceSize);
				walls.push(new wall(wallHeight));
				walls.push(new wall(height - wallHeight - spaceSize));
			}
			newWall();
		}, wallFrequency);
	}

	//Wing flaps
	setInterval(function() {
		if(!fish.dead) {
			fish.wings = !fish.wings;
		}
		else {
			fish.wings = true;
		}
	}, 100);

	//Save fish path
	setInterval(function() {
		if (hacks) {
			points.push({
				"x": fish.x,
				"y": fish.y
			});
		}
	}, 25);

	function play() {
		newWall();
		fish.image = document.createElement("img");
		fish.image.src = "img/sprites.png";
	}

	play();

	canvas.addEventListener("mousedown", function(mouse) {
		if (mouse.which === 1) {
			jump();
		} else if (mouse.which === 2) {
			points = [{
				"x": fish.x,
				"y": fish.y
			}];
			playing = true;
			hacks = true;
		}
	}, false);

	window.addEventListener("keydown", function(key) {
		if (key.which === 32) {
			jump();
		}
		if (key.which === 13) {
			restart();
		}
	}, false);

	canvas.addEventListener("mousemove", function(mouse) {
		mouseX = mouse.x;
		mouseY = mouse.y;
	}, false);

	function jump() {
		if (playing && !fish.dead) {
			enabled = true;
			fish.yVel = 8;
			playSound("jump.mp3");
			hacks = false;
		}
	}


	function startScreen(){
		while (enabled===false);
		
	}


	function restart() {
		walls = [];
		score = 0;
		playing = true;
		fish.dead = false;
		enabled = false;
		fish.yVel = 0;
		fish.y = height / 2;
		fish.x = width / 4;
		fish.angle = 0;
		points = [{
			"x": fish.x,
			"y": fish.y
		}];
		hacks = false;
	}

	function getRand(min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}

	function drawCircle(x, y, radius, color) {
		var beforeFillStyle = context.fillStyle;
		context.beginPath();
		context.arc(x, y, radius, 0, 2 * Math.PI, false);
		context.fillStyle = color;
		context.fill();
		context.fillStyle = beforeFillStyle;
	}

	function drawText(text, x, y, color, fsize) {
		var beforeFillStyle = context.fillStyle;
		context.fillStyle = color;
		context.font = ""+fsize+"px 'Press Start 2P'";
		context.fillText(text, x, y);
		context.fillStyle = beforeFillStyle;
	}

	function drawFish(x, y) {
		if(!fish.dead) {
			fish.angle = fish.yVel * 2;
		}

		var wingOffset = fish.wings ? 0 : 240;
		context.translate(x, y);
		context.rotate(fish.angle * Math.PI / 180);
		context.drawImage(fish.image, wingOffset, 0, 240, 240, -16, -16, 32, 32);
		context.rotate(-fish.angle * Math.PI / 180);
		context.translate(-x, -y);
	}

	function playSound(soundFile) {
		var file = "snd/" + soundFile;
		var audio = new Audio(file);
		audio.addEventListener("loadedmetadata", function() {
			audio.play();
		}, false);
	}

	function die() {
		fish.yVel = -1;
		fish.dead = true;
	}

	(function animateLoop() {
		requestAnimationFrame(animateLoop);
		if (playing) {
			var sea = context.createLinearGradient(0, 0, 0, height);
			sea.addColorStop(0, "#2980b9");
			sea.addColorStop(1, "#34495e");
			context.fillStyle = sea;
			context.fillRect(0, 0, width, height);
			//Draw fish
			drawFish(fish.x, fish.y);
			//Find fish edge locations
			var fishTop = fish.y - 16;
			var fishBottom = fish.y + 16;
			var fishRight = fish.x + 16;
			var fishLeft = fish.x - 16;
			//Draw fish path
			if (hacks) {
				context.beginPath();
				context.moveTo(points[0].x, points[0].y);
				for (i = 0; i < points.length - 2; i++) {
					if (points[i].x <= -10) {
						points.splice(points.indexOf(points[i]), 1);
					} else {
						var xc = (points[i].x + points[i + 1].x) / 2;
						var yc = (points[i].y + points[i + 1].y) / 2;
						context.lineTo(points[i].x, points[i].y, xc, yc);
						if(enabled && !fish.dead) points[i].x -= fish.speed;
					}
				}
				context.lineWidth = 3;
				context.strokeStyle = '#ff0000';
				context.stroke();
			}
			//Draw walls
			context.fillStyle = "#27ae60";
			walls.forEach(function(wall) {
				//Only process walls that are on screen, but keep the old walls
				if (wall.x >= 0 - wallWidth) {
					var y;
					//Determine wall location
					switch (wall.direction) {
						default:
						case "up":
							y = height - wall.length;
							break;
						case "down":
							y = 0;
							break;
					}
					//Draw wall
					context.fillRect(wall.x, y, wallWidth, wall.length);
					//Check collisions
					if (fishRight >= wall.x && fishLeft < wall.x + wallWidth) {
						//Update score
						clearTimeout(scoreTimeout);
						scoreTimeout = setTimeout(function() {
							score += 100;
						}, 100);
						//Determine collisions
						if ((wall.direction === "down" && fishTop <= wall.length) || (wall.direction === "up" && fishBottom >= height - wall.length)) {
							//Die
							die();
						}
					}
					//Move wall
					if (!fish.dead) wall.x -= fish.speed;
				}
			});
			//Draw score
			drawText(score, width - (score.toString().length * 24) - 32, 64, "#ffffff", 24);
			
			if (!enabled){
				//Show starting info
				drawText(title, (width/2) - (title.toString().length * 24), 64, "#ffffff", 24);
				drawText(instructions, (width/2) - 640, 240, "#ffffff", 16);
			}
			if (hacks) {
				//Draw hitboxes
				drawCircle(fish.x, fishTop, 2, "yellow");
				drawCircle(fish.x, fishBottom, 2, "cyan");
				drawCircle(fishLeft, fish.y, 2, "pink");
				drawCircle(fishRight, fish.y, 2, "lime");
			}
			if (!hacks) {
				//Move fish
				if (enabled || fish.dead) {
					fish.y += fish.yVel;
					fish.yVel = fish.yVel / 0.981 - 0.5;
				} else {
					fish.y = fish.y;
					fish.yVel = 0;
				}
			} else {
				fish.x = mouseX;
				fish.y = mouseY;
			}

			//If the fish leaves screen
			if (fishTop <= 0 || fishBottom >= height) {
				die();
			}

			if(fishTop <= 0 && fish.dead) {
				fish.y = 16;
				fish.yVel = 0;
				fish.angle = 180;
			}

		}
	})();
});