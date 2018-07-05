export function hexToString(hex: number): string {
	return '#' + ('00000' + (hex | 0).toString(16)).substr(-6);
}