import { NS } from "@ns";
import { getElementOnceAvailable } from "../utils";

export enum GangTabs {
	Management = <any>'Management',
	Equipment = <any>'Equipment',
	Territory = <any>'Territory',
}

export async function main(ns: NS) {
	ns.disableLog('ALL');
	console.log('here')

	const tabButtonsPath = '/html/body/div[1]/div[2]/div[2]/div[1]/div/div';
	const tabButtons = await getElementOnceAvailable(tabButtonsPath, 100) as HTMLElement[]|null;
	
	function getActiveTabElement() {
		if (tabButtons == null) return null;
	
		for (let i = 0; i < tabButtons.length; i++) {
			const button = tabButtons[i];
			if (button.classList.contains('Mui-selected')) {
				return button;
			}
		}
	}
	
	function getActiveTab(): GangTabs {
		return GangTabs[getActiveTabElement()?.textContent as keyof GangTabs]
	}

	while (true) {
		let activeTab: GangTabs = GangTabs.Management as GangTabs;
		const tab: GangTabs = getActiveTab();

		if (tab != activeTab) {
			switch (tab) {
				case GangTabs.Management: {
					
				} break;
				case GangTabs.Equipment: {} break;
				case GangTabs.Territory: {} break;
			
				default: break;
			}
		}

		activeTab = tab;

		await ns.asleep(1000);
	}
}