import { Pages } from ".";
import { getElementOnceAvailable } from "./utils";

const sidebarListItemClass = 'MuiListItem-button'; //? the class on each sidebar button
const sidebarListItemActiveClass = 'css-ljlede-listitem-active';

export const sidebar = await getElementOnceAvailable('/html/body/div[1]/div[2]/div[1]/div/ul', 100, 100);
export const sidebardButtonList = (sidebar as HTMLElement).getElementsByClassName(sidebarListItemClass);

export function getActiveSidebarElement() {
	for (let i = 0; i < sidebardButtonList.length; i++) {
		const button = sidebardButtonList[i];
		if (button.classList.contains(sidebarListItemActiveClass)) {
			return button;
		}
	}
}
export function getActivePage(): Pages {
	const activeText = getActiveSidebarElement()?.textContent?.replaceAll(' ', '_');
	return Pages[(activeText as keyof Pages ?? 0)];
}