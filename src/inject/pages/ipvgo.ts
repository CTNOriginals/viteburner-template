import { NS } from "@ns";
import { bprint } from "@/handlers/printHandler";
import { doc, Pages } from "..";
import { getElementOnceAvailable } from "../utils";
import { getActivePage } from "../content";
import { fakeNS } from "@/lib/generalData";

const tabsBarPath = '/html/body/div[1]/div[2]/div[2]/div/div[1]/div/div';
enum Tabs {
	None = 'None',
	IPvGO_Subnet = 'IPvGO Subnet',
	Status = 'Status',
	History = 'History',
	How_To_Play = 'How To Play'
}

export async function init() {
	const tabsBar = await getElementOnceAvailable(tabsBarPath, 100, 10);
	if (!tabsBar) return;

	let activeTab: Tabs = Tabs.None;
	while (true) {
		const selected = tabsBar.getElementsByClassName('Mui-selected');
		const selectedTab = getTabFromText(selected[0].textContent!);
		
		if (selectedTab.toString() !== activeTab.toString()) {
			if (selectedTab == 'IPvGO Subnet') {
				const goBaord = doc.getElementById('goGameboard');
				goBaord!.style.rotate = '90deg';
			}

			activeTab = selectedTab;
		}

		await fakeNS.asleep(1000)
		if (getActivePage() != Pages.IPvGO_Subnet) {
			break;
		}
	}

	
}

function getTabFromText(text: string): Tabs {
	return Tabs[text.replaceAll(' ', '_') as keyof Tabs];
}

function onTabChange(newTab: Tabs) {

}