import { GoOpponent, NS } from "@ns";
import { GoNode, GoPlayer, NodeState } from "../data";
import { getBaordMatrix, hashToValue, nodeSymbolToState } from "../utils";
import { preview } from "vite";
import { bprint } from "@/handlers/printHandler";

export interface PreferredNadeData {
	node: GoNode,
	hash: string,
}
export class AIBase<TMemory> {
	public memoryFile: string;
	public memory: TMemory;

	private gameCount = 0;

	constructor(public ns: NS, public id: number, private name: string, public color: GoPlayer) {
		this.memoryFile = `ipvgo/ai/memory/${this.name}/${this.id}.json`;
		if (ns.fileExists(this.memoryFile)) {
			const content = ns.read(this.memoryFile);
			try {
				console.log(`Reading memory: ${this.memoryFile}`);
				this.memory = JSON.parse(content);
				console.log(this.memory);
			} catch (e) {
				console.log(e);
				this.ns.toast((e as ErrorEvent).message, 'error')
				this.ns.write(`ipvgo/ai/memory/${this.name}/${this.id}.ERROR.json`, this.ns.read(this.memoryFile))
				this.ns.write(this.memoryFile, `{\n\t\n}`, 'w');
				this.memory = {} as TMemory;
			}
		}
		else {
			console.log(`Creating new memory file: ${this.memoryFile}`);
			ns.write(`${this.memoryFile}`, `{\n\t\n}`, 'w');
			this.memory = {} as TMemory;
		}
	}

	public Init() {
		this.Update();
	}
	public async Update() {}

	public getPreferredNode(boardMatrix: NodeState[][]): PreferredNadeData {
		return {
			node: {x:-1,y:-1}, //? pass by default
			hash: '-'.repeat(8)
		} 
	}

	
	public sortMemory() {
		this.memory = Object.keys(this.memory as {})
		.sort((a, b) => hashToValue(a) - hashToValue(b))
		.reduce((accumulator, current) => {
			accumulator[current] = this.memory[current];
			return accumulator;
		}, {}) as TMemory;
	}
	public memorize() {
		if (Object.keys(this.memory as TMemory as {}).length > 0) {
			this.sortMemory();
			this.ns.write(this.memoryFile, JSON.stringify(this.memory).replaceAll('},', '},\n'), 'w');
		}
	}

	public gameOver() {
		this.gameCount++;
		const opp = this.ns.go.getOpponent();
		const gameState = this.ns.go.getGameState();
		const baord = this.ns.go.getBoardState();
		let teamNodes = [0,0]
		baord.forEach((y) => {
			teamNodes[0] += y.split('X').length
			teamNodes[1] += y.split('O').length
		})

		bprint(this.ns, this.gameCount + '\n', [
			`Score: ${gameState.blackScore}/${gameState.whiteScore} (${gameState.blackScore - gameState.whiteScore})`,
			`Nodes: ${teamNodes[0]}/${teamNodes[1]} (${teamNodes[0] - teamNodes[1]})`,
			// Nodes: this.ns.go.analysis
		].join('\n ') + '\n')

		this.memorize();
		this.ns.go.resetBoardState(
			opp as GoOpponent,
			this.ns.go.getBoardState().length as 5|7|9|13
		)
	}

	
	public onExit() {
		this.memorize();
	}
}
