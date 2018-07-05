import { each } from 'lodash';

const colors = [
    '#de79f2',
    '#917ef2',
	'#ff7373',
	'#ff5252',
    '#ff884d',
	'#ff6692',
	'#bf8757',
];

export default function getQueryColor(searches) {
    const used = {};

    colors.forEach(color => used[color] = 0);
    searches.forEach(search => used[search.color] ++);

    let leastUsedColor;
    let leastUsedTimes = 10;

    // Find color that's used the least amount of times
    each(used, (times, color) => {
        if (times < leastUsedTimes) {
            leastUsedTimes = times;
            leastUsedColor = color;
        }
    });

    return leastUsedColor;
}