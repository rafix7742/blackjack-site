// Blackjack Engine
// Shared by basic strategy and card counting tabs

export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface Card {
	rank: Rank;
	suit: Suit;
	value: number; // 1-11 for ace, 2-10, 10 for face cards
	faceUp: boolean;
}

export type GamePhase = 'betting' | 'dealing' | 'playerTurn' | 'dealerTurn' | 'payout' | 'gameOver';
export type PlayerAction = 'hit' | 'stand' | 'double' | 'split';

export interface Hand {
	cards: Card[];
	bet: number;
	doubled: boolean;
	fromSplit: boolean;
	stood: boolean;
	busted: boolean;
}

export interface GameState {
	shoe: Card[];
	dealerHand: Card[];
	playerHands: Hand[];
	activeHandIndex: number;
	phase: GamePhase;
	balance: number;
	currentBet: number;
	message: string;
	cardsDealt: number;
	totalCards: number;
}

const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

function cardValue(rank: Rank): number {
	if (rank === 'A') return 11;
	if (['10', 'J', 'Q', 'K'].includes(rank)) return 10;
	return parseInt(rank);
}

function createDeck(): Card[] {
	const deck: Card[] = [];
	for (const suit of SUITS) {
		for (const rank of RANKS) {
			deck.push({ rank, suit, value: cardValue(rank), faceUp: true });
		}
	}
	return deck;
}

function shuffle(array: Card[]): Card[] {
	const arr = [...array];
	for (let i = arr.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[arr[i], arr[j]] = [arr[j], arr[i]];
	}
	return arr;
}

export function createShoe(numDecks: number): Card[] {
	let shoe: Card[] = [];
	for (let i = 0; i < numDecks; i++) {
		shoe = shoe.concat(createDeck());
	}
	return shuffle(shoe);
}

export function handTotal(cards: Card[]): number {
	let total = 0;
	let aces = 0;

	for (const card of cards) {
		if (!card.faceUp) continue;
		if (card.rank === 'A') {
			aces++;
			total += 11;
		} else {
			total += card.value;
		}
	}

	while (total > 21 && aces > 0) {
		total -= 10;
		aces--;
	}

	return total;
}

export function fullHandTotal(cards: Card[]): number {
	// Counts all cards regardless of faceUp
	let total = 0;
	let aces = 0;

	for (const card of cards) {
		if (card.rank === 'A') {
			aces++;
			total += 11;
		} else {
			total += card.value;
		}
	}

	while (total > 21 && aces > 0) {
		total -= 10;
		aces--;
	}

	return total;
}

export function isSoft(cards: Card[]): boolean {
	let total = 0;
	let aces = 0;

	for (const card of cards) {
		if (!card.faceUp) continue;
		if (card.rank === 'A') {
			aces++;
			total += 11;
		} else {
			total += card.value;
		}
	}

	// Soft if at least one ace is counted as 11 and total ≤ 21
	return aces > 0 && total <= 21;
}

export function isBlackjack(cards: Card[]): boolean {
	return cards.length === 2 && fullHandTotal(cards) === 21;
}

export function canSplit(hand: Hand): boolean {
	return (
		hand.cards.length === 2 &&
		!hand.fromSplit &&
		hand.cards[0].value === hand.cards[1].value
	);
}

export function canDouble(hand: Hand): boolean {
	return hand.cards.length === 2 && !hand.doubled;
}

export function createInitialGameState(numDecks: number = 1, startingBalance: number = 1000): GameState {
	const shoe = createShoe(numDecks);
	return {
		shoe,
		dealerHand: [],
		playerHands: [],
		activeHandIndex: 0,
		phase: 'betting',
		balance: startingBalance,
		currentBet: 10,
		message: 'Place your bet!',
		cardsDealt: 0,
		totalCards: shoe.length
	};
}

function dealCard(state: GameState, faceUp: boolean = true): { card: Card; state: GameState } {
	const shoe = [...state.shoe];
	const card = { ...shoe.pop()!, faceUp };
	return {
		card,
		state: { ...state, shoe, cardsDealt: state.cardsDealt + 1 }
	};
}

export function placeBet(state: GameState, amount: number): GameState {
	if (state.phase !== 'betting') return state;
	if (amount > state.balance) return { ...state, message: 'Not enough balance!' };

	let newState: GameState = {
		...state,
		currentBet: amount,
		balance: state.balance - amount,
		playerHands: [{ cards: [], bet: amount, doubled: false, fromSplit: false, stood: false, busted: false }],
		dealerHand: [],
		phase: 'dealing'
	};

	// Deal initial cards: player, dealer, player, dealer(facedown)
	let card: Card;
	({ card, state: newState } = dealCard(newState));
	newState.playerHands[0].cards.push(card);

	({ card, state: newState } = dealCard(newState));
	newState.dealerHand = [card];

	({ card, state: newState } = dealCard(newState));
	newState.playerHands[0].cards.push(card);

	({ card, state: newState } = dealCard(newState, false)); // dealer hole card face down
	newState.dealerHand.push(card);

	// Check for blackjacks
	const playerBJ = isBlackjack(newState.playerHands[0].cards);
	const dealerBJ = isBlackjack(newState.dealerHand);

	if (playerBJ || dealerBJ) {
		// Reveal dealer hole card
		newState.dealerHand = newState.dealerHand.map((c) => ({ ...c, faceUp: true }));

		if (playerBJ && dealerBJ) {
			newState.balance += amount; // push
			newState.message = 'Both Blackjack — Push!';
		} else if (playerBJ) {
			newState.balance += amount + Math.floor(amount * 1.5); // 3:2
			newState.message = 'Blackjack! You win 3:2!';
		} else {
			newState.message = 'Dealer Blackjack. You lose.';
		}
		newState.phase = 'gameOver';
		return newState;
	}

	newState.phase = 'playerTurn';
	newState.activeHandIndex = 0;
	newState.message = `Your hand: ${handTotal(newState.playerHands[0].cards)}. Hit, Stand, Double, or Split?`;

	return newState;
}

export function playerAction(state: GameState, action: PlayerAction): GameState {
	if (state.phase !== 'playerTurn') return state;

	let newState = { ...state };
	const handIdx = newState.activeHandIndex;
	let hands = newState.playerHands.map((h) => ({
		...h,
		cards: [...h.cards]
	}));
	let hand = hands[handIdx];

	switch (action) {
		case 'hit': {
			let card: Card;
			({ card, state: newState } = dealCard(newState));
			hand.cards.push(card);
			const total = handTotal(hand.cards);

			if (total > 21) {
				hand.busted = true;
				hand.stood = true;
				newState.message = `Bust! (${total})`;
			} else if (total === 21) {
				hand.stood = true;
				newState.message = `21!`;
			} else {
				newState.message = `Hand: ${total}. Hit or Stand?`;
			}
			break;
		}
		case 'stand': {
			hand.stood = true;
			newState.message = `You stand with ${handTotal(hand.cards)}.`;
			break;
		}
		case 'double': {
			if (!canDouble(hand)) {
				newState.message = 'Cannot double here.';
				break;
			}
			if (hand.bet > newState.balance) {
				newState.message = 'Not enough balance to double.';
				break;
			}
			newState.balance -= hand.bet;
			hand.bet *= 2;
			hand.doubled = true;

			let card: Card;
			({ card, state: newState } = dealCard(newState));
			hand.cards.push(card);

			const total = handTotal(hand.cards);
			if (total > 21) {
				hand.busted = true;
				newState.message = `Doubled and busted! (${total})`;
			} else {
				newState.message = `Doubled. Hand: ${total}.`;
			}
			hand.stood = true;
			break;
		}
		case 'split': {
			if (!canSplit(hand)) {
				newState.message = 'Cannot split here.';
				break;
			}
			if (hand.bet > newState.balance) {
				newState.message = 'Not enough balance to split.';
				break;
			}
			newState.balance -= hand.bet;

			const card1 = hand.cards[0];
			const card2 = hand.cards[1];

			// Deal one card to each new hand
			let newCard1: Card, newCard2: Card;
			({ card: newCard1, state: newState } = dealCard(newState));
			({ card: newCard2, state: newState } = dealCard(newState));

			hands[handIdx] = {
				cards: [card1, newCard1],
				bet: hand.bet,
				doubled: false,
				fromSplit: true,
				stood: false,
				busted: false
			};
			hands.splice(handIdx + 1, 0, {
				cards: [card2, newCard2],
				bet: hand.bet,
				doubled: false,
				fromSplit: true,
				stood: false,
				busted: false
			});

			hand = hands[handIdx];
			newState.message = `Split! Hand 1: ${handTotal(hand.cards)}.`;
			break;
		}
	}

	hands[handIdx] = hand;
	newState.playerHands = hands;

	// Check if current hand is done, move to next
	if (hand.stood || hand.busted) {
		const nextIdx = hands.findIndex((h, i) => i > handIdx && !h.stood && !h.busted);
		if (nextIdx !== -1) {
			newState.activeHandIndex = nextIdx;
			newState.message += ` Next hand: ${handTotal(hands[nextIdx].cards)}.`;
		} else {
			// All hands done, dealer's turn
			newState.phase = 'dealerTurn';
			newState = dealerPlay(newState);
		}
	}

	return newState;
}

function dealerPlay(state: GameState): GameState {
	let newState = { ...state };

	// Reveal hole card
	newState.dealerHand = newState.dealerHand.map((c) => ({ ...c, faceUp: true }));

	// Check if all player hands busted
	const allBusted = newState.playerHands.every((h) => h.busted);
	if (allBusted) {
		newState.phase = 'gameOver';
		newState.message = 'All hands busted. Dealer wins.';
		return newState;
	}

	// Dealer hits until 17+
	while (fullHandTotal(newState.dealerHand) < 17) {
		let card: Card;
		({ card, state: newState } = dealCard(newState));
		newState.dealerHand.push(card);
	}

	const dealerTotal = fullHandTotal(newState.dealerHand);
	const dealerBusted = dealerTotal > 21;

	// Resolve each hand
	let totalWinnings = 0;
	const messages: string[] = [];

	for (const hand of newState.playerHands) {
		if (hand.busted) {
			messages.push('Bust');
			continue;
		}

		const playerTotal = handTotal(hand.cards);

		if (dealerBusted) {
			totalWinnings += hand.bet * 2;
			messages.push(`Win (${playerTotal} vs Bust)`);
		} else if (playerTotal > dealerTotal) {
			totalWinnings += hand.bet * 2;
			messages.push(`Win (${playerTotal} vs ${dealerTotal})`);
		} else if (playerTotal === dealerTotal) {
			totalWinnings += hand.bet; // push
			messages.push(`Push (${playerTotal})`);
		} else {
			messages.push(`Lose (${playerTotal} vs ${dealerTotal})`);
		}
	}

	newState.balance += totalWinnings;
	newState.phase = 'gameOver';
	newState.message = `Dealer: ${dealerBusted ? 'Bust' : dealerTotal}. ${messages.join(' | ')}`;

	return newState;
}

export function newRound(state: GameState): GameState {
	// Check if shoe needs reshuffling (75% dealt)
	const reshuffleThreshold = state.totalCards * 0.75;
	let shoe = state.shoe;
	let cardsDealt = state.cardsDealt;
	const totalCards = state.totalCards;

	if (cardsDealt >= reshuffleThreshold || shoe.length < 10) {
		const numDecks = Math.round(totalCards / 52);
		shoe = createShoe(numDecks);
		cardsDealt = 0;
	}

	return {
		...state,
		shoe,
		dealerHand: [],
		playerHands: [],
		activeHandIndex: 0,
		phase: 'betting',
		currentBet: state.currentBet,
		message: 'Place your bet!',
		cardsDealt
	};
}

// Hi-Lo count value for a card
export function hiLoValue(card: Card): number {
	const v = card.value;
	if (v >= 2 && v <= 6) return 1; // But card.value for 2-6 is 2-6
	if (v >= 7 && v <= 9) return 0;
	return -1; // 10, J, Q, K, A (value 10 or 11)
}

export function hiLoValueFromRank(rank: Rank): number {
	const val = cardValue(rank);
	if (val >= 2 && val <= 6) return 1;
	if (val >= 7 && val <= 9) return 0;
	return -1;
}

// Get all visible (face-up) cards in the current state
export function getVisibleCards(state: GameState): Card[] {
	const cards: Card[] = [];
	for (const hand of state.playerHands) {
		for (const card of hand.cards) {
			if (card.faceUp) cards.push(card);
		}
	}
	for (const card of state.dealerHand) {
		if (card.faceUp) cards.push(card);
	}
	return cards;
}
