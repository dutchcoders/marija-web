import { reduce } from 'lodash';

// get store
export default function normalize(normalizations, p, normalization) {
    if (typeof p == 'string') {
        return reduce(normalizations, (currentValue, normalization) => {
            var re = new RegExp(normalization.regex, "i");
            return currentValue.replace(re, normalization.replaceWith);
        }, p);
    }
    return p;
}
