import { NS } from "@ns";
import { bprint } from "@/handlers/printHandler";
import { formNum } from "@/utils/numberFormat";


interface ServerStatItem {
	current: number;
	target: number;
}
export class ServerStats {
	public money: ServerStatItem;
	public security: ServerStatItem;

	private hostName: string;

	constructor(ns: NS, hostName: string) {
		this.hostName = hostName;

		this.money = {
			current: ns.getServerMoneyAvailable(hostName),
			target: ns.getServerMaxMoney(hostName),
		};

		this.security = {
			current: ns.getServerSecurityLevel(hostName),
			target: ns.getServerMinSecurityLevel(hostName),
		}
	}

	public Update(ns: NS) {
		this.money.current = ns.getServerMoneyAvailable(this.hostName);
		this.security.current = ns.getServerSecurityLevel(this.hostName);
	}

	public get moneyStats(): string {
		return `${formNum(this.money.current)}/${formNum(this.money.target)}`
	}
	public get securityStats(): string {
		return `${formNum(this.security.current)}/${formNum(this.security.target)}`
	}
}

let target = 'n00dles';
export async function main(ns: NS) {
	ns.disableLog('ALL');
	target = ns.args[0] as string;

	const stats = new ServerStats(ns, target);
	let total = 0;
	let weakenEffect = 0;

	while (true) {
		if (stats.security.current - weakenEffect > stats.security.target) { //? Security is too high
			const res = await ns.weaken(target);
			weakenEffect = (res > 5) ? 5 : res;
			bprint(ns, `\n-- [fg=#be093f]Weaken[/>]: ${formNum(stats.security.current)} => ${formNum((stats.security.current - res))} (${formNum(res)})`);
		}
		else if (stats.money.current < stats.money.target) {
			const res = await ns.grow(target);
			bprint(ns, `\n-- [fg=#09be79]Grow[/>]: ${formNum((stats.money.current))} => ${formNum((stats.money.current * res))} (${formNum(res)})`);
		}
		else {
			const res = await ns.hack(target);
			bprint(ns, `\n-- [fg=#ffa500]Hack[/>]: ${formNum(res)}`);
			total += res;
		}

		stats.Update(ns);
		bprint(ns, [
			`[fg=#068051]Money[/>]: (${stats.moneyStats})`,
			`[fg=#80062b]Security[/>]: (${stats.securityStats})`,
			`[fg=#996300]Total[/>]: ${formNum(total)}`
		].join('\n'));
	}
}

// async function Timer(ns: NS, time: number) {
// 	let currentTime = time;
// 	while (true) {
// 		ns.setTitle(`BasicHack | ${target} | ${Math.round(currentTime / 1000)}s | PID:${ns.pid}`);
// 		currentTime -= 100;
// 		if (currentTime <= time) break;
// 		await ns.asleep(100);
// 	}
// }