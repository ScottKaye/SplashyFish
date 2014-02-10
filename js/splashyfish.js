var splashyfish = (function (canvas) {
	var canvas = document.getElementById(canvas);

	canvas.width = document.documentElement.clientWidth - 5;
	canvas.height = document.documentElement.clientHeight - 5;

	var context = canvas.getContext("2d");
	var width = canvas.width;
	var height = canvas.height;
	var fishSize = height / 50;
	var wallWidth = fishSize;

	var playing = true;
	var hacks = false;
	var mouseX, mouseY;
	var totalWalls = 0;
	var spaceSize = fishSize * 16;
	var wallFrequency = 1000;
	var score = 0;
	var scoreTimeout;

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

	setInterval(function () {
		if (playing) {

			var wallHeight = getRand(0, height - spaceSize);

			walls.push(new wall(wallHeight));
			walls.push(new wall(height - wallHeight - spaceSize));
		}
	}, wallFrequency);

	canvas.addEventListener("mousedown", function (mouse) {
		if (mouse.which === 1) {
			//Jump
			fish.yVel = fishSize;
			playSound("jump.mp3", 0);

			hacks = false;
		} else if (mouse.which === 2) {
			playing = true;
			hacks = true;
		}
	}, false);

	canvas.addEventListener("mousemove", function (mouse) {
		mouseX = mouse.x;
		mouseY = mouse.y;
	}, false);

	function getRand(min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}

	function drawCircle(x, y, radius, color) {
		context.beginPath();
		context.arc(x, y, radius, 0, 2 * Math.PI, false);
		context.fillStyle = color;
		context.fill();
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
	};

	(function animateLoop() {
		requestAnimationFrame(animateLoop);

		if (playing) {
			context.fillStyle = "black";
			context.fillRect(0, 0, width, height);

			//Draw fish
			drawCircle(fish.x, fish.y, fishSize, "#fff");

			//Find fish edge locations
			var fishTop = fish.y - fishSize;
			var fishBottom = fish.y + fishSize;
			var fishRight = fish.x + fishSize;
			var fishLeft = fish.x - fishSize;

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
					clearTimeout(scoreTimeout);
					scoreTimeout = setTimeout(function() {
						score++;
					}, 500);
					if ((wall.direction === "down" && fishTop <= wall.length) || (wall.direction === "up" && fishBottom >= height - wall.length)) {
						//Dead
						alert(score);
						playing = false;
					}
				}

				//Move wall
				wall.x -= 5;
			});

			//Draw hitboxes
			drawCircle(fish.x, fishTop, 3, "yellow");
			drawCircle(fish.x, fishBottom, 3, "cyan");
			drawCircle(fishLeft, fish.y, 3, "pink");
			drawCircle(fishRight, fish.y, 3, "lime");

			if (!hacks) {
				//Move fish
				fish.y += fish.yVel;
				fish.yVel = fish.yVel / 0.981 - 1;
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