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
	const width = parseFloat(cs.width, 10);
	const height = parseInt(cs.height, 10);
	canvas.width = width;
	canvas.height = height;

	return {
		width,
		height,
		ctx: canvas.getContext('2d'),
	}
}

function snap(x, y) {
	const width = 100;
	const height = 100;

	const xStart = (window.innerWidth / 2) - width;
	const xEnd = (window.innerWidth / 2) + width;
	const yStart = (window.innerHeight / 2) - height;
	const yEnd = (window.innerHeight / 2) + height;

	// If coordinates are inside the box
	if (x > xStart && x < xEnd && y > yStart && y < yEnd) {
		x = x < xStart + width ? xStart : xEnd;
		y = y < yStart + height ? yStart : yEnd;
	}

	return [x, y];
}

function drawLine(noise, ctx, cs, width, height, x, y, offset) {
	ctx.beginPath();
	ctx.moveTo(...snap(x, y));

	const hue = mapRange(x + y, 0, width + height, 0, 360);
	ctx.strokeStyle = `hsl(${hue}, ${cs.saturation()}%, 70%)`;

	const lStart = cs.length() * (cs.lengthVariance() / 100);
	const length = mapRange(noise(x + offset, y + offset), -1, 1, lStart, cs.length());
	const xEnd = x + length;

	while (x < xEnd) {
		const n = noise((x + offset) / cs.zoom(), (y + offset) / cs.zoom());
		x += Math.cos(n * cs.warp()) * cs.jig();
		y += Math.sin(n * cs.warp()) * cs.jig();
		ctx.lineTo(...snap(x, y));
	}

	ctx.stroke();
}

function drawLines(noise, ctx, cs, width, height, offset = 0) {
	ctx.clearRect(0, 0, width, height);

	for (let y = 0; y < height; y += cs.spacing()) {
		for (let x = 0; x < width; x += cs.spacing()) {
			drawLine(noise, ctx, cs, width, height, x, y, offset);
		}
	}

	if (cs.animate()) {
		requestAnimationFrame(() => {
			drawLines(noise, ctx, cs, width, height, offset + cs.speed());
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
}

run();
