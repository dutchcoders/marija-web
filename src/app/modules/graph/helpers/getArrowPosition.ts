/**
 * Calculating arrow positions on curved lines is surprisingly complicated.
 *
 * @param {number} centerX
 * @param {number} centerY
 * @param {number} radius
 * @param {number} endAngle
 * @param {boolean} counterClockWise
 * @param {number} targetX
 * @param {number} targetY
 * @returns {{x: number; y: number; angle: number}}
 */
export function getArrowPosition(centerX: number, centerY: number, radius: number, endAngle: number, counterClockWise: boolean, targetX: number, targetY: number) {
    const circumference = Math.PI * radius * 2;
    const arrowLength = 10;
    const smallAngle = arrowLength / circumference * Math.PI * 2;
    let arrowStartAngle;

    if (counterClockWise) {
        arrowStartAngle = endAngle + smallAngle;
    } else {
        arrowStartAngle = endAngle - smallAngle;
    }

    const arrowX = radius * Math.cos(arrowStartAngle) + centerX;
    const arrowY = radius * Math.sin(arrowStartAngle) + centerY;

    // Calculate arrow direction
    const deltaY = targetY - arrowY;
    const deltaX = targetX - arrowX;
    const arrowAngle = Math.atan2(deltaY, deltaX) + Math.PI;

    return {
        x: arrowX,
        y: arrowY,
        angle: arrowAngle
    }
}