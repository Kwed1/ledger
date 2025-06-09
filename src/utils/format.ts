export const formatNumber = (value: number): string => {
	if (value >= 1000000) {
		return `$${(value / 1000000).toFixed(2)}M`
	}
	if (value >= 1000) {
		return `$${(value / 1000).toFixed(2)}K`
	}
	return `$${value.toFixed(2)}`
} 