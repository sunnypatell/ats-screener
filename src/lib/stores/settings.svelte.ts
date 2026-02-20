// svelte 5 rune-based store for app settings
class SettingsStore {
	selectedSystems = $state<string[]>([
		'Workday',
		'Taleo',
		'SuccessFactors',
		'iCIMS',
		'Greenhouse',
		'Lever'
	]);
	useLLM = $state(true);
	showDetailedBreakdown = $state(false);

	toggleSystem(name: string) {
		if (this.selectedSystems.includes(name)) {
			this.selectedSystems = this.selectedSystems.filter((s) => s !== name);
		} else {
			this.selectedSystems = [...this.selectedSystems, name];
		}
	}

	toggleLLM() {
		this.useLLM = !this.useLLM;
	}

	toggleDetailedBreakdown() {
		this.showDetailedBreakdown = !this.showDetailedBreakdown;
	}
}

export const settingsStore = new SettingsStore();
