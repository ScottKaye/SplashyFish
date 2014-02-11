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

	var fish = {
		"x": width / 4,
		"y": height / 2,
		"yVel": 0,
		"image": null,
		"wings": true,
		"speed": 5
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
			if (playing) {
				var wallHeight = getRand(0, height - spaceSize);

				walls.push(new wall(wallHeight));
				walls.push(new wall(height - wallHeight - spaceSize));
			}
			newWall();
		}, wallFrequency);
	}

	//Wing flaps
	setInterval(function() {
		fish.wings = !fish.wings;
	}, 100);

	//Save fish path
	setInterval(function() {
		if(hacks) {
			points.push({
				"x": fish.x,
				"y": fish.y
			});
		}
	}, 25);

	function play() {
		playing = true;
		newWall();
		fish.image = document.createElement("img");
		fish.image.src = "img/sprites.png";
		fish.image.style.display = "none";
		document.body.appendChild(fish.image);
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
		if (playing) {
			fish.yVel = 8;
			playSound("jump.mp3");
			hacks = false;
		}
	}

	function restart() {
		walls = [];
		score = 0;
		playing = true;
		fish.yVel = 0;
		fish.y = height / 2;
		fish.x = width / 4;
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

	function drawText(text, x, y, color) {
		var beforeFillStyle = context.fillStyle;
		context.fillStyle = color;
		context.font = "24px 'Press Start 2P'";
		context.fillText(text, x, y);
		context.fillStyle = beforeFillStyle;
	}

	function drawFish(x, y) {

		var angle = fish.yVel * 2;

		var wingOffset = fish.wings ? 0 : 240;

		context.translate(x, y);
		context.rotate(angle * Math.PI / 180);
		context.drawImage(fish.image, wingOffset, 0, 240, 240, -16, -16, 32, 32);
		context.rotate(-angle * Math.PI / 180);
		context.translate(-x, -y);
	}

	function playSound(soundFile) {
		var file = "snd/" + soundFile;
		var audio = new Audio(file);
		audio.addEventListener("loadedmetadata", function() {
			audio.play();
		}, false);
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
			//drawCircle(fish.x, fish.y, 16, "#fff");
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
						points[i].x -= fish.speed;
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
							score++;
						}, 100);

						//Determine collisions
						if ((wall.direction === "down" && fishTop <= wall.length) || (wall.direction === "up" && fishBottom >= height - wall.length)) {
							//Dead
							playing = false;
						}
					}

					//Move wall
					wall.x -= fish.speed;
				}
			});

			//Draw score
			drawText(score, width - 64, 64, "#ffffff");

			if (hacks) {
				//Draw hitboxes
				drawCircle(fish.x, fishTop, 2, "yellow");
				drawCircle(fish.x, fishBottom, 2, "cyan");
				drawCircle(fishLeft, fish.y, 2, "pink");
				drawCircle(fishRight, fish.y, 2, "lime");
			}

			if (!hacks) {
				//Move fish
				fish.y += fish.yVel;
				fish.yVel = fish.yVel / 0.981 - 0.5;
			} else {
				fish.x = mouseX;
				fish.y = mouseY;
			}

			//If the fish leaves screen
			if (fishTop <= 0 || fishBottom >= height) {
				playing = false;
			}

		}
	})();
});