import { AutocompleteData, GoOpponent, NS } from "@ns";
import { ArgumentBase, ArgumentValue } from "@/handlers/argumentHandler";
import { bprint } from "@/handlers/printHandler";
import { fakeNS } from "@/lib/generalData";
import { getBaordMatrix, getNodeState } from "./utils";
import { NeighborAI } from "./ai/neighborAI";
import { GoPlayer, NodeState } from "./data";
import { AIBase } from "./ai";
import { rng } from "@/utils";
import { findMatchingPatterns } from "./patterns";

class Arguments extends ArgumentBase {
	constructor(ns: ArgumentBase['ns']) { super(ns); this.parseArgs(); }
}

/** @param {NS} ns */
export async function main(ns: NS) {
	ns.disableLog('ALL');
	ns.atExit(onExit);
	const _args = new Arguments(ns);
	const args = _args.asValueObject;


	let prevState: string[] = []

	const black = new NeighborAI(ns, 2, NodeState.Black);
	const activeAIList: AIBase<any>[] = [black];

	black.Init();
	// white.Init();

	while (true) {
		// const patterns = findMatchingPatterns(ns, NodeState.Black);
		// if (patterns.length > 0) {
		// 	bprint(ns, patterns.map(p => p.pattern))
		// 	// for (const pattern of patterns) {
		// 	// 	bprint(ns, pattern.pattern)
		// 	// }
		// }
		// const currentState: string[] = ns.go.getBoardState();
		// const gameState = ns.go.getGameState();
		// if (currentState.join() != prevState.join()) {
		// 	bprint(ns, ns.go.getCurrentPlayer(), currentState, gameState.blackScore - gameState.whiteScore)
		// 	// const targetAI: AIBase<any>|undefined = activeAIList.find((ai) => ai.color === ns.go.getCurrentPlayer());

		// 	// if (targetAI) {
		// 	// 	const move = targetAI.getPreferredNode(getBaordMatrix(ns));
		// 	// 	if (move.x == -1 && move.y == -1) {
		// 	// 		await ns.go.passTurn();
		// 	// 	}
		// 	// 	else {
		// 	// 		await ns.go.makeMove(move.x, move.y);
		// 	// 	}
		// 	// }
			
		// 	prevState = currentState;
		// }
		await ns.asleep(1000)
	}

	function onExit() {
		for (const ai of activeAIList) {
			ai.onExit();
		}
	}
}



export function autocomplete(data: AutocompleteData, args: string[]) {
	const argsObj = new Arguments(fakeNS).asValueObject;
	const argsSchema: [string, string | number | boolean | string[]][] = [];
	for (const arg in argsObj) {
		argsSchema.push([arg, argsObj[arg as keyof typeof argsObj]]);
	}
	data.flags(argsSchema);
	return [];
}