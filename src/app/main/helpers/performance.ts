const markers: string[] = [];

export function markPerformance(marker: string) {
	if (markers.indexOf(marker) === -1) {
		markers.push(marker);
	}

	window.performance.mark(marker);
}

export function measurePerformance(from: string, to: string) {
	if (markers.indexOf(from) === -1) {
		throw new Error('Trying to measure non-existing marker: ' + from);
	}

	if (markers.indexOf(to) === -1) {
		throw new Error('Trying to measure non-existing marker: ' + to);
	}

	window.performance.measure(from + ' -> ' + to, from, to);
}

declare const window: any;

interface Stat {
	name: string;
	highestDuration: number;
	averageDuration: number;
	timesSeen: number;
}

window.getPerformance = () => {
	const measures = window.performance.getEntriesByType('measure');
	const stats: Stat[] = [];
	let longestNameLength: number = 0;

	measures.forEach(measure => {
		let stat: Stat = stats.find(stat => stat.name === measure.name);
		let duration = Math.round(measure.duration * 100) / 100;

		if (!stat) {
			stats.push({
				name: measure.name,
				highestDuration: duration,
				averageDuration: duration,
				timesSeen: 1
			});

			longestNameLength = Math.max(longestNameLength, measure.name.length);
		} else {
			stat.highestDuration = Math.max(stat.highestDuration, duration);


			stat.averageDuration = Math.round(((stat.averageDuration * stat.timesSeen + duration) / (stat.timesSeen + 1)) * 100) / 100;
			stat.timesSeen ++;
		}
	});

	stats.sort((a, b) => b.averageDuration - a.averageDuration);

	console.log(
		'Description'.padEnd(longestNameLength + 3) +
		'Highest'.padEnd(10) +
		'Average'.padEnd(10) +
		'Times seen'.padEnd(15)
	);

	stats.forEach(stat => {
		console.log(
			stat.name.padEnd(longestNameLength + 3) +
			stat.highestDuration.toString().padEnd(10) +
			stat.averageDuration.toString().padEnd(10) +
			stat.timesSeen.toString().padEnd(15)
		);
	});
};