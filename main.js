import './style.css'
import {createNoise2D} from 'simplex-noise';

function mapToDegrees(n) {
	return (n + 1) * 180;
}

function mapRange(n, a, b, c, d) {
	return (n - a) * (d - c) / (b - a) + c;
}

function randBetween(a, b) {
	return a + Math.floor((b - a) * Math.random());
}

function initRange(selector) {
	const input = document.querySelector(selector);
	let value = input.value;
	input.addEventListener('input', (e) => {
		value = e.target.value;
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

function drawLine(noise, ctx, width, height, cs) {
	let x = 0;
	let y = randBetween(0, height);
	ctx.beginPath();
	ctx.moveTo(x, y);

	while (x < width) {
		const n = noise(x / cs.smoothness(), y / cs.smoothness());
		x += Math.cos(n) * cs.jig();
		y += Math.sin(n) * cs.jig();
		ctx.lineTo(x, y);
	}

	ctx.strokeStyle = '#fff';
	ctx.stroke();
}


function initControls() {
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
		jig: initRange('#jig'),
		smoothness: initRange('#smoothness'),
	}
}

function run() {
	const {ctx, width, height} = initCanvas();
	const noise = createNoise2D();
	const controls = initControls();

	document.addEventListener('click', () => {
		drawLine(noise, ctx, width, height, controls);
	});

	for (let i = 0; i <= window.innerHeight / 10; i++) {
		drawLine(noise, ctx, width, height, controls);
	}
}

run();
