import './style.css'
import {createNoise2D} from 'simplex-noise';
import {makeState, attachInput, attachKeyToggle, attachClickToggle} from "./state.js";

// Takes a number "n" and maps it from the range [a, b] to the range [c, d]
function mapRange(n, a, b, c, d) {
	return (n - a) * (d - c) / (b - a) + c;
}

function initRange(selector, cb) {
	const input = document.querySelector(selector);
	let value = parseFloat(input.value);
	input.addEventListener('input', (e) => {
		value = parseFloat(e.target.value);
		cb();
	});

	return () => {
		return value;
	}
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

function snap(state, x, y) {
	const width = 100;
	const height = 100;

	const xStart = (window.innerWidth / 2) - width;
	const xEnd = (window.innerWidth / 2) + width;
	const yStart = (window.innerHeight / 2) - height;
	const yEnd = (window.innerHeight / 2) + height;

	// If coordinates are inside the box
	let isInside = x > xStart && x < xEnd && y > yStart && y < yEnd;
	if (state.flip) isInside = !isInside

	if (isInside) {
		x = x < xStart + width ? xStart : xEnd;
		y = y < yStart + height ? yStart : yEnd;
	}

	return [x, y];
}

let zoom = 220;
function drawLine(noise, ctx, state, width, height, x, y, offset) {
	ctx.beginPath();
	const cords = snap(state, x, y);
	if (cords) {
		ctx.moveTo(...cords);
	}

	const lStart = state.length * (state.lengthVariance / 100);
	const length = mapRange(noise(x + offset, y + offset), -1, 1, lStart, state.length);
	const xEnd = x + length;

	const hue = mapRange(x + y + offset * 10, 0, width + height + offset, 0, 270);
	ctx.strokeStyle = `hsl(${hue}, ${state.saturation}%, 70%)`;

	while (x < xEnd) {
		const n = noise((x + offset) / zoom, (y + offset) / zoom);
		x += Math.cos(n * state.warp) * state.jig;
		y += Math.sin(n * state.warp) * state.jig;
		const _cords = snap(state, x, y);
		if (_cords) ctx.lineTo(..._cords);
	}

	ctx.stroke();
}

function drawLines(noise, ctx, state, width, height, offset = 0) {
	ctx.clearRect(0, 0, width, height);

	for (let y = 0; y < height; y += state.spacing) {
		for (let x = 0; x < width; x += state.spacing) {
			drawLine(noise, ctx, state, width, height, x, y, offset);
		}
	}

	if (state.animate) {
		requestAnimationFrame(() => {
			drawLines(noise, ctx, state, width, height, offset + state.speed);
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
	attachInput(state, 'length', '#length');
	attachInput(state, 'lengthVariance', '#length-variance');
	attachInput(state, 'saturation', '#saturation');
	attachInput(state, 'spacing', '#spacing');
	attachInput(state, 'speed', '#speed');
	attachInput(state, 'colorSpeed', '#color-speed');
	attachClickToggle(state, 'flip', '#wave', false);
	attachKeyToggle(state, 'animate', 'a', true);
	attachKeyToggle(state, 'mouse', 'm', true);

	onUpdate(() => {
		if (state.showControls) {
			document.querySelector('#controls').classList.add('hidden');
		} else {
			document.querySelector('#controls').classList.remove('hidden');
		}
	});

	attachKeyToggle(state, 'showControls', 'c', false);

	drawLines(noise, ctx, state, width, height);

	window.addEventListener('mousemove', (e) => {
		if (!state.mouse) {
			return;
		}

		const x = e.clientX;
		const y = e.clientY;
		state.speed = mapRange(x, 0, window.innerWidth, 1, 10);
		zoom = mapRange(y, 0, window.innerHeight, 100, 400);

		// TODO this is a mess and repetitive
		const boxW = 100;
		const boxH = 100;
		const xStart = (window.innerWidth / 2) - boxW;
		const xEnd = (window.innerWidth / 2) + boxW;
		const yStart = (window.innerHeight / 2) - boxH;
		const yEnd = (window.innerHeight / 2) + boxH;

		state.flip = x > xStart && x < xEnd && y > yStart && y < yEnd;
	});
}

run();
