// Basic Strategy Lookup Tables
// Based on standard single/multi-deck basic strategy charts
// Dealer stands on soft 17

export type StrategyAction = 'H' | 'S' | 'D' | 'P'; // Hit, Stand, Double, sPlit

// Dealer upcard index: 2=0, 3=1, ..., 9=7, 10=8, A=9
function dealerIndex(upcard: number): number {
	if (upcard === 11 || upcard === 1) return 9; // Ace
	return upcard - 2;
}

// Hard totals: player total 5-21 vs dealer 2-A
// Format: hardStrategy[playerTotal - 5][dealerIndex]
const hardStrategy: StrategyAction[][] = [
	// 5:  always hit
	['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
	// 6:  always hit
	['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
	// 7:  always hit
	['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
	// 8:  always hit
	['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
	// 9:  double vs 3-6, else hit
	['H', 'D', 'D', 'D', 'D', 'H', 'H', 'H', 'H', 'H'],
	// 10: double vs 2-9, else hit
	['D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'H', 'H'],
	// 11: double vs 2-10, hit vs A
	['D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'H'],
	// 12: stand vs 4-6, else hit
	['H', 'H', 'S', 'S', 'S', 'H', 'H', 'H', 'H', 'H'],
	// 13: stand vs 2-6, else hit
	['S', 'S', 'S', 'S', 'S', 'H', 'H', 'H', 'H', 'H'],
	// 14: stand vs 2-6, else hit
	['S', 'S', 'S', 'S', 'S', 'H', 'H', 'H', 'H', 'H'],
	// 15: stand vs 2-6, else hit
	['S', 'S', 'S', 'S', 'S', 'H', 'H', 'H', 'H', 'H'],
	// 16: stand vs 2-6, else hit
	['S', 'S', 'S', 'S', 'S', 'H', 'H', 'H', 'H', 'H'],
	// 17+: always stand
	['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
	// 18
	['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
	// 19
	['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
	// 20
	['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
	// 21
	['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
];

// Soft totals: A+2 (13) through A+9 (20) vs dealer 2-A
// softStrategy[acePartner - 2][dealerIndex] where acePartner is the non-ace card value
const softStrategy: StrategyAction[][] = [
	// A,2 (soft 13): double vs 5-6, else hit
	['H', 'H', 'H', 'D', 'D', 'H', 'H', 'H', 'H', 'H'],
	// A,3 (soft 14): double vs 5-6, else hit
	['H', 'H', 'H', 'D', 'D', 'H', 'H', 'H', 'H', 'H'],
	// A,4 (soft 15): double vs 4-6, else hit
	['H', 'H', 'D', 'D', 'D', 'H', 'H', 'H', 'H', 'H'],
	// A,5 (soft 16): double vs 4-6, else hit
	['H', 'H', 'D', 'D', 'D', 'H', 'H', 'H', 'H', 'H'],
	// A,6 (soft 17): double vs 3-6, else hit
	['H', 'D', 'D', 'D', 'D', 'H', 'H', 'H', 'H', 'H'],
	// A,7 (soft 18): stand vs 2,7,8; double vs 3-6; hit vs 9,10,A
	['S', 'D', 'D', 'D', 'D', 'S', 'S', 'H', 'H', 'H'],
	// A,8 (soft 19): always stand
	['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
	// A,9 (soft 20): always stand
	['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
];

// Pair splitting: pair value vs dealer 2-A
// pairStrategy[pairCard - 2][dealerIndex] for 2-2 through 10-10
// Index 9 = A-A
const pairStrategy: StrategyAction[][] = [
	// 2,2: split vs 2-7, else hit
	['P', 'P', 'P', 'P', 'P', 'P', 'H', 'H', 'H', 'H'],
	// 3,3: split vs 2-7, else hit
	['P', 'P', 'P', 'P', 'P', 'P', 'H', 'H', 'H', 'H'],
	// 4,4: hit (split vs 5-6 in some variants)
	['H', 'H', 'H', 'P', 'P', 'H', 'H', 'H', 'H', 'H'],
	// 5,5: double vs 2-9, else hit (never split)
	['D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'H', 'H'],
	// 6,6: split vs 2-6, else hit
	['P', 'P', 'P', 'P', 'P', 'H', 'H', 'H', 'H', 'H'],
	// 7,7: split vs 2-7, else hit
	['P', 'P', 'P', 'P', 'P', 'P', 'H', 'H', 'H', 'H'],
	// 8,8: always split
	['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
	// 9,9: split vs 2-9 except 7, stand vs 7/10/A
	['P', 'P', 'P', 'P', 'P', 'S', 'P', 'P', 'S', 'S'],
	// 10,10: always stand (never split)
	['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
	// A,A: always split
	['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
];

export interface StrategyResult {
	action: StrategyAction;
	handType: 'hard' | 'soft' | 'pair';
	playerTotal: number;
}

export function getOptimalAction(
	playerCards: { rank: string; value: number }[],
	dealerUpcard: { rank: string; value: number }
): StrategyResult {
	const dIdx = dealerIndex(dealerUpcard.value);

	// Check for pair
	if (playerCards.length === 2 && playerCards[0].value === playerCards[1].value) {
		const pairVal = playerCards[0].value;
		let pairIdx: number;
		if (pairVal === 11) {
			// Aces
			pairIdx = 9;
		} else {
			pairIdx = pairVal - 2;
		}
		if (pairIdx >= 0 && pairIdx < pairStrategy.length) {
			const action = pairStrategy[pairIdx][dIdx];
			if (action === 'P') {
				return {
					action,
					handType: 'pair',
					playerTotal: pairVal * 2 === 22 ? 12 : pairVal * 2
				};
			}
			// If not splitting, fall through to soft/hard
		}
	}

	// Check for soft hand (has an ace counted as 11)
	const hasAce = playerCards.some((c) => c.rank === 'A');
	let total = 0;
	let aces = 0;
	for (const c of playerCards) {
		if (c.rank === 'A') {
			aces++;
			total += 11;
		} else {
			total += c.value;
		}
	}
	while (total > 21 && aces > 0) {
		total -= 10;
		aces--;
	}

	const isSoft = hasAce && aces > 0 && total <= 21;

	if (isSoft && playerCards.length === 2) {
		// Get the non-ace card value
		const nonAceCard = playerCards.find((c) => c.rank !== 'A');
		const acePartner = nonAceCard ? nonAceCard.value : 1;
		const softIdx = acePartner - 2;
		if (softIdx >= 0 && softIdx < softStrategy.length) {
			return {
				action: softStrategy[softIdx][dIdx],
				handType: 'soft',
				playerTotal: total
			};
		}
	}

	// Hard total
	if (total < 5) total = 5;
	if (total > 21) total = 21;
	const hardIdx = total - 5;
	if (hardIdx >= 0 && hardIdx < hardStrategy.length) {
		return {
			action: hardStrategy[hardIdx][dIdx],
			handType: 'hard',
			playerTotal: total
		};
	}

	return { action: 'S', handType: 'hard', playerTotal: total };
}

// Export tables for the strategy chart display
export const HARD_TABLE = hardStrategy;
export const SOFT_TABLE = softStrategy;
export const PAIR_TABLE = pairStrategy;

export function actionLabel(action: StrategyAction): string {
	switch (action) {
		case 'H':
			return 'Hit';
		case 'S':
			return 'Stand';
		case 'D':
			return 'Double';
		case 'P':
			return 'Split';
	}
}

export function actionColor(action: StrategyAction): string {
	switch (action) {
		case 'H':
			return 'bg-red-600';
		case 'S':
			return 'bg-green-600';
		case 'D':
			return 'bg-blue-600';
		case 'P':
			return 'bg-yellow-600';
	}
}
