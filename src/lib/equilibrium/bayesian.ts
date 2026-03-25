// Bayesian Game Equilibrium Computation
// From Zimran, Klis, Fuster & Rivelli paper, Sections 4.1-4.3

export interface OneTypeParams {
	p: number; // Probability casino is vigilant
	a: number; // Payoff from card counting (undetected)
	b: number; // Payoff from standard strategy
	FL: number; // Fine/loss when caught (used in mixed strategy)
}

export interface TwoTypeParams extends OneTypeParams {
	w: number; // Probability player is high-skill
	aH: number; // High-skill counting payoff
	aL: number; // Low-skill counting payoff
	FH: number; // Fine for high-value counters
}

export type EquilibriumType = 'pure' | 'mixed' | 'none';

export interface OneTypeEquilibrium {
	type: EquilibriumType;
	threshold: number; // (a-b)/a
	// Pure strategy
	pureStrategy?: {
		player: 'Count' | 'Standard';
		vigilantCasino: 'Observe' | 'NotObserve';
		nonVigilantCasino: 'Observe' | 'NotObserve';
	};
	// Mixed strategy
	mixedStrategy?: {
		playerCountProb: number; // q = FL/a
		vigilantObserveProb: number; // r = (a-b)/(pa)
		nonVigilantObserveProb: number; // always 0
	};
	playerExpectedPayoff: number;
	description: string;
}

export interface TwoTypeEquilibrium {
	type: EquilibriumType;
	thresholdW: number; // FL/aH
	thresholdWUpper: number; // FH/aH
	pureStrategy?: {
		skilledPlayer: 'Count' | 'Standard';
		unskilledPlayer: 'Count' | 'Standard';
		vigilantCasino: 'Observe' | 'NotObserve';
		nonVigilantCasino: 'Observe' | 'NotObserve';
	};
	description: string;
	constraintsSatisfied: boolean;
	constraintMessages: string[];
}

export function computeOneTypeEquilibrium(params: OneTypeParams): OneTypeEquilibrium {
	const { p, a, b, FL } = params;

	if (a <= 0 || a <= b) {
		return {
			type: 'none',
			threshold: 0,
			playerExpectedPayoff: b,
			description: 'No card counting advantage (a ≤ b). Player uses standard strategy.'
		};
	}

	const threshold = (a - b) / a;

	if (p <= threshold) {
		// Pure strategy equilibrium: [C, (O, N)]
		// Player counts, vigilant casino observes, non-vigilant doesn't
		const expectedPayoff = a * (1 - p); // counting undetected by non-vigilant, caught by vigilant: a(1-p) + 0*p
		// Wait, let me reconsider. If equilibrium is [C, (O,N)]:
		// Player counts. Vigilant casino observes → payoff 0. Non-vigilant doesn't → payoff a.
		// Expected payoff = p*0 + (1-p)*a = a(1-p)
		return {
			type: 'pure',
			threshold,
			pureStrategy: {
				player: 'Count',
				vigilantCasino: 'Observe',
				nonVigilantCasino: 'NotObserve'
			},
			playerExpectedPayoff: a * (1 - p),
			description: `Pure strategy equilibrium: Player counts cards. Vigilant casino observes, non-vigilant does not. Condition: p ≤ ${threshold.toFixed(3)}.`
		};
	} else {
		// Mixed strategy equilibrium
		const q = FL / a; // player counts with this probability
		const r = (a - b) / (p * a); // vigilant casino observes with this probability

		// Player's expected payoff in mixed equilibrium = b (indifference condition)
		return {
			type: 'mixed',
			threshold,
			mixedStrategy: {
				playerCountProb: q,
				vigilantObserveProb: r,
				nonVigilantObserveProb: 0
			},
			playerExpectedPayoff: b,
			description: `Mixed strategy equilibrium: Player counts with probability q = ${q.toFixed(3)}. Vigilant casino observes with probability r = ${r.toFixed(3)}. Condition: p > ${threshold.toFixed(3)}.`
		};
	}
}

export function computeTwoTypeEquilibrium(params: TwoTypeParams): TwoTypeEquilibrium {
	const { w, aH, aL, b, FL, FH } = params;

	const constraintMessages: string[] = [];
	let constraintsSatisfied = true;

	// Check constraints from paper: aL < b < aH, aL < FL < FH, FL < aH < FH
	if (aL >= b) {
		constraintMessages.push(`Requires aL < b (${aL} < ${b})`);
		constraintsSatisfied = false;
	}
	if (b >= aH) {
		constraintMessages.push(`Requires b < aH (${b} < ${aH})`);
		constraintsSatisfied = false;
	}
	if (aL >= FL) {
		constraintMessages.push(`Requires aL < FL (${aL} < ${FL})`);
		constraintsSatisfied = false;
	}
	if (FL >= FH) {
		constraintMessages.push(`Requires FL < FH (${FL} < ${FH})`);
		constraintsSatisfied = false;
	}
	if (FL >= aH) {
		constraintMessages.push(`Requires FL < aH (${FL} < ${aH})`);
		constraintsSatisfied = false;
	}
	if (aH >= FH) {
		constraintMessages.push(`Requires aH < FH (${aH} < ${FH})`);
		constraintsSatisfied = false;
	}

	const thresholdW = FL / aH;
	const thresholdWUpper = FH / aH;

	if (!constraintsSatisfied) {
		return {
			type: 'none',
			thresholdW,
			thresholdWUpper,
			constraintsSatisfied: false,
			constraintMessages,
			description: 'Parameter constraints not satisfied. Adjust values.'
		};
	}

	if (w <= thresholdW) {
		// Pure strategy equilibrium: [(C,S), (N,N)]
		return {
			type: 'pure',
			thresholdW,
			thresholdWUpper,
			pureStrategy: {
				skilledPlayer: 'Count',
				unskilledPlayer: 'Standard',
				vigilantCasino: 'NotObserve',
				nonVigilantCasino: 'NotObserve'
			},
			constraintsSatisfied: true,
			constraintMessages: [],
			description: `Pure strategy equilibrium: Skilled player counts, unskilled plays standard. Both casino types do not observe. Condition: w ≤ FL/aH = ${thresholdW.toFixed(3)}.`
		};
	} else {
		return {
			type: 'mixed',
			thresholdW,
			thresholdWUpper,
			constraintsSatisfied: true,
			constraintMessages: [],
			description: `No pure strategy equilibrium exists (w > FL/aH = ${thresholdW.toFixed(3)}). Casino has incentive to observe, changing the equilibrium structure. A mixed strategy equilibrium may exist.`
		};
	}
}
