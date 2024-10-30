import { NS } from "@ns";
import { GoNode, NodeState } from "./data";


export class NodeNeighborhood {
	public c: NodeState = NodeState.Void; //? Center

	public n: NodeState = NodeState.Void; public ne: NodeState = NodeState.Void;
	public e: NodeState = NodeState.Void; public se: NodeState = NodeState.Void;
	public s: NodeState = NodeState.Void; public sw: NodeState = NodeState.Void;
	public w: NodeState = NodeState.Void; public nw: NodeState = NodeState.Void;

	constructor(ns: NS, node: GoNode) {
		this.c = getNodeState(ns, {x: node.x, y: node.y - 1})

		this.n = getNodeState(ns, {x: node.x, y: node.y - 1})
		this.s = getNodeState(ns, {x: node.x, y: node.y + 1})
		this.e = getNodeState(ns, {x: node.x + 1, y: node.y})
		this.w = getNodeState(ns, {x: node.x - 1, y: node.y})

		this.ne = getNodeState(ns, {x: node.x + 1, y: node.y - 1})
		this.se = getNodeState(ns, {x: node.x + 1, y: node.y + 1})
		this.sw = getNodeState(ns, {x: node.x - 1, y: node.y + 1})
		this.nw = getNodeState(ns, {x: node.x - 1, y: node.y - 1})
	}


	public toString(): string {
		return [
			`${nodeStateToNodeSymbol(this.nw)}${nodeStateToNodeSymbol(this.n)}${nodeStateToNodeSymbol(this.ne)}`,
			`${nodeStateToNodeSymbol(this.w)}${nodeStateToNodeSymbol(this.c)}${nodeStateToNodeSymbol(this.e)}`,
			`${nodeStateToNodeSymbol(this.sw)}${nodeStateToNodeSymbol(this.s)}${nodeStateToNodeSymbol(this.se)}`,
		].join('\n')
	}

	public get asArray() {
		return [
			this.nw, this.n, this.ne,
			this.w, this.c, this.e,
			this.sw, this.s, this.se,
		]
	}

	public get hash(): string {
		let out = '';
		for (const field in this) {
			out += nodeStateToNodeSymbol(this[field] as NodeState);
		}
		return out;
	}

	
}

export function getNodeState(ns: NS, node: GoNode): NodeState {
	const board = ns.go.getBoardState();

	if ((node.y < 0 || node.y > board.length - 1) || (node.x < 0 || node.x > board[0].split('').length - 1)) {
		return NodeState.Void;
	}

	const nodeContent = board[node.y].split('')[node.x];
	switch (nodeContent) {
		case '.': return NodeState.Empty;
		case '#': return NodeState.Static;
		case 'X': return NodeState.Black;
		case 'O': return NodeState.White;
		default: break;
	}

	return NodeState.Void;
}


export function getBaordMatrix(ns: NS): NodeState[][] {
	const boardMatrix: NodeState[][] = [];
	const board = ns.go.getBoardState()
	
	for (let y = 0; y < board.length; y++) {
		boardMatrix.push([]);
		const row = board[y].split('');
		for (let x = 0; x < row.length; x++) {
			boardMatrix[y][x] = getNodeState(ns, {x: x, y: y})
		}
	}

	return boardMatrix;
}

export function nodeSymbolToState(symbol: string): NodeState {
	switch(symbol) {
		case 'X': return NodeState.Black;
		case 'O': return NodeState.White;
		case '.': return NodeState.Empty;
		case '#': return NodeState.Static;
		case '-': default: return NodeState.Void;
	}
}

export function nodeStateToNodeSymbol(state: NodeState) {
	switch(state) {
		case NodeState.Black: return 'X';
		case NodeState.White: return 'O';
		case NodeState.Empty: return '.';
		case NodeState.Static: return '#';
		case NodeState.Void: return '-';
	}
}

export function hashToValue(hash: string) {
	let value = '';
	for (const char of hash) {
		value += Object.keys(NodeState).indexOf(nodeSymbolToState(char)).toString();
	}
	return parseInt(value);
}

export function getPlaceableNodes(ns: NS): GoNode[] {
	let out: GoNode[] = [];
	const validSpaces = ns.go.analysis.getValidMoves();

	for (let x = 0; x < validSpaces[0].length; x++) {
		for (let y = 0; y < validSpaces[0].length; y++) {
			if (validSpaces[x][y]) {
				out.push({x: x, y: y});
			}
		}
	}

	return out;
}