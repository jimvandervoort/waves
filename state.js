export const makeState = () => {
	const storage = {};
	let updateCb;

	const handler = {
		set(obj, prop, value) {
			const result = Reflect.set(...arguments);
			if (updateCb) updateCb();
			return result;
		},
	};

	const state = new Proxy(storage, handler);
	const onUpdate = (newUpdateCb) => {
		updateCb = newUpdateCb;
	}

	return {
		state,
		onUpdate,
	}
}

export const attachInput = (state, prop, selector) => {
	const input = document.querySelector(selector);
	state[prop] = parseFloat(input.value);

	input.addEventListener('input', (e) => {
		state[prop] = parseFloat(e.target.value);
	});
}

export const attachKeyToggle = (state, prop, key, initialValue, updateCb) => {
	const stored = localStorage.getItem(prop);
	if (stored === null) {
		state[prop] = initialValue;
	} else {
		state[prop] = stored === "true";
	}

	document.addEventListener('keypress', (e) => {
		if (e.key === key) {
			state[prop] = !state[prop];
		}

		localStorage.setItem(prop, `${state[prop]}`);

		if (updateCb) updateCb();
	});
}

export const attachClickToggle = (state, prop, elem, initialValue) => {
	state[prop] = initialValue;

	if (typeof elem === 'string') {
		elem = document.querySelector(elem);
	}

	elem.addEventListener('click', () => {
		state[prop] = !state[prop];
	});
}
