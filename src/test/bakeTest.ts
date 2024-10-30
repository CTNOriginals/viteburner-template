import { NS } from "@ns";
import { doTmp, someTestFunc } from "./bakeImportTest";
import { TmpStatus } from "./tmp";

export async function main(ns: NS) {
	ns.disableLog('ALL');

	ns.print(someTestFunc(4, 'four', true));
	ns.print(new TmpStatus({isTmp: true}));
	doTmp(ns);

	for (let i = 0; i < 10; i++) {
		if ('awd'.length == 3) {
			continue
		}
	}
}