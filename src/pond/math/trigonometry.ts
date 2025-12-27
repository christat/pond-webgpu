function radians(degrees: number) {
    return degrees * (Math.PI / 180);
}

function degrees(radians: number) {
    return radians * (180 / Math.PI);
}

export const trigonometry = {
    radians,
    degrees,
};