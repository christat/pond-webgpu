export type StringHash32 = number;

// Shamelessly stolen from: https://mojoauth.com/hashing/fast-hash-in-javascript-in-browser/
function stringHash32(str: string): StringHash32 {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i); // Hash computation
        hash |= 0; // Convert to 32bit integer
    }
    return hash >>> 0; // Ensure the result is unsigned
}

export const hash = {
    stringHash32,
}