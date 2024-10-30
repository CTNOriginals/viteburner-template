import { GoOpponent, NS } from "@ns";
import {  GoNode, GoPlayer, GoTurn, GoTurnAction, NodeBias, NodeState } from "../data";
import { AIBase, PreferredNadeData as PreferredNodeData } from ".";
import { getBaordMatrix, NodeNeighborhood } from "../utils";
import { clamp, rng } from "@/utils";
import { bprint } from "@/handlers/printHandler";

//= AI design doc
//_ Memory
	//> node coord (x,y)
	//> preferance value (0-1)
		//? how much the ai like to place a peace there if its available (highest value is the pos that will be picked each cycle)
	//> confidence value (0-1)
		//? how confident it is about its preference (repetative wins with this move will up this value)
//< 


type Memory = {[niaghbors: string]: NodeBias}
export class NeighborAI extends AIBase<Memory> {
	public biasMult: number = 0.01;
	public biasRange: number = 0.005; //? The range in which a bias is considered to be picked
	public confidenceMult: number = 0.001;
	public neutralMult: number = 0.0001;
	public rewardCycles: number = 10; //? the amount of cycles to still effect the hashes that were used before it
	
	constructor(ns: NS, id: number, color: GoPlayer) {
		super(ns, id, 'NeighborAI', color);
	}

	override getPreferredNode(boardMatrix: NodeState[][]): PreferredNodeData {
		//TODO include a range that the bias can be within
		let bestNodeList: GoNode[] = [];
		let bestBias: NodeBias = undefined!;
		const validMoves = this.ns.go.analysis.getValidMoves();
		
		for (let x = 0; x < boardMatrix.length; x++) {
			for (let y = 0; y < boardMatrix[x].length; y++) {
				const state = boardMatrix[x][y];
				if (state != NodeState.Empty || !validMoves[x][y]) { continue; }
				
				const node: GoNode = {x: x, y: y};
				const hash = new NodeNeighborhood(this.ns, node).hash;
				let neuron: NodeBias;
				
				if (!Object.keys(this.memory).includes(hash)) { //? Create a new hash field
					this.memory[hash] = new NodeBias();
				}
				neuron = this.memory[hash];

				if (!bestBias || neuron.bias > bestBias.bias) {
					bestBias = neuron;
					bestNodeList = [node];
				}
				else if (neuron.bias == bestBias.bias || (neuron.bias > (bestBias.bias - this.biasRange) && neuron.bias > (bestBias.bias + this.biasRange))) {
					bestNodeList.push(node)
				}
			}
		}

		if (bestNodeList.length == 0) {
			bestNodeList = [{x: -1, y: -1}] //? pass
		}

		const targetNode = bestNodeList[rng(0, bestNodeList.length - 1)];

		return {
			node: targetNode, //? pass by default
			hash:  new NodeNeighborhood(this.ns, targetNode).hash
		} 
	}

	override async Update(): Promise<void> {
		let usedHashes: string[] = [];
		let oppTurn: GoTurn = new GoTurn();

		while (true) {
			let gameState = this.ns.go.getGameState();
			const board = this.ns.go.getBoardState();

			if (gameState.currentPlayer === this.color) {
				const score = (state) => state.blackScore - state.whiteScore;
				
				const move = this.getPreferredNode(getBaordMatrix(this.ns));
				if (!Object.keys(this.memory).includes(move.hash)) {
					this.memory[move.hash] = new NodeBias();
				}
				
				const mem = this.memory[move.hash];
				let preMoveScore = score(gameState);

				let turn: GoTurn = new GoTurn();
				if (oppTurn.type == GoTurnAction.pass) {
					if (score(gameState) > gameState.komi) {
						turn.Set(await this.ns.go.passTurn());
						turn.type = GoTurnAction.gameOver;
					}
				}
				else if ((move.node.x == -1 && move.node.y == -1) || mem.bias < 0.25) { //! make something better for passing
					turn.Set(await this.ns.go.passTurn());
				}
				else {
					turn.Set(await this.ns.go.makeMove(move.node.x, move.node.y));
				}

				console.log(`AI: ${turn.type} | OPP: ${oppTurn.type}`)
				// console.log('opp', oppTurn)
				
				
				switch (turn.type) {
					case GoTurnAction.none: {
						turn.Set(await this.ns.go.passTurn());
					}; break;
					case GoTurnAction.move: {
						if (!usedHashes.includes(move.hash)) {
							usedHashes.push(move.hash);
						}
						
						gameState = this.ns.go.getGameState();
						const diff = (score(gameState)) - preMoveScore;
						//TODO add a bit of a bonus if the empty nodes owned went up after this placement
						const award = (diff == 0) ? this.neutralMult : diff * this.biasMult;
						
						//* confidence reversed so that a higher confidence means les change
						//* confidence multiplied by 2 so that the award is multiplied between a value of 0 and 2 because the default value is 0.5
						mem.bias = clamp(mem.bias + (award * ((1 - mem.confidence) * 2)), 0, 1);

						for (let i = 0; i < this.rewardCycles; i++) {
							if (i >= usedHashes.length) continue;
							const cycleHash = usedHashes[i];
							const cycleMem = this.memory[cycleHash];

							cycleMem.bias = clamp((cycleMem.bias + (award * ((1 - cycleMem.confidence) * 2)) / (i + 2 * 2)), 0, 1)
						}
					}; break;
					case GoTurnAction.gameOver: {
						gameState = this.ns.go.getGameState();
						const win: boolean = (score(gameState)) > 0

						//TODO also store all seen hashes and for each those to add a confidence to them for not picking them.
						for (const hash of usedHashes) {
							const confidence = (score(gameState)) * this.confidenceMult * ((this.memory[hash].bias < 0.5) ? -1 : 1);
							this.memory[hash].confidence += confidence
							this.memory[hash].confidence = clamp(this.memory[hash].confidence, 0, 1)
						}

						usedHashes = [];
						this.gameOver();
					}; break;
					default: break;
				}
			}
			else if (oppTurn.type == GoTurnAction.gameOver) {
				this.gameOver()
			}

			oppTurn.Set(await this.ns.go.opponentNextTurn());
			await this.ns.asleep(50); //? for safety
		}
	}
}