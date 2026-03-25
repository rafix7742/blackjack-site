// Game of Six Engine
// Correct rules (from Zimran, Klis, Fuster & Rivelli):
// - Deck: 6 cards total — three 1s and three 3s
// - Cards are dealt WITHOUT replacement from this shared deck
// - Each player is initially dealt two cards face-down
// - Players alternate: Hit (draw another card) or Stay (keep hand)
// - Target: 6. If hand > 6, the player busts (automatic loss)
// - Closest to 6 without busting wins
// - Payoffs: win = +x, lose = -x, tie = 0
// - This mirrors Blackjack's structure: without-replacement dealing
//   means the composition of remaining cards changes, which is
//   the core insight that motivates card counting

export type Action = 'hit' | 'stay';
export type CardValue = 1 | 3;

export interface SixGameState {
	deck: CardValue[];           // remaining cards in the deck
	playerCards: CardValue[];    // cards the player has been dealt
	aiCards: CardValue[];        // cards the AI has been dealt
	playerHand: number;          // sum of player's cards
	aiHand: number;              // sum of AI's cards
	playerStayed: boolean;
	aiStayed: boolean;
	playerBusted: boolean;
	aiBusted: boolean;
	phase: 'playerTurn' | 'aiTurn' | 'gameOver';
	lastCardDrawn: CardValue | null;
	result: 'playerWin' | 'aiWin' | 'tie' | null;
	message: string;
	history: string[];           // log of actions for display
}

// Create the initial 6-card deck
function createDeck(): CardValue[] {
	return [1, 1, 1, 3, 3, 3];
}

// Shuffle using Fisher-Yates
function shuffle(deck: CardValue[]): CardValue[] {
	const arr = [...deck];
	for (let i = arr.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[arr[i], arr[j]] = [arr[j], arr[i]];
	}
	return arr;
}

// Draw a card from the deck (without replacement)
function drawFromDeck(deck: CardValue[]): { card: CardValue; remaining: CardValue[] } {
	const remaining = [...deck];
	const card = remaining.shift()!;
	return { card, remaining };
}

// Compute probability of drawing a 1 vs a 3 from the remaining deck
export function getDeckProbabilities(deck: CardValue[]): { prob1: number; prob3: number; ones: number; threes: number } {
	const ones = deck.filter(c => c === 1).length;
	const threes = deck.filter(c => c === 3).length;
	const total = deck.length;
	return {
		prob1: total > 0 ? ones / total : 0,
		prob3: total > 0 ? threes / total : 0,
		ones,
		threes
	};
}

// ============================================================
// Minimax AI with deck-composition awareness
// ============================================================

// AI decides optimally given the remaining deck composition
function computeOptimalAI(
	aiHand: number,
	playerHand: number,
	playerStayed: boolean,
	playerBusted: boolean,
	deck: CardValue[]
): { ev: number; action: Action } {
	if (aiHand > 6) return { ev: -1, action: 'stay' };
	if (playerBusted) return { ev: 1, action: 'stay' };
	if (deck.length === 0) {
		// No cards left, must stay
		const val = aiHand > playerHand ? 1 : aiHand === playerHand ? 0 : -1;
		return { ev: val, action: 'stay' };
	}

	const stayValue = playerStayed
		? (aiHand > playerHand ? 1 : aiHand === playerHand ? 0 : -1)
		: -computeOptimalPlayerEV(playerHand, aiHand, deck);

	// Compute hit EV: weighted average over possible draws from deck
	const { prob1, prob3 } = getDeckProbabilities(deck);
	let hitEV = 0;

	if (prob1 > 0) {
		const deckAfter1 = removeOneCard(deck, 1);
		const result1 = computeOptimalAI(aiHand + 1, playerHand, playerStayed, playerBusted, deckAfter1);
		hitEV += prob1 * result1.ev;
	}
	if (prob3 > 0) {
		const deckAfter3 = removeOneCard(deck, 3);
		const result3 = computeOptimalAI(aiHand + 3, playerHand, playerStayed, playerBusted, deckAfter3);
		hitEV += prob3 * result3.ev;
	}

	if (hitEV > stayValue) {
		return { ev: hitEV, action: 'hit' };
	}
	return { ev: stayValue, action: 'stay' };
}

// Compute player's optimal EV when AI has already stayed
function computeOptimalPlayerEV(playerHand: number, aiHand: number, deck: CardValue[]): number {
	if (playerHand > 6) return -1;
	if (deck.length === 0) {
		return playerHand > aiHand ? 1 : playerHand === aiHand ? 0 : -1;
	}

	const stayValue = playerHand > aiHand ? 1 : playerHand === aiHand ? 0 : -1;

	const { prob1, prob3 } = getDeckProbabilities(deck);
	let hitEV = 0;

	if (prob1 > 0) {
		const d1 = removeOneCard(deck, 1);
		hitEV += prob1 * computeOptimalPlayerEV(playerHand + 1, aiHand, d1);
	}
	if (prob3 > 0) {
		const d3 = removeOneCard(deck, 3);
		hitEV += prob3 * computeOptimalPlayerEV(playerHand + 3, aiHand, d3);
	}

	return Math.max(stayValue, hitEV);
}

function removeOneCard(deck: CardValue[], value: CardValue): CardValue[] {
	const idx = deck.indexOf(value);
	if (idx === -1) return [...deck];
	const result = [...deck];
	result.splice(idx, 1);
	return result;
}

// ============================================================
// Public API
// ============================================================

export function getAIAction(state: SixGameState): Action {
	const result = computeOptimalAI(
		state.aiHand,
		state.playerHand,
		state.playerStayed,
		state.playerBusted,
		state.deck
	);
	return result.action;
}

export function createInitialState(): SixGameState {
	let deck = shuffle(createDeck());

	// Deal two cards to each player (like Blackjack)
	const { card: playerCard1, remaining: d1 } = drawFromDeck(deck);
	const { card: aiCard1, remaining: d2 } = drawFromDeck(d1);
	const { card: playerCard2, remaining: d3 } = drawFromDeck(d2);
	const { card: aiCard2, remaining: d4 } = drawFromDeck(d3);

	const playerHand = playerCard1 + playerCard2;
	const aiHand = aiCard1 + aiCard2;

	const probs = getDeckProbabilities(d4);

	return {
		deck: d4,
		playerCards: [playerCard1, playerCard2],
		aiCards: [aiCard1, aiCard2],
		playerHand,
		aiHand,
		playerStayed: false,
		aiStayed: false,
		playerBusted: false,
		aiBusted: false,
		phase: 'playerTurn',
		lastCardDrawn: null,
		result: null,
		message: `You were dealt ${playerCard1} and ${playerCard2}. Hand: ${playerHand}. Deck has ${d4.length} cards left (${probs.ones}×1, ${probs.threes}×3). Hit or Stay?`,
		history: [`Dealt: You got ${playerCard1}+${playerCard2} (=${playerHand}), AI shows ${aiCard1}+?`]
	};
}

export function playerAction(state: SixGameState, action: Action): SixGameState {
	const newState: SixGameState = {
		...state,
		deck: [...state.deck],
		playerCards: [...state.playerCards],
		aiCards: [...state.aiCards],
		history: [...state.history]
	};

	if (action === 'stay') {
		newState.playerStayed = true;
		newState.history.push(`You stayed with ${state.playerHand}.`);
		newState.message = `You stayed with ${state.playerHand}.`;
	} else {
		if (newState.deck.length === 0) {
			newState.playerStayed = true;
			newState.message = `No cards left in deck. You stay with ${state.playerHand}.`;
			newState.history.push(`No cards left. Forced stay at ${state.playerHand}.`);
		} else {
			const { card, remaining } = drawFromDeck(newState.deck);
			newState.deck = remaining;
			newState.lastCardDrawn = card;
			newState.playerCards.push(card);
			newState.playerHand = state.playerHand + card;

			const probs = getDeckProbabilities(newState.deck);

			if (newState.playerHand > 6) {
				newState.playerBusted = true;
				newState.history.push(`You drew a ${card}. Hand: ${newState.playerHand} — Bust!`);
				newState.message = `You drew a ${card}. Hand: ${newState.playerHand} — Bust!`;
			} else if (newState.playerHand === 6) {
				newState.playerStayed = true;
				newState.history.push(`You drew a ${card}. Hand: ${newState.playerHand} — Perfect 6!`);
				newState.message = `You drew a ${card}. Hand: ${newState.playerHand} — Perfect 6!`;
			} else {
				newState.history.push(`You drew a ${card}. Hand: ${newState.playerHand}.`);
				newState.message = `You drew a ${card}. Hand: ${newState.playerHand}. Deck: ${newState.deck.length} cards (${probs.ones}×1, ${probs.threes}×3). Hit or Stay?`;
				// Player can keep going
				return newState;
			}
		}
	}

	// Move to AI turn
	newState.phase = 'aiTurn';
	return newState;
}

export function aiTurn(state: SixGameState): SixGameState {
	let newState: SixGameState = {
		...state,
		deck: [...state.deck],
		playerCards: [...state.playerCards],
		aiCards: [...state.aiCards],
		history: [...state.history]
	};

	newState.history.push(`AI was dealt ${newState.aiCards[0]}+${newState.aiCards[1]} (=${newState.aiCards[0] + newState.aiCards[1]}). AI hand: ${newState.aiHand}.`);

	// AI plays until it stays or busts
	while (!newState.aiStayed && !newState.aiBusted) {
		if (newState.deck.length === 0) {
			newState.aiStayed = true;
			newState.history.push(`No cards left. AI stays at ${newState.aiHand}.`);
			break;
		}

		const action = getAIAction(newState);

		if (action === 'stay') {
			newState.aiStayed = true;
			newState.history.push(`AI stayed with ${newState.aiHand}.`);
		} else {
			const { card, remaining } = drawFromDeck(newState.deck);
			newState.deck = remaining;
			newState.aiCards.push(card);
			newState.aiHand += card;
			newState.history.push(`AI drew a ${card}. AI hand: ${newState.aiHand}.`);

			if (newState.aiHand > 6) {
				newState.aiBusted = true;
				newState.history.push(`AI busted! (${newState.aiHand})`);
			} else if (newState.aiHand === 6) {
				newState.aiStayed = true;
			}
		}
	}

	// Determine result
	newState.phase = 'gameOver';

	if (newState.playerBusted && newState.aiBusted) {
		newState.result = 'tie';
		newState.message = `Both busted — Tie! (You: ${newState.playerHand}, AI: ${newState.aiHand})`;
	} else if (newState.playerBusted) {
		newState.result = 'aiWin';
		newState.message = `You busted (${newState.playerHand}). AI wins with ${newState.aiHand}.`;
	} else if (newState.aiBusted) {
		newState.result = 'playerWin';
		newState.message = `AI busted (${newState.aiHand})! You win with ${newState.playerHand}.`;
	} else if (newState.playerHand > newState.aiHand) {
		newState.result = 'playerWin';
		newState.message = `You win! (${newState.playerHand} vs ${newState.aiHand})`;
	} else if (newState.aiHand > newState.playerHand) {
		newState.result = 'aiWin';
		newState.message = `AI wins! (${newState.aiHand} vs ${newState.playerHand})`;
	} else {
		newState.result = 'tie';
		newState.message = `Tie! (both ${newState.playerHand})`;
	}

	return newState;
}

// ============================================================
// Tree visualization
// ============================================================

export interface TreeNode {
	hand: number;
	label: string;
	children?: { card: CardValue; probability: string; node: TreeNode }[];
	action?: Action;
	payoff?: number;
}

export function generateGameTree(startHand: number, opponentHand: number, deck: CardValue[]): TreeNode {
	function buildTree(hand: number, d: CardValue[], depth: number): TreeNode {
		if (hand > 6) {
			return { hand, label: `${hand} (Bust)`, payoff: -1 };
		}
		if (hand === 6 || d.length === 0 || depth > 4) {
			const payoff = hand > opponentHand ? 1 : hand === opponentHand ? 0 : -1;
			return { hand, label: `${hand}`, payoff };
		}

		const stayPayoff = hand > opponentHand ? 1 : hand === opponentHand ? 0 : -1;
		const { prob1, prob3, ones, threes } = getDeckProbabilities(d);

		const children: { card: CardValue; probability: string; node: TreeNode }[] = [];
		let hitEV = 0;

		if (ones > 0) {
			const d1 = removeOneCard(d, 1);
			const node1 = buildTree(hand + 1, d1, depth + 1);
			children.push({ card: 1, probability: `${ones}/${d.length}`, node: node1 });
			hitEV += prob1 * (node1.payoff ?? 0);
		}
		if (threes > 0) {
			const d3 = removeOneCard(d, 3);
			const node3 = buildTree(hand + 3, d3, depth + 1);
			children.push({ card: 3, probability: `${threes}/${d.length}`, node: node3 });
			hitEV += prob3 * (node3.payoff ?? 0);
		}

		const optimal: Action = hitEV > stayPayoff ? 'hit' : 'stay';
		const ev = Math.max(stayPayoff, hitEV);

		return {
			hand,
			label: `${hand}`,
			action: optimal,
			payoff: ev,
			children
		};
	}

	return buildTree(startHand, deck, 0);
}
