export function getHaversineDistance(pointA: string, pointB: string): number {
	const parsedA = pointA.split(/ ?,/);
	const latA = parseFloat(parsedA[0]);
	const lngA = parseFloat(parsedA[1]);
	const parsedB = pointB.split(/ ?,/);
	const latB = parseFloat(parsedB[0]);
	const lngB = parseFloat(parsedB[1]);


	var R = 6371; // km
	var x1 = latB - latA;
	var dLat = toRadian(x1);
	var x2 = lngB - lngA;
	var dLon = toRadian(x2);

	var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
		Math.cos(toRadian(latA)) * Math.cos(toRadian(latB)) *
		Math.sin(dLon/2) * Math.sin(dLon/2);
	var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
	var d = R * c;

	return d;
}

function toRadian(number: number): number {
	return number * Math.PI / 180;
}