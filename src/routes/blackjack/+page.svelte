<script lang="ts">
	import {
		createInitialGameState,
		placeBet,
		playerAction as bjPlayerAction,
		newRound,
		handTotal,
		canSplit,
		canDouble,
		type GameState,
		type PlayerAction
	} from '$lib/engines/blackjack';
	import { getOptimalAction, actionLabel, type StrategyResult } from '$lib/engines/basic-strategy';
	import Hand from '$lib/components/Hand.svelte';
	import StrategyChart from '$lib/components/StrategyChart.svelte';

	let game = $state<GameState>(createInitialGameState(1, 1000));
	let betAmount = $state(10);
	let showAdvisor = $state(true);
	let correctDecisions = $state(0);
	let totalDecisions = $state(0);
	let handsPlayed = $state(0);

	let currentAdvice = $derived.by<StrategyResult | null>(() => {
		if (game.phase !== 'playerTurn') return null;
		const hand = game.playerHands[game.activeHandIndex];
		if (!hand || hand.cards.length === 0) return null;
		const dealerUpcard = game.dealerHand[0];
		if (!dealerUpcard) return null;
		return getOptimalAction(hand.cards, dealerUpcard);
	});

	function handleBet() {
		game = placeBet(game, betAmount);
	}

	let autoDeal = $state(true);

	function handleAction(action: PlayerAction) {
		// Check if action matches advice
		if (currentAdvice && game.phase === 'playerTurn') {
			totalDecisions++;
			const adviceAction = currentAdvice.action;
			const actionMap: Record<PlayerAction, string> = {
				hit: 'H',
				stand: 'S',
				double: 'D',
				split: 'P'
			};
			if (actionMap[action] === adviceAction) {
				correctDecisions++;
			}
		}

		game = bjPlayerAction(game, action);
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
		game = newRound(game);
		game = placeBet(game, betAmount);
	}

	function handleNewRound() {
		game = newRound(game);
	}

	function handleNewGame() {
		game = createInitialGameState(1, 1000);
		correctDecisions = 0;
		totalDecisions = 0;
		handsPlayed = 0;
	}

	const accuracy = $derived(totalDecisions > 0 ? Math.round((correctDecisions / totalDecisions) * 100) : 0);
	const activeHand = $derived(game.playerHands[game.activeHandIndex]);
	let showRules = $state(false);
</script>

<div class="space-y-6">
	<div class="flex items-start justify-between gap-4">
		<div>
			<h1 class="text-3xl font-bold mb-2">Blackjack — Basic Strategy</h1>
			<p class="text-[var(--text-secondary)]">
				Play with a strategy advisor that shows the optimal action for every hand.
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
			<h3 class="font-semibold mb-3 text-sm uppercase tracking-wide text-[var(--text-secondary)]">Rules</h3>
			<ul class="text-sm text-[var(--text-secondary)] space-y-1.5 list-disc list-inside">
				<li>Standard Blackjack with a <strong class="text-white">single deck</strong></li>
				<li>Get as close to <strong class="text-white">21</strong> as possible without going over</li>
				<li>Face cards = 10, Aces = 1 or 11</li>
				<li><strong class="text-white">Hit</strong>: draw a card. <strong class="text-white">Stand</strong>: keep your hand</li>
				<li><strong class="text-white">Double</strong>: double your bet and receive exactly one more card</li>
				<li><strong class="text-white">Split</strong>: if you have a pair, split into two hands (each gets a new card)</li>
				<li>Dealer must hit until reaching <strong class="text-white">17 or higher</strong></li>
				<li>Blackjack (Ace + 10-value) pays <strong class="text-white">3:2</strong></li>
				<li>The strategy advisor shows the <strong class="text-white">minimax optimal</strong> action assuming no knowledge of remaining cards</li>
			</ul>
		</div>
	{/if}

	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
		<!-- Game Area -->
		<div class="lg:col-span-2 space-y-4">
			<!-- Table -->
			<div class="bg-[var(--bg-secondary)] rounded-xl p-6 border border-[var(--bg-tertiary)] min-h-[420px] flex flex-col">
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
					<!-- Message -->
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
						<div class="flex items-center gap-3">
							<label class="text-sm text-[var(--text-secondary)]">Bet:</label>
							<input
								type="range"
								min="5"
								max="100"
								step="5"
								bind:value={betAmount}
								class="w-32"
							/>
							<span class="text-sm font-bold w-8">${betAmount}</span>
							<button
								onclick={handleBet}
								class="px-6 py-2 bg-[var(--accent-green)] hover:bg-green-500 text-white rounded-lg font-bold transition-colors"
							>
								Deal
							</button>
						</div>
					{:else if game.phase === 'playerTurn'}
						<button
							onclick={() => handleAction('hit')}
							class="px-6 py-2 bg-[var(--accent-red)] hover:bg-red-500 text-white rounded-lg font-bold transition-colors"
						>
							Hit
						</button>
						<button
							onclick={() => handleAction('stand')}
							class="px-6 py-2 bg-[var(--accent-green)] hover:bg-green-500 text-white rounded-lg font-bold transition-colors"
						>
							Stand
						</button>
						{#if activeHand && canDouble(activeHand)}
							<button
								onclick={() => handleAction('double')}
								class="px-6 py-2 bg-[var(--accent-blue)] hover:bg-blue-500 text-white rounded-lg font-bold transition-colors"
							>
								Double
							</button>
						{/if}
						{#if activeHand && canSplit(activeHand)}
							<button
								onclick={() => handleAction('split')}
								class="px-6 py-2 bg-[var(--accent-yellow)] hover:bg-yellow-500 text-white rounded-lg font-bold transition-colors"
							>
								Split
							</button>
						{/if}
					{:else if game.phase === 'gameOver'}
						<button
							onclick={handleNextHand}
							class="px-6 py-2 bg-[var(--accent-blue)] hover:bg-blue-500 text-white rounded-lg font-bold transition-colors"
						>
							{autoDeal ? 'Deal Now' : 'Next Hand'}
						</button>
						<button
							onclick={handleNewGame}
							class="px-6 py-2 bg-[var(--bg-tertiary)] hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
						>
							Reset
						</button>
					{/if}
				</div>
				</div>
			</div>

			<!-- Stats Bar -->
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
					<span class="text-[var(--text-secondary)]">Strategy Accuracy:</span>
					<span class="font-bold {accuracy >= 80 ? 'text-[var(--accent-green)]' : accuracy >= 50 ? 'text-[var(--accent-yellow)]' : 'text-[var(--accent-red)]'}">
						{accuracy}%
					</span>
					<span class="text-[var(--text-secondary)]">({correctDecisions}/{totalDecisions})</span>
				</div>
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

		<!-- Strategy Chart -->
		<div>
			<StrategyChart />
			<div class="mt-4 bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--bg-tertiary)]">
				<h3 class="font-semibold mb-2 text-sm uppercase tracking-wide text-[var(--text-secondary)]">About</h3>
				<p class="text-sm text-[var(--text-secondary)]">
					Basic strategy minimizes the house edge to about <strong class="text-white">−1.5%</strong>
					by choosing the optimal action for every possible hand vs. dealer upcard combination.
					It assumes no knowledge of remaining deck composition.
				</p>
			</div>
		</div>
	</div>
</div>
