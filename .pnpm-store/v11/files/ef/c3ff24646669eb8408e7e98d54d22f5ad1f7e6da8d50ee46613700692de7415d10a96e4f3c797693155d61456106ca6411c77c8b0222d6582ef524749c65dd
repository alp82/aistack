export function add(...a) {
    let r = 0;
    for (const n of a) {
        r += n;
    }
    return r;
}
/** `a - b - c - ...` */
export const substract = (a, ...b) => {
    for (const n of b) {
        a -= n;
    }
    return a;
};
/** `a * b * c * ...` */
export const multiply = (a, ...b) => {
    for (const n of b) {
        a *= n;
    }
    return a;
};
/** `a / b / c / ...` */
export const divide = (a, ...b) => {
    for (const n of b) {
        a /= n;
    }
    return a;
};
/** `a ** b ** c ** ...` */
export const power = (a, ...b) => {
    for (const n of b) {
        a = a ** n;
    }
    return a;
};
/** clamp a number value between two other values */
export const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
