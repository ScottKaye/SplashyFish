var splashyfish = (function (canvas) {
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
	var fishImage;
	var wingPosition = true;

	var fish = {
		"x": width / 4,
		"y": height / 2,
		"yVel": 0
	};

	function wall(length) {
		this.direction = totalWalls++ % 2 === 0 ? "up" : "down";
		this.length = length;
		this.x = width;
	}

	var walls = [];

	function newWall() {
		setTimeout(function () {
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
		wingPosition = !wingPosition;
	}, 100);

	function play() {
		playing = true;
		newWall();
		fishImage = document.createElement("img");
		fishImage.src = "img/sprites.png";
		fishImage.style.display = "none";
		document.body.appendChild(fishImage);
	}

	play();

	canvas.addEventListener("mousedown", function (mouse) {
		if (mouse.which === 1) {
			jump();
		} else if (mouse.which === 2) {
			playing = true;
			hacks = true;
		}
	}, false);

	window.addEventListener("keydown", function (key) {
		if (key.which === 32) {
			jump();
		}
		if (key.which === 13) {
			restart();
		}
	}, false);

	canvas.addEventListener("mousemove", function (mouse) {
		mouseX = mouse.x;
		mouseY = mouse.y;
	}, false);

	function jump() {
		fish.yVel = 8;
		playSound("jump.mp3", 0);

		hacks = false;
	}

	function restart() {
		walls = [];
		score = 0;
		playing = true;
		fish.yVel = 0;
		fish.y = height / 2;
		fish.x = width / 4;

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
		context.font = "16px 'Press Start 2P'";
		context.fillText(text, x, y);
		context.fillStyle = beforeFillStyle;
	}

	function drawFish(x, y) {
		x -= 16;
		y -= 16;

		var offset = wingPosition ? 0 : 240;

		context.drawImage(fishImage, offset, 0, 240, 240, x, y, 32, 32);
	}

	function playSound(soundFile, position) {
		var audio = document.createElement("audio");
		var source = document.createElement("source");
		source.type = "audio/mpeg";
		source.src = "snd/" + soundFile;
		audio.appendChild(source);
		document.body.appendChild(audio);
		audio.volume = 0.5;
		audio.play();
		setTimeout(function () {
			document.body.removeChild(audio);
		}, 800);
	}

	(function animateLoop() {
		requestAnimationFrame(animateLoop);

		if (playing) {
			context.fillStyle = "black";
			context.fillRect(0, 0, width, height);

			//Draw fish
			//drawCircle(fish.x, fish.y, 16, "#fff");
			drawFish(fish.x, fish.y);

			//Find fish edge locations
			var fishTop = fish.y - 16;
			var fishBottom = fish.y + 16;
			var fishRight = fish.x + 16;
			var fishLeft = fish.x - 16;

			//Draw walls
			walls.forEach(function (wall) {
				var y;

				//Determine wall location
				switch (wall.direction) {
					default:
				case "up":
					y = height - wall.length;
					context.fillStyle = "red";
					break;
				case "down":
					y = 0;
					context.fillStyle = "blue";
					break;
				}

				//Draw wall
				context.fillRect(wall.x, y, wallWidth, wall.length);

				//Check collisions
				if (fishRight >= wall.x && fishLeft < wall.x + wallWidth) {

					//Update score
					clearTimeout(scoreTimeout);
					scoreTimeout = setTimeout(function () {
						score++;
					}, 100);

					//Determine collisions
					if ((wall.direction === "down" && fishTop <= wall.length) || (wall.direction === "up" && fishBottom >= height - wall.length)) {
						//Dead
						playing = false;
					}
				}

				//Move wall
				wall.x -= 5;
			});

			//Draw score
			drawText(score, width - 32, 32, "#ffffff");

			if(hacks) {
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