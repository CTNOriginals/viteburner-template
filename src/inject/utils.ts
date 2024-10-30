// import { doc, win } from ".";
const win = eval('window') as Window;
const doc = eval('document') as Document;

export function getElementByXPath(path: string): Node | null {
	return doc.evaluate(path, doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
}

/** Get an HTML element by their XPath once it exists */
export async function getElementOnceAvailable(XPath: string, interval = 500, maxTries = 1000): Promise<HTMLElement|null> {
	let tryCount = 0;
	return new Promise((resolve) => {
		const intervalId = win.setInterval(() => {
			let element = getElementByXPath(XPath);
			if (element) {
				resolve(element as HTMLElement);
				win.clearInterval(intervalId);
			}
			if (maxTries > 0) {
				tryCount++;
				if (maxTries === tryCount) {
					resolve(null);
					win.clearInterval(intervalId);
					console.log(`Could not find the element by its XPAth after ${tryCount} tries\nXPath: ${XPath}`);
				}
			}
		}, interval);
	});
}