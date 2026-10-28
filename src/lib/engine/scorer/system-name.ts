const CANONICAL = ['Workday', 'Taleo', 'iCIMS', 'Greenhouse', 'Lever', 'SuccessFactors'];

// models vary the label ("SAP SuccessFactors", "Oracle Taleo") and history deltas key on it
export function canonicalSystem(name: string): string {
	const flat = name.toLowerCase().replace(/[^a-z]/g, '');
	return CANONICAL.find((c) => flat.includes(c.toLowerCase())) ?? name;
}
