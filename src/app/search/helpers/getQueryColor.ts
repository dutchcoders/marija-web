import { each } from 'lodash';
import { queryColors } from '../../ui/uiConstants';

export default function getQueryColor(searches) {
    const used = {};

    queryColors.forEach(color => used[color] = 0);
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