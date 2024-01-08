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

function initCanvas() {
	const canvas = document.querySelector('#wave');
	const cs = getComputedStyle(canvas);
	const width = parseInt(cs.width, 10);
	const height = parseInt(cs.height, 10);
	canvas.width = width;
	canvas.height = height;

	return {
		width,
		height,
		ctx: canvas.getContext('2d'),
	}
}

function drawLine(noise, ctx, cs, width, height, x, y) {
	ctx.beginPath();
	ctx.moveTo(x, y);
	const xEnd = x + cs.length();

	const hue = mapRange(noise(x, y), -1, 1, 0, width);
	ctx.strokeStyle = `hsl(${hue}, ${cs.saturation()}%, 70%)`;

	while (x < xEnd) {
		const n = noise(x / cs.zoom(), y / cs.zoom());
		x += Math.cos(n) * cs.jig();
		y += Math.sin(n) * cs.jig();
		ctx.lineTo(x, y);
	}

	ctx.stroke();
}

function drawLines(noise, ctx, cs, width, height) {
	ctx.clearRect(0, 0, width, height);

	for (let y = 0; y < height; y += 20) {
		for (let x = 0; x < width; x += 20) {
			drawLine(noise, ctx, cs, width, height, x, y);
		}
	}
}


function initControls(updateCb) {
	const c = document.querySelector('.controls');
	if (localStorage.getItem('showControls') === 'true') {
		c.classList.remove('hidden');
	}

	window.addEventListener('keypress', (e) => {
		if (e.key === 'c') {
			localStorage.setItem('showControls', `${c.classList.contains('hidden')}`);
			c.classList.toggle('hidden');
		}
	});

	return {
		jig: initRange('#jig', updateCb),
		zoom: initRange('#zoom', updateCb),
		length: initRange('#length', updateCb),
		saturation: initRange('#saturation', updateCb),
	}
}

function debugControls(controls) {
	if (location.hash !== '#debug') return;

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
