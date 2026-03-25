<script lang="ts">
	import {
		createInitialGameState,
		placeBet,
		playerAction as bjPlayerAction,
		newRound,
		handTotal,
		fullHandTotal,
		canSplit,
		canDouble,
		hiLoValueFromRank,
		type GameState,
		type PlayerAction,
		type Card
	} from '$lib/engines/blackjack';
	import { getOptimalAction, actionLabel } from '$lib/engines/basic-strategy';
	import Hand from '$lib/components/Hand.svelte';
	import CardComponent from '$lib/components/Card.svelte';

	let game = $state<GameState>(createInitialGameState(6, 1000));
	let runningCount = $state(0);
	let cardsSeenCount = $state(0);
	let showCount = $state(true);
	let handsPlayed = $state(0);
	let countHistory = $state<{ card: string; value: number; running: number }[]>([]);

	const numDecks = 6;
	const totalCardsInShoe = numDecks * 52;

	const decksRemaining = $derived(Math.max(1, Math.round((totalCardsInShoe - cardsSeenCount) / 52)));
	const trueCount = $derived(runningCount / decksRemaining);

	// Bet recommendation based on true count
	const recommendedBet = $derived.by(() => {
		if (trueCount <= 1) return 10;   // Minimum bet
		if (trueCount <= 2) return 20;
		if (trueCount <= 3) return 40;
		if (trueCount <= 4) return 80;
		return 100; // Max bet at high counts
	});

	const advantage = $derived.by(() => {
		// Approximate: each true count point ≈ 0.5% advantage shift
		// Base house edge ≈ -0.5% with basic strategy on 6 decks
		return (-0.5 + trueCount * 0.5);
	});

	// Track cards as they're revealed
	let prevVisibleCards = $state<string[]>([]);

	function cardKey(c: Card): string {
		return `${c.rank}-${c.suit}`;
	}

	function updateCount(newState: GameState) {
		const allVisible: Card[] = [];
		for (const hand of newState.playerHands) {
			for (const card of hand.cards) {
				if (card.faceUp) allVisible.push(card);
			}
		}
		for (const card of newState.dealerHand) {
			if (card.faceUp) allVisible.push(card);
		}

		const newKeys = allVisible.map(cardKey);
		// Find newly revealed cards
		for (const card of allVisible) {
			const key = cardKey(card);
			if (!prevVisibleCards.includes(key)) {
				const hlv = hiLoValueFromRank(card.rank);
				runningCount += hlv;
				cardsSeenCount++;
				countHistory = [
					...countHistory,
					{ card: `${card.rank}${suitSymbol(card.suit)}`, value: hlv, running: runningCount }
				];
			}
		}
		prevVisibleCards = newKeys;
	}

	function suitSymbol(suit: string): string {
		const m: Record<string, string> = { hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' };
		return m[suit] || '';
	}

	function handleBet(amount?: number) {
		const bet = amount ?? recommendedBet;
		const newState = placeBet(game, bet);
		updateCount(newState);
		game = newState;
	}

	function handleAction(action: PlayerAction) {
		const newState = bjPlayerAction(game, action);
		updateCount(newState);
		game = newState;
		if (game.phase === 'gameOver') {
			handsPlayed++;
			if (autoDeal) {
				setTimeout(() => {
					handleNextHand();
				}, 1500);
			}
		}
	}

	function handleNextHand() {
		const newState = newRound(game);
		// Check if shoe was reshuffled
		if (newState.cardsDealt === 0) {
			runningCount = 0;
			cardsSeenCount = 0;
			countHistory = [];
		}
		prevVisibleCards = [];
		game = newState;
		// Auto-bet with recommended amount
		handleBet();
	}

	function handleNewRound() {
		const newState = newRound(game);
		// Check if shoe was reshuffled
		if (newState.cardsDealt === 0) {
			runningCount = 0;
			cardsSeenCount = 0;
			countHistory = [];
		}
		prevVisibleCards = [];
		game = newState;
	}

	function handleReset() {
		game = createInitialGameState(6, 1000);
		runningCount = 0;
		cardsSeenCount = 0;
		handsPlayed = 0;
		countHistory = [];
		prevVisibleCards = [];
	}

	const activeHand = $derived(game.playerHands[game.activeHandIndex]);
	let showRules = $state(false);
	let autoDeal = $state(true);
	let showAdvisor = $state(false);

	import type { StrategyResult } from '$lib/engines/basic-strategy';

	let currentAdvice = $derived.by<StrategyResult | null>(() => {
		if (game.phase !== 'playerTurn') return null;
		const hand = game.playerHands[game.activeHandIndex];
		if (!hand || hand.cards.length === 0) return null;
		const dealerUpcard = game.dealerHand[0];
		if (!dealerUpcard) return null;
		return getOptimalAction(hand.cards, dealerUpcard);
	});
</script>

<div class="space-y-6">
	<div class="flex items-start justify-between gap-4">
		<div>
			<h1 class="text-3xl font-bold mb-2">Card Counting — Hi-Lo System</h1>
			<p class="text-[var(--text-secondary)]">
				6-deck shoe Blackjack with live Hi-Lo count tracking and bet sizing recommendations.
			</p>
		</div>
		<button
			onclick={() => (showRules = !showRules)}
			class="shrink-0 w-8 h-8 rounded-full border border-[var(--bg-tertiary)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-white hover:border-[var(--accent-blue)] transition-colors flex items-center justify-center text-sm font-serif italic"
			title="Rules"
		>i</button>
	</div>

	{#if showRules}
		<div class="bg-[var(--bg-secondary)] rounded-xl p-5 border border-[var(--bg-tertiary)]">
			<h3 class="font-semibold mb-3 text-sm uppercase tracking-wide text-[var(--text-secondary)]">Rules & How Counting Works</h3>
			<ul class="text-sm text-[var(--text-secondary)] space-y-1.5 list-disc list-inside">
				<li>Standard Blackjack rules with a <strong class="text-white">6-deck shoe</strong></li>
				<li>Cards dealt <strong class="text-white">without replacement</strong> — the shoe reshuffles at ~75% penetration</li>
				<li>Assign each card a value: <strong class="text-[var(--accent-green)]">2-6 = +1</strong>, <strong>7-9 = 0</strong>, <strong class="text-[var(--accent-red)]">10/J/Q/K/A = −1</strong></li>
				<li><strong class="text-white">Running Count</strong>: sum of all card values seen so far</li>
				<li><strong class="text-white">True Count</strong> = Running Count / Decks Remaining</li>
				<li>Positive true count means more high cards remain — favorable for the player</li>
				<li>Bet more when the true count is high, bet minimum when low or negative</li>
				<li>High cards favor the player because: more blackjacks (3:2 payout), better doubles, and the dealer busts more often</li>
			</ul>
		</div>
	{/if}

	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
		<!-- Game Area -->
		<div class="lg:col-span-2 space-y-4">
			<!-- Count Display -->
			{#if showCount}
				<div class="grid grid-cols-4 gap-3">
					<div class="bg-[var(--bg-secondary)] rounded-lg p-3 border border-[var(--bg-tertiary)] text-center">
						<div class="text-xs text-[var(--text-secondary)] uppercase">Running Count</div>
						<div class="text-2xl font-bold {runningCount > 0 ? 'text-[var(--accent-green)]' : runningCount < 0 ? 'text-[var(--accent-red)]' : ''}">
							{runningCount > 0 ? '+' : ''}{runningCount}
						</div>
					</div>
					<div class="bg-[var(--bg-secondary)] rounded-lg p-3 border border-[var(--bg-tertiary)] text-center">
						<div class="text-xs text-[var(--text-secondary)] uppercase">True Count</div>
						<div class="text-2xl font-bold {trueCount > 0 ? 'text-[var(--accent-green)]' : trueCount < 0 ? 'text-[var(--accent-red)]' : ''}">
							{trueCount > 0 ? '+' : ''}{trueCount.toFixed(1)}
						</div>
					</div>
					<div class="bg-[var(--bg-secondary)] rounded-lg p-3 border border-[var(--bg-tertiary)] text-center">
						<div class="text-xs text-[var(--text-secondary)] uppercase">Decks Left</div>
						<div class="text-2xl font-bold">{decksRemaining}</div>
					</div>
					<div class="bg-[var(--bg-secondary)] rounded-lg p-3 border border-[var(--bg-tertiary)] text-center">
						<div class="text-xs text-[var(--text-secondary)] uppercase">Edge</div>
						<div class="text-2xl font-bold {advantage > 0 ? 'text-[var(--accent-green)]' : 'text-[var(--accent-red)]'}">
							{advantage > 0 ? '+' : ''}{advantage.toFixed(1)}%
						</div>
					</div>
				</div>
			{/if}

			<!-- Table -->
			<div class="bg-[var(--bg-secondary)] rounded-xl p-6 border border-[var(--bg-tertiary)] min-h-[380px] flex flex-col">
				<!-- Dealer Hand -->
				<div class="mb-6 min-h-[70px]">
					{#if game.dealerHand.length > 0}
						<Hand cards={game.dealerHand} label="Dealer" />
					{:else}
						<div class="text-sm text-[var(--text-secondary)] uppercase tracking-wide text-center">Dealer</div>
					{/if}
				</div>

				<!-- Player Hands -->
				<div class="mb-6 min-h-[70px]">
					{#if game.playerHands.length > 0}
						<div class="space-y-4">
							{#each game.playerHands as hand, i}
								<div class="p-3 rounded-lg {i === game.activeHandIndex && game.phase === 'playerTurn' ? 'bg-[var(--bg-tertiary)]' : ''}">
									<Hand
										cards={hand.cards}
										label={game.playerHands.length > 1 ? `Hand ${i + 1}` : 'Player'}
									/>
									{#if hand.busted}
										<div class="text-center text-[var(--accent-red)] font-bold mt-1">BUST!</div>
									{/if}
								</div>
							{/each}
						</div>
					{:else}
						<div class="text-sm text-[var(--text-secondary)] uppercase tracking-wide text-center">Player</div>
					{/if}
				</div>

				<div class="mt-auto">
					<div class="text-center p-3 rounded-lg bg-[var(--bg-tertiary)] mb-4">
						<p class="text-sm">{game.message}</p>
					</div>

					<!-- Strategy Advice -->
					<div class="min-h-[40px] mb-4">
						{#if showAdvisor && currentAdvice && game.phase === 'playerTurn'}
							<div class="text-center p-2 rounded-lg bg-blue-900/30 border border-blue-700">
								<p class="text-sm">
									Optimal play: <strong class="text-[var(--accent-blue)]">{actionLabel(currentAdvice.action)}</strong>
									<span class="text-[var(--text-secondary)]">
										({currentAdvice.handType} {currentAdvice.playerTotal} vs dealer {game.dealerHand[0]?.rank})
									</span>
								</p>
							</div>
						{/if}
					</div>

				<!-- Controls -->
				<div class="flex justify-center gap-3 flex-wrap">
					{#if game.phase === 'betting'}
						<div class="flex items-center gap-3 flex-wrap justify-center">
							<span class="text-sm text-[var(--text-secondary)]">Recommended bet: <strong class="text-white">${recommendedBet}</strong></span>
							<button
								onclick={() => handleBet(10)}
								class="px-4 py-2 bg-[var(--bg-tertiary)] hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
							>
								$10
							</button>
							<button
								onclick={() => handleBet(25)}
								class="px-4 py-2 bg-[var(--bg-tertiary)] hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
							>
								$25
							</button>
							<button
								onclick={() => handleBet(50)}
								class="px-4 py-2 bg-[var(--bg-tertiary)] hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
							>
								$50
							</button>
							<button
								onclick={() => handleBet(100)}
								class="px-4 py-2 bg-[var(--bg-tertiary)] hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
							>
								$100
							</button>
							<button
								onclick={() => handleBet()}
								class="px-6 py-2 bg-[var(--accent-green)] hover:bg-green-500 text-white rounded-lg font-bold transition-colors"
							>
								Bet ${recommendedBet} (Optimal)
							</button>
						</div>
					{:else if game.phase === 'playerTurn'}
						<button
							onclick={() => handleAction('hit')}
							class="px-6 py-2 bg-[var(--accent-red)] hover:bg-red-500 text-white rounded-lg font-bold transition-colors"
						>Hit</button>
						<button
							onclick={() => handleAction('stand')}
							class="px-6 py-2 bg-[var(--accent-green)] hover:bg-green-500 text-white rounded-lg font-bold transition-colors"
						>Stand</button>
						{#if activeHand && canDouble(activeHand)}
							<button
								onclick={() => handleAction('double')}
								class="px-6 py-2 bg-[var(--accent-blue)] hover:bg-blue-500 text-white rounded-lg font-bold transition-colors"
							>Double</button>
						{/if}
						{#if activeHand && canSplit(activeHand)}
							<button
								onclick={() => handleAction('split')}
								class="px-6 py-2 bg-[var(--accent-yellow)] hover:bg-yellow-500 text-white rounded-lg font-bold transition-colors"
							>Split</button>
						{/if}
					{:else if game.phase === 'gameOver'}
						<button
							onclick={handleNextHand}
							class="px-6 py-2 bg-[var(--accent-blue)] hover:bg-blue-500 text-white rounded-lg font-bold transition-colors"
						>{autoDeal ? 'Deal Now' : 'Next Hand'}</button>
						<button
							onclick={handleReset}
							class="px-6 py-2 bg-[var(--bg-tertiary)] hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
						>Reset Shoe</button>
					{/if}
				</div>
				</div>
			</div>

			<!-- Stats -->
			<div class="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--bg-tertiary)] flex gap-6 items-center flex-wrap">
				<div class="text-sm">
					<span class="text-[var(--text-secondary)]">Balance:</span>
					<span class="font-bold text-[var(--accent-green)]">${game.balance}</span>
				</div>
				<div class="text-sm">
					<span class="text-[var(--text-secondary)]">Hands:</span>
					<span class="font-bold">{handsPlayed}</span>
				</div>
				<div class="text-sm">
					<span class="text-[var(--text-secondary)]">Cards Seen:</span>
					<span class="font-bold">{cardsSeenCount}/{totalCardsInShoe}</span>
				</div>
				<label class="text-sm flex items-center gap-2 cursor-pointer">
					<input type="checkbox" bind:checked={showCount} class="rounded" />
					Count
				</label>
				<label class="text-sm flex items-center gap-2 cursor-pointer">
					<input type="checkbox" bind:checked={showAdvisor} class="rounded" />
					Advisor
				</label>
				<label class="text-sm flex items-center gap-2 ml-auto cursor-pointer">
					<input type="checkbox" bind:checked={autoDeal} class="rounded" />
					Auto-deal
				</label>
			</div>
		</div>

		<!-- Sidebar -->
		<div class="space-y-4">
			<!-- Hi-Lo System -->
			<div class="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--bg-tertiary)]">
				<h3 class="font-semibold mb-3 text-sm uppercase tracking-wide text-[var(--text-secondary)]">Hi-Lo System</h3>
				<div class="space-y-2 text-sm">
					<div class="flex justify-between items-center p-2 rounded bg-green-900/30">
						<span>2, 3, 4, 5, 6</span>
						<span class="font-bold text-[var(--accent-green)]">+1</span>
					</div>
					<div class="flex justify-between items-center p-2 rounded bg-[var(--bg-tertiary)]">
						<span>7, 8, 9</span>
						<span class="font-bold text-[var(--text-secondary)]">0</span>
					</div>
					<div class="flex justify-between items-center p-2 rounded bg-red-900/30">
						<span>10, J, Q, K, A</span>
						<span class="font-bold text-[var(--accent-red)]">−1</span>
					</div>
				</div>
				<div class="mt-3 text-xs text-[var(--text-secondary)]">
					<strong>True Count</strong> = Running Count / Decks Remaining
				</div>
			</div>

			<!-- Betting Guide -->
			<div class="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--bg-tertiary)]">
				<h3 class="font-semibold mb-3 text-sm uppercase tracking-wide text-[var(--text-secondary)]">Bet Sizing</h3>
				<div class="space-y-1 text-sm">
					<div class="flex justify-between {trueCount <= 1 ? 'text-white font-bold' : 'text-[var(--text-secondary)]'}">
						<span>TC ≤ 1</span><span>$10 (min)</span>
					</div>
					<div class="flex justify-between {trueCount > 1 && trueCount <= 2 ? 'text-white font-bold' : 'text-[var(--text-secondary)]'}">
						<span>TC 1-2</span><span>$20</span>
					</div>
					<div class="flex justify-between {trueCount > 2 && trueCount <= 3 ? 'text-white font-bold' : 'text-[var(--text-secondary)]'}">
						<span>TC 2-3</span><span>$40</span>
					</div>
					<div class="flex justify-between {trueCount > 3 && trueCount <= 4 ? 'text-white font-bold' : 'text-[var(--text-secondary)]'}">
						<span>TC 3-4</span><span>$80</span>
					</div>
					<div class="flex justify-between {trueCount > 4 ? 'text-white font-bold' : 'text-[var(--text-secondary)]'}">
						<span>TC ≥ 4</span><span>$100 (max)</span>
					</div>
				</div>
			</div>

			<!-- Count History -->
			<div class="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--bg-tertiary)]">
				<h3 class="font-semibold mb-3 text-sm uppercase tracking-wide text-[var(--text-secondary)]">Recent Cards</h3>
				<div class="max-h-48 overflow-y-auto space-y-0.5">
					{#each countHistory.slice(-20).reverse() as entry}
						<div class="flex justify-between text-xs py-0.5">
							<span>{entry.card}</span>
							<span class="{entry.value > 0 ? 'text-[var(--accent-green)]' : entry.value < 0 ? 'text-[var(--accent-red)]' : 'text-[var(--text-secondary)]'}">
								{entry.value > 0 ? '+' : ''}{entry.value}
							</span>
							<span class="text-[var(--text-secondary)]">RC: {entry.running}</span>
						</div>
					{/each}
					{#if countHistory.length === 0}
						<p class="text-xs text-[var(--text-secondary)]">No cards dealt yet</p>
					{/if}
				</div>
			</div>

		</div>
	</div>
</div>
