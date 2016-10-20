export default function phone(p) {
    if (typeof p == 'string') {
        p = p.replace(/^0/i, "31");
    }
    return p;
}
