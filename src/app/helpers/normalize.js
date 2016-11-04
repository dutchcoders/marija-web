export default function normalize(p) {
    if (typeof p == 'string') {
        p = p.replace(/^0/i, "31");
    }
    return p;
}
