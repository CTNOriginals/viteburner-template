import { NS } from "@ns";
import { GoNode, NodeState } from "./data";
import { getBaordMatrix, getPlaceableNodes, NodeNeighborhood } from "./utils";

const threeByThreePatterns = [
	// 3x3 piece patterns; X,O are color pieces; x,o are any state except the opposite color piece;
	// " " is off the edge of the board; "?" is any state (even off the board)
	[
		"XOX", // hane pattern - enclosing hane
		"...",
		"???",
	],
	[
		"XO.", // hane pattern - non-cutting hane
		"...",
		"?.?",
	],
	[
		"XO?", // hane pattern - magari
		"X..",
		"o.?",
	],
	[
		".O.", // generic pattern - katatsuke or diagonal attachment; similar to magari
		"X..",
		"...",
	],
	[
		"XO?", // cut1 pattern (kiri] - unprotected cut
		"O.x",
		"?x?",
	],
	[
		"XO?", // cut1 pattern (kiri] - peeped cut
		"O.X",
		"???",
	],
	[
		"?X?", // cut2 pattern (de]
		"O.O",
		"xxx",
	],
	[
		"OX?", // cut keima
		"x.O",
		"???",
	],
	[
		"X.?", // side pattern - chase
		"O.?",
		"   ",
	],
	[
		"OX?", // side pattern - block side cut
		"X.O",
		"   ",
	],
	[
		"?X?", // side pattern - block side connection
		"o.O",
		"   ",
	],
	[
		"?XO", // side pattern - sagari
		"o.o",
		"   ",
	],
	[
		"?OX", // side pattern - cut
		"X.O",
		"   ",
	],
];


interface PatternMatch {
	node: GoNode;
	neighborhood: NodeNeighborhood;
	pattern: string[];
}
export function findMatchingPatterns(ns: NS, player: (NodeState.Black|NodeState.White)): PatternMatch[] {
	const board = getBaordMatrix(ns);
	const boardSize = board[0].length;
	const patterns = expandAllThreeByThreePatterns();
	const spaces = getPlaceableNodes(ns);
	
	const matches: PatternMatch[] = [];

	for (let x = 0; x < boardSize; x++) {
		for (let y = 0; y < boardSize; y++) {
			const node = {x: x, y: y};
			const neighborhood = new NodeNeighborhood(ns, node)
			const matchedPattern = patterns.find((pattern) => checkMatch(neighborhood.asArray, pattern, player));

			if (
				matchedPattern &&
				spaces.find((availablePoint) => availablePoint.x === x && availablePoint.y === y)
				// (!smart || findEffectiveLibertiesOfNewMove(board, x, y, player).length > 1)
			) {
				matches.push({
					node: node,
					neighborhood: neighborhood,
					pattern: matchedPattern
				});
			}
		}
	}

	return matches;
}

/** Returns false if any point does not match the pattern, and true if it matches fully. */
function checkMatch(neighborhood: NodeNeighborhood['asArray'], pattern: string[], player: NodeState) {
	const patternArr = pattern.join("").split("");
	const neighborhoodArray = neighborhood.flat();
	return patternArr.every((str, index) => matches(str, neighborhoodArray[index], player));
}

/**
 * @returns true if the given point matches the given string representation, false otherwise
 *
 * Capital X and O only match stones of that color
 * lowercase x and o match stones of that color, or empty space, or the edge of the board
 * a period "." only matches empty nodes
 * A space " " only matches the edge of the board
 * question mark "?" matches anything
 */
function matches(symbol: string, state: NodeState, player: NodeState) {
	const opponent = player === NodeState.White ? NodeState.Black : NodeState.White;
	switch (symbol) {
		case "X": return state === player;
		case "O": return state === opponent;
		case "x": return state !== opponent;
		case "o": return state !== player;
		case ".": return state === NodeState.Empty;
		case " ":return state === NodeState.Void || NodeState.Static;
		case "?": default: return true;
	}
}

/**
 * Finds all variations of the pattern list, by expanding it using rotation and mirroring
 */
function expandAllThreeByThreePatterns() {
	const rotatedPatterns = [
		...threeByThreePatterns,
		...threeByThreePatterns.map(rotate90Degrees),
		...threeByThreePatterns.map(rotate90Degrees).map(rotate90Degrees),
		...threeByThreePatterns.map(rotate90Degrees).map(rotate90Degrees).map(rotate90Degrees),
	];
	const mirroredPatterns = [...rotatedPatterns, ...rotatedPatterns.map(verticalMirror)];
	return [...mirroredPatterns, ...mirroredPatterns.map(horizontalMirror)];
}

function rotate90Degrees(pattern: string[]) {
	return [
		`${pattern[2][0]}${pattern[1][0]}${pattern[0][0]}`,
		`${pattern[2][1]}${pattern[1][1]}${pattern[0][1]}`,
		`${pattern[2][2]}${pattern[1][2]}${pattern[0][2]}`,
	];
}

function verticalMirror(pattern: string[]) {
	return [pattern[2], pattern[1], pattern[0]];
}

function horizontalMirror(pattern: string[]) {
	return [
		pattern[0].split("").reverse().join(),
		pattern[1].split("").reverse().join(),
		pattern[2].split("").reverse().join(),
	];
}