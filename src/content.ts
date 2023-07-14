const charts = document.getElementsByClassName("uch-psvg");
const prices = document.getElementsByClassName("DFlfde SwHCTb");

const draw = (audioArray: number[]) => {
	const max = Math.max(...audioArray);
	const dx = 250 / audioArray.length;
	const ys = audioArray.map((a) => {
		const r = a / 256;
		const v = Math.E ** ((r * 1.2) ** 2) - 1;
		return 140 - v * 140;
	});
	const d =
		ys.reduce((acc, y, i) => {
			const x = dx * i;
			const c = !i ? "M" : "L";
			return acc + `${c} ${x} ${y} `;
		}, "") + "L 2000 0 L 2000 1000 L -1000 1000";
	for (const chart of charts) {
		const children = chart.children;
		for (const child of children) {
			if (child.tagName !== "path") continue;
			child.setAttribute("d", d);
		}
	}
	for (const price of prices) {
		price.textContent = max.toFixed(2);
	}
};

let stream: MediaStream | void;

const play = async () => {
	const tracks = stream?.getTracks() ?? [];
	tracks.forEach((track) => track.stop());
	stream = await navigator.mediaDevices
		.getDisplayMedia({
			audio: true,
		})
		.catch(() => {
			return;
		});
	if (!stream) return;
	const context = new AudioContext();
	const source = context.createMediaStreamSource(stream);
	const analyser = context.createAnalyser();
	source.connect(analyser);
	const frequencies = new Uint8Array(analyser.frequencyBinCount);
	const visualizer = () => {
		analyser.getByteFrequencyData(frequencies);
		const freq = [...frequencies];
		const size = 10;
		const audioArray = Array(50)
			.fill(undefined)
			.map((_, i) => {
				return (
					freq.slice(i * size, (i + 1) * size).reduce((s, a) => s + a, 0) / size
				);
			});
		draw(audioArray);
		requestAnimationFrame(visualizer);
	};
	visualizer();
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	sendResponse();
	if (!charts.length || !prices.length) {
		return true;
	}
	play();
});
