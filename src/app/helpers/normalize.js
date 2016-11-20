import { reduce } from 'lodash';

// todo(nl5887): this cache isn't working for new searches when new normalizations are being added.
let cache = {
};

// get store
export default function normalize(normalizations, v, normalization) {
    if (cache[p]) {
        return (cache[p]);
    }

    let p = v;

    if (typeof p == 'string') {
        return reduce(normalizations, (currentValue, normalization) => {
            return currentValue.replace(normalization.re, normalization.replaceWith);
        }, p);
    }

    cache[v] = p;
    return p;
}
