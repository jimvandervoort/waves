import './style.css'
import {createNoise2D} from 'simplex-noise';
import {attachClickToggle, attachInput, attachKeyToggle, makeState} from "./state.js";

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

function snap(state, x, y) {
	const width = 30;
	const height = 30;

	const xStart = (window.innerWidth / 2) - width;
	const xEnd = (window.innerWidth / 2) + width;
	const yStart = (window.innerHeight / 2) - height;
	const yEnd = (window.innerHeight / 2) + height;

	([x, y] = applyGravity(x, y, window.innerWidth / 2, window.innerHeight / 2, state.gravity));

	// If coordinates are inside the box
	let isInside = x > xStart && x < xEnd && y > yStart && y < yEnd;
	if (isInside) {
		return;
	}

	return [x, y];
}

function drawDot(noise, ctx, state, width, height, x, y, offset) {
	ctx.beginPath();

	ctx.strokeStyle = `#fff`;

	const n = noise((x + offset) / state.zoom, (y + offset) / state.zoom);
	x += Math.cos(n * state.warp) * state.jig;
	y += Math.sin(n * state.warp) * state.jig;
	const cords = snap(state, x, y);
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

function run() {
	const {ctx, width, height} = initCanvas();
	const noise = createNoise2D();

	const { state, onUpdate } = makeState();
	state.flip = false;
	attachInput(state, 'warp', '#warp');
	attachInput(state, 'jig', '#jig');
	attachInput(state, 'zoom', '#zoom');
	attachInput(state, 'saturation', '#saturation');
	attachInput(state, 'spacing', '#spacing');
	attachInput(state, 'speed', '#speed');
	attachInput(state, 'gravity', '#gravity');
	attachClickToggle(state, 'flip', '#wave', false);
	attachKeyToggle(state, 'animate', 'a', true);
	attachKeyToggle(state, 'showControls', 'c', false);

	onUpdate(() => {
		debugState(state);

		if (state.showControls) {
			document.querySelector('#controls').classList.add('hidden');
		} else {
			document.querySelector('#controls').classList.remove('hidden');
		}
	});

	drawDots(noise, ctx, state, width, height);
}

run();
