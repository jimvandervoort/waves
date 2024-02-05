import './style.css'
import {createNoise2D} from 'simplex-noise';
import {attachClickToggle, attachInput, attachKeyToggle, makeState} from "./state.js";

// Takes a number "n" and maps it from the range [a, b] to the range [c, d]
function mapRange(n, a, b, c, d) {
	return (n - a) * (d - c) / (b - a) + c;
}

function initCanvas() {
	const canvas = document.querySelector('#wave');
	const cs = getComputedStyle(canvas);
	const width = parseInt(cs.width);
	const height = parseInt(cs.height);
	canvas.width = width;
	canvas.height = height;

	return {
		width,
		height,
		ctx: canvas.getContext('2d'),
	}
}

function applyGravity(x, y, gx, gy, gravityStrength) {
	// Calculate the distance between the object and the gravitational point
	let dx = gx - x;
	let dy = gy - y;
	let distance = Math.sqrt(dx * dx + dy * dy);

	// Normalize the distance vector
	let nx = dx / distance;
	let ny = dy / distance;

	// Apply gravity (the object is pulled towards the gravitational point)
	let gravityEffectX = nx * gravityStrength;
	let gravityEffectY = ny * gravityStrength;

	// Calculate new position
	let newX = x + gravityEffectX;
	let newY = y + gravityEffectY;

	return [ newX, newY ];
}

function drawDot(noise, ctx, state, width, height, x, y, offset) {
	ctx.beginPath();
	ctx.strokeStyle = `hsl(${noise(x / state.zoom, y / state.zoom) * 360}, ${state.saturation}%, 50%)`;

	const n = noise((x + offset) / state.zoom, (y + offset) / state.zoom);
	ctx.strokeStyle = `hsl(${n * 360}, ${state.saturation}%, 50%)`;
	x += Math.cos(n * state.warp) * state.jig;
	y += Math.sin(n * state.warp) * state.jig;
	const cords = applyGravity(x, y, window.innerWidth / 2, window.innerHeight / 2, state.gravity);
	if (cords) {
		ctx.arc(...cords, 1, 0, 2 * Math.PI);
	}

	ctx.stroke();
}

function drawDots(noise, ctx, state, width, height, offset = 0) {
	ctx.clearRect(0, 0, width, height);

	for (let y = 0; y < height; y += state.spacing) {
		for (let x = 0; x < width; x += state.spacing) {
			drawDot(noise, ctx, state, width, height, x, y, offset);
		}
	}

	if (state.animate) {
		requestAnimationFrame(() => {
			drawDots(noise, ctx, state, width, height, offset + state.speed);
		});
	}
}

function debugState(state) {
	let s = `New state:\n`;
	for (const c in state) {
		s += `  ${c}: ${state[c]}\n`;
	}
	console.log(s);
}

function handleOrientationEvent(state, event) {
	state.jig = mapRange(Math.round(event.alpha), 0, 360, 20, 40);
	state.warp = mapRange(Math.round(event.beta), -180, 180, 0.00001, 100);
	state.zoom = mapRange(Math.round(event.gamma), -90, 90, 0.00001, 4000);
	if (event.webkitCompassHeading) {
		state.gravity = mapRange(Math.round(event.webkitCompassHeading), 0, 360, 0, 500);
	}
}

function initOrientationEvent(state) {
	if (!window.DeviceOrientationEvent) {
		return;
	}

	if (typeof DeviceOrientationEvent.requestPermission === 'function') {
		document.getElementById('wave').addEventListener('click', function () {
			// Request permission
			DeviceOrientationEvent.requestPermission()
				.then(permissionState => {
					if (permissionState === 'granted') {
						window.addEventListener('deviceorientation', (event) => {
							handleOrientationEvent(state, event);
						}, true);
					} else {
						alert("Permission to access device orientation was denied.");
					}
				})
				.catch(console.error);
		});
	} else {
		window.addEventListener('deviceorientation', (event) => {
			handleOrientationEvent(state, event);
		}, true);
	}
}

function run() {
	const {ctx, width, height} = initCanvas();
	const noise = createNoise2D();
	const { state, onUpdate } = makeState();

	attachInput(state, 'warp', '#warp') ;
	attachInput(state, 'jig', '#jig');
	attachInput(state, 'zoom', '#zoom');
	attachInput(state, 'saturation', '#saturation');
	attachInput(state, 'spacing', '#spacing');
	attachInput(state, 'speed', '#speed');
	attachInput(state, 'gravity', '#gravity');
	attachKeyToggle(state, 'mouse', 'm', true);

	attachKeyToggle(state, 'animate', 'a', true, () => {
		if (state.animate) {
			drawDots(noise, ctx, state, width, height);
		}
	});

	onUpdate(() => {
		debugState(state);

		if (state.showControls) {
			document.querySelector('#controls').classList.remove('hidden');
		} else {
			document.querySelector('#controls').classList.add('hidden');
		}
	});

	attachKeyToggle(state, 'showControls', 'c', false);

	document.addEventListener('mousemove', (e) => {
		if (state.showControls || !state.mouse) {
			return;
		}

		state.jig = mapRange(e.clientX, 0, window.innerWidth, 0, 100);
		state.gravity = mapRange(e.clientY, 0, window.innerHeight, -200, 1000);
	});

	initOrientationEvent(state);
	drawDots(noise, ctx, state, width, height);
}

run();
