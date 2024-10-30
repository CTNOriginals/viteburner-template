export enum NodeState {
	Black = 	'Black',
	White = 	'White',
	Empty = 	'Empty', //? free to place anything
	Static = 	'Static', //? corrupt static, unplacable for both teams
	Void = 		'Void', //? outside of the map
}
export type GoPlayer = (NodeState.Black|NodeState.White)

export interface GoNode {
	x: number,
	y: number,
}

export enum GoTurnAction {
	none = 'none',
	move = 'move',
	pass = 'pass',
	gameOver = 'gameOver'
}

interface GoTurnInput {
	type: string;
    x: number | null;
    y: number | null;
}
export class GoTurn {
	public type: GoTurnAction = GoTurnAction.none;
    public x: number | null = null;
    public y: number | null = null;

	// public set type(value: string|GoTurnAction) {
	// 	if (typeof value == 'string') {
	// 		this._type = GoTurnAction[value as keyof GoTurnAction];
	// 		return;
	// 	}
	// 	this._type = value;
	// }
	// public get type(): GoTurnAction {
	// 	return this._type;
	// }

	public Set(input: GoTurnInput) {
		this.type = GoTurnAction[input.type];
		this.x = input.x;
		this.y = input.y;
	}
}

export class NodeBias {
	public bias: number = 0.5; //? how much the ai like to place a peace there if its available (highest value is the pos that will be picked each cycle)
	public confidence: number = 0.5; //? how confident it is about its preference (repetative wins with this move will up this value)
}

