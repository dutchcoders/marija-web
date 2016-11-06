export default function normalize(p) {
    // todo(nl5887)
    // we need to make this customizable, allow users
    // to add their own regexes
    if (typeof p == 'string') {
        p = p.replace(/^0/i, "31");
        p = p.replace(/SPAM\:\s+/i, "");
        p = p.replace(/\s+\<.+?\>/i, "");
    }
    return p;
}
