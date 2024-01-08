import './style.css'
import {createNoise2D} from 'simplex-noise';

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

function initControls(updateCb) {
	const c = document.querySelector('.controls');
	if (localStorage.getItem('showControls') === 'true') {
		c.classList.remove('hidden');
	}

	let animate = localStorage.getItem('animate') !== 'false';
	const controls = {
		jig: initRange('#jig', updateCb),
		zoom: initRange('#zoom', updateCb),
		length: initRange('#length', updateCb),
		lengthVariance: initRange('#length-variance', updateCb),
		saturation: initRange('#saturation', updateCb),
		spacing: initRange('#spacing', updateCb),
		speed: initRange('#speed', updateCb),
		colorSpeed: initRange('#color-speed', updateCb),
		warp: initRange('#warp', updateCb),
		animate() {
			return animate;
		}
	};

	window.addEventListener('keypress', (e) => {
		if (e.key === 'c') {
			localStorage.setItem('showControls', `${c.classList.contains('hidden')}`);
			c.classList.toggle('hidden');
		}

		if (e.key === 'a') {
			animate = !controls.animate();
			localStorage.setItem('animate', `${animate}`);
		}

		updateCb();
	});

	return controls
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

let flip = false;
function snap(x, y) {
	const width = 100;
	const height = 100;

	const xStart = (window.innerWidth / 2) - width;
	const xEnd = (window.innerWidth / 2) + width;
	const yStart = (window.innerHeight / 2) - height;
	const yEnd = (window.innerHeight / 2) + height;

	// If coordinates are inside the box
	let isInside = x > xStart && x < xEnd && y > yStart && y < yEnd;
	if (flip) isInside = !isInside

	if (isInside) {
		x = x < xStart + width ? xStart : xEnd;
		y = y < yStart + height ? yStart : yEnd;
	}

	return [x, y];
}

let zoom = 220;
function drawLine(noise, ctx, cs, width, height, x, y, offset) {
	ctx.beginPath();
	const cords = snap(x, y);
	if (cords) {
		ctx.moveTo(...cords);
	}

	const lStart = cs.length() * (cs.lengthVariance() / 100);
	const length = mapRange(noise(x + offset, y + offset), -1, 1, lStart, cs.length());
	const xEnd = x + length;

	const hue = mapRange(x + y + offset * 10, 0, width + height + offset, 0, 270);
	ctx.strokeStyle = `hsl(${hue}, ${cs.saturation()}%, 70%)`;

	while (x < xEnd) {
		const n = noise((x + offset) / zoom, (y + offset) / zoom);
		x += Math.cos(n * cs.warp()) * cs.jig();
		y += Math.sin(n * cs.warp()) * cs.jig();
		const _cords = snap(x, y);
		if (_cords) ctx.lineTo(..._cords);
	}

	ctx.stroke();
}

let speed = 1;

function drawLines(noise, ctx, cs, width, height, offset = 0) {
	ctx.clearRect(0, 0, width, height);

	for (let y = 0; y < height; y += cs.spacing()) {
		for (let x = 0; x < width; x += cs.spacing()) {
			drawLine(noise, ctx, cs, width, height, x, y, offset);
		}
	}

	if (cs.animate()) {
		requestAnimationFrame(() => {
			drawLines(noise, ctx, cs, width, height, offset + speed);
		});
	}
}

function debugControls(controls) {
	let s = `New controls:\n`;
	for (const c in controls) {
		s += `  ${c}: ${controls[c]()}\n`;
	}
	console.log(s);
}

function run() {
	const {ctx, width, height} = initCanvas();
	const noise = createNoise2D();
	const controls = initControls(() => {
		debugControls(controls);
		drawLines(noise, ctx, controls, width, height);
	});

	drawLines(noise, ctx, controls, width, height);

	window.addEventListener('mousemove', (e) => {
		const x = e.clientX;
		const y = e.clientY;
		speed = mapRange(x, 0, window.innerWidth, 1, 10);
		zoom = mapRange(y, 0, window.innerHeight, 100, 400);

		// TODO this is a mess and repetative
		const boxW = 100;
		const boxH = 100;
		const xStart = (window.innerWidth / 2) - boxW;
		const xEnd = (window.innerWidth / 2) + boxW;
		const yStart = (window.innerHeight / 2) - boxH;
		const yEnd = (window.innerHeight / 2) + boxH;

		flip = x > xStart && x < xEnd && y > yStart && y < yEnd;
		if (flip) {
			speed = .3;
		}

	});

	document.addEventListener('click', () => {
		flip = !flip;
	});
}

run();
