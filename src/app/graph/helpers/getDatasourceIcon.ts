export function getDatasourceIcon(datasource: string): string {
	const icons = {
		'twitter-tweets': ''
	};

	if (icons[datasource]) {
		return icons[datasource];
	}

	return '';
}