import './style.css'
import {createNoise2D} from 'simplex-noise';

function mapToDegrees(n) {
	return (n + 1) * 180;
}

function initCanvas() {
	const canvas = document.querySelector('#wave');
	const cs = getComputedStyle(canvas);
	const width = parseInt(cs.width, 10);
	const height = parseInt(cs.height, 10);

	const ratio = devicePixelRatio ?? 1;
	canvas.width = width * ratio;
	canvas.height = height * ratio;

	return {
		width,
		height,
		ctx: canvas.getContext('2d'),
	}
}

function step(noise, ctx, width, height, offset = 0) {
	console.log('step');
	const smoothness = 100;
	const speed = .3;

	ctx.clearRect(0, 0, width, height);

	for (let y = 0; y < height; y += 20) {
		for (let x = 0; x < width; x += 20) {
			const n = noise((x + offset ) / smoothness, (y + offset) / smoothness);
			const stepSize = 10;
			console.log(n);

			ctx.beginPath();
			ctx.moveTo(x, y);
			ctx.lineTo(
				x + Math.cos(n) * stepSize,
				y + Math.sin(n) * stepSize
			);
			ctx.closePath();
			ctx.strokeStyle = `hsl(${mapToDegrees(n)}, 40%, 70%)`;
			ctx.stroke();
		}
	}

	requestAnimationFrame(() => {
		step(noise, ctx, width, height, offset + speed);
	});
}

function run() {
	const {ctx, width, height} = initCanvas();
	const noise = createNoise2D();

	requestAnimationFrame(() => {
		step(noise, ctx, width, height);
	});
}

run();
