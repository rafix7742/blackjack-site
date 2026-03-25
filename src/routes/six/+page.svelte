<script lang="ts">
	import {
		createInitialState,
		playerAction,
		aiTurn,
		generateGameTree,
		getDeckProbabilities,
		type SixGameState,
		type TreeNode
	} from '$lib/engines/six-game';

	let gameState = $state<SixGameState>(createInitialState());
	let wins = $state(0);
	let losses = $state(0);
	let ties = $state(0);
	let showTree = $state(false);
	let showRules = $state(false);

	// Generate tree based on current game state
	let tree = $derived(
		generateGameTree(gameState.playerHand, gameState.aiHand, gameState.deck)
	);

	let deckInfo = $derived(getDeckProbabilities(gameState.deck));

	function handleHit() {
		if (gameState.phase !== 'playerTurn') return;
		gameState = playerAction(gameState, 'hit');

		if (gameState.phase === 'aiTurn') {
			setTimeout(() => {
				gameState = aiTurn(gameState);
				updateScore();
			}, 500);
		}
	}

	function handleStay() {
		if (gameState.phase !== 'playerTurn') return;
		gameState = playerAction(gameState, 'stay');

		if (gameState.phase === 'aiTurn') {
			setTimeout(() => {
				gameState = aiTurn(gameState);
				updateScore();
			}, 500);
		}
	}

	function updateScore() {
		if (gameState.result === 'playerWin') wins++;
		else if (gameState.result === 'aiWin') losses++;
		else if (gameState.result === 'tie') ties++;
	}

	function newGame() {
		gameState = createInitialState();
	}
</script>

<div class="space-y-6">
	<div class="flex items-start justify-between gap-4">
		<div>
			<h1 class="text-3xl font-bold mb-2">The Game of Six</h1>
			<p class="text-[var(--text-secondary)]">
				A simplified Blackjack variant with a tiny deck. Play against a minimax AI that uses backward induction.
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
				<li>Deck: <strong class="text-white">3 ones</strong> and <strong class="text-white">3 threes</strong> (6 cards total)</li>
				<li>Each player is dealt <strong class="text-white">2 cards</strong> from the shared deck — one face-up, one face-down</li>
				<li>Players take turns choosing to <strong class="text-white">Hit</strong> (draw) or <strong class="text-white">Stay</strong></li>
				<li>Cards are drawn <strong class="text-white">without replacement</strong> — deck composition changes as cards come out</li>
				<li>Target: <strong class="text-white">6</strong>. Going over 6 = bust (automatic loss)</li>
				<li>Closest to 6 without busting wins</li>
				<li>The AI uses <strong class="text-white">minimax</strong> with backward induction, accounting for remaining deck composition</li>
			</ul>
		</div>
	{/if}

	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
		<!-- Game Area -->
		<div class="lg:col-span-2 bg-[var(--bg-secondary)] rounded-xl p-6 border border-[var(--bg-tertiary)] min-h-[400px] flex flex-col">
			<!-- Deck Status -->
			<div class="flex justify-center gap-6 mb-6">
				<div class="text-center">
					<div class="text-xs text-[var(--text-secondary)] uppercase">Deck</div>
					<div class="text-sm font-mono mt-1">
						{gameState.deck.length} cards
						<span class="text-[var(--text-secondary)]">
							({deckInfo.ones}×1, {deckInfo.threes}×3)
						</span>
					</div>
				</div>
			</div>

			<div class="flex justify-between items-start mb-8">
				<!-- Player Hand -->
				<div class="text-center flex-1">
					<div class="text-sm text-[var(--text-secondary)] uppercase tracking-wide mb-2">Your Hand</div>
					<div class="flex justify-center gap-1 mb-2">
						{#each gameState.playerCards as card}
							<span class="inline-flex items-center justify-center w-10 h-14 rounded-lg bg-white text-gray-900 font-bold text-lg border-2 border-gray-400">
								{card}
							</span>
						{/each}
					</div>
					<div class="text-4xl font-bold {gameState.playerBusted ? 'text-[var(--accent-red)]' : gameState.playerHand === 6 ? 'text-[var(--accent-green)]' : 'text-white'}">
						= {gameState.playerHand}
					</div>
					{#if gameState.playerBusted}
						<div class="text-[var(--accent-red)] font-medium mt-1">BUST!</div>
					{:else if gameState.playerStayed}
						<div class="text-[var(--accent-green)] font-medium mt-1">STAYED</div>
					{/if}
				</div>

				<!-- VS -->
				<div class="text-2xl font-bold text-[var(--text-secondary)] self-center px-4">vs</div>

				<!-- AI Hand -->
				<div class="text-center flex-1">
					<div class="text-sm text-[var(--text-secondary)] uppercase tracking-wide mb-2">AI Hand</div>
					{#if gameState.phase === 'playerTurn'}
						<div class="flex justify-center gap-1 mb-2">
							<!-- First card face-up -->
							<span class="inline-flex items-center justify-center w-10 h-14 rounded-lg bg-white text-gray-900 font-bold text-lg border-2 border-gray-400">
								{gameState.aiCards[0]}
							</span>
							<!-- Second card face-down -->
							<span class="inline-flex items-center justify-center w-10 h-14 rounded-lg font-bold text-lg border-2 border-gray-600"
								style="background: repeating-linear-gradient(45deg, #1e40af, #1e40af 3px, #1e3a8a 3px, #1e3a8a 6px);">
								<span class="text-white">?</span>
							</span>
						</div>
						<div class="text-4xl font-bold text-[var(--text-secondary)]">{gameState.aiCards[0]} + ?</div>
					{:else}
						<div class="flex justify-center gap-1 mb-2">
							{#each gameState.aiCards as card}
								<span class="inline-flex items-center justify-center w-10 h-14 rounded-lg bg-white text-gray-900 font-bold text-lg border-2 border-gray-400">
									{card}
								</span>
							{/each}
						</div>
						<div class="text-4xl font-bold {gameState.aiBusted ? 'text-[var(--accent-red)]' : gameState.aiHand === 6 ? 'text-[var(--accent-green)]' : 'text-white'}">
							= {gameState.aiHand}
						</div>
						{#if gameState.aiBusted}
							<div class="text-[var(--accent-red)] font-medium mt-1">BUST!</div>
						{:else if gameState.aiStayed}
							<div class="text-[var(--accent-green)] font-medium mt-1">STAYED</div>
						{/if}
					{/if}
				</div>
			</div>

			<div class="mt-auto">
				<!-- Message -->
				<div class="text-center mb-6 p-3 rounded-lg bg-[var(--bg-tertiary)] min-h-[3rem] flex items-center justify-center">
					<p class="text-sm">{gameState.message}</p>
				</div>

				<!-- Result Banner (always reserve space) -->
				<div class="min-h-[60px] mb-4">
					{#if gameState.phase === 'gameOver'}
						<div class="text-center p-4 rounded-lg {
							gameState.result === 'playerWin' ? 'bg-green-900/50 text-[var(--accent-green)]' :
							gameState.result === 'aiWin' ? 'bg-red-900/50 text-[var(--accent-red)]' :
							'bg-yellow-900/50 text-[var(--accent-yellow)]'
						}">
							<div class="text-2xl font-bold">
								{gameState.result === 'playerWin' ? 'You Win!' :
								 gameState.result === 'aiWin' ? 'AI Wins!' : 'Tie!'}
							</div>
						</div>
					{/if}
				</div>

				<!-- Actions -->
				<div class="flex justify-center gap-4 min-h-[48px]">
					{#if gameState.phase === 'playerTurn'}
						<button
							onclick={handleHit}
							class="px-8 py-3 bg-[var(--accent-red)] hover:bg-red-500 text-white rounded-lg font-bold text-lg transition-colors"
						>
							Hit
						</button>
						<button
							onclick={handleStay}
							class="px-8 py-3 bg-[var(--accent-green)] hover:bg-green-500 text-white rounded-lg font-bold text-lg transition-colors"
						>
							Stay
						</button>
					{:else if gameState.phase === 'gameOver'}
						<button
							onclick={newGame}
							class="px-8 py-3 bg-[var(--accent-blue)] hover:bg-blue-500 text-white rounded-lg font-bold text-lg transition-colors"
						>
							New Game
						</button>
					{:else}
						<div class="text-[var(--text-secondary)]">AI is thinking...</div>
					{/if}
				</div>
			</div>
		</div>

		<!-- Sidebar: Stats + Rules + History -->
		<div class="space-y-4">
			<!-- Score -->
			<div class="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--bg-tertiary)]">
				<h3 class="font-semibold mb-3 text-sm uppercase tracking-wide text-[var(--text-secondary)]">Score</h3>
				<div class="grid grid-cols-3 gap-2 text-center">
					<div>
						<div class="text-2xl font-bold text-[var(--accent-green)]">{wins}</div>
						<div class="text-xs text-[var(--text-secondary)]">Wins</div>
					</div>
					<div>
						<div class="text-2xl font-bold text-[var(--accent-yellow)]">{ties}</div>
						<div class="text-xs text-[var(--text-secondary)]">Ties</div>
					</div>
					<div>
						<div class="text-2xl font-bold text-[var(--accent-red)]">{losses}</div>
						<div class="text-xs text-[var(--text-secondary)]">Losses</div>
					</div>
				</div>
			</div>

			<!-- Game Log -->
			<div class="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--bg-tertiary)]">
				<h3 class="font-semibold mb-3 text-sm uppercase tracking-wide text-[var(--text-secondary)]">Game Log</h3>
				<div class="max-h-36 overflow-y-auto space-y-0.5">
					{#each gameState.history as entry, i}
						<div class="text-xs text-[var(--text-secondary)] py-0.5 {i === gameState.history.length - 1 ? 'text-white font-medium' : ''}">
							{entry}
						</div>
					{/each}
				</div>
			</div>

			<!-- Strategy Tree Toggle -->
			<div class="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--bg-tertiary)]">
				<h3 class="font-semibold mb-3 text-sm uppercase tracking-wide text-[var(--text-secondary)]">Strategy Tree</h3>
				<p class="text-sm text-[var(--text-secondary)] mb-3">
					View the decision tree from your current hand. Probabilities update based on remaining deck composition.
				</p>
				<button
					onclick={() => (showTree = !showTree)}
					class="text-sm text-[var(--accent-blue)] hover:text-blue-400 transition-colors"
				>
					{showTree ? 'Hide' : 'Show'} Tree
				</button>
			</div>
		</div>
	</div>

	<!-- Strategy Tree Visualization -->
	{#if showTree}
		<div class="bg-[var(--bg-secondary)] rounded-xl p-6 border border-[var(--bg-tertiary)]">
			<h3 class="font-semibold mb-2">Strategy Tree (hand = {gameState.playerHand}, deck: {deckInfo.ones}×1, {deckInfo.threes}×3)</h3>
			<p class="text-xs text-[var(--text-secondary)] mb-4">Probabilities reflect the actual remaining deck composition (without replacement).</p>
			<div class="overflow-x-auto">
				<div class="min-w-[600px]">
					{@render treeNode(tree, 0)}
				</div>
			</div>
		</div>
	{/if}
</div>

{#snippet treeNode(node: TreeNode, depth: number)}
	<div style="margin-left: {depth * 2}rem;">
		<div class="flex items-center gap-2 py-1">
			<span class="font-mono text-sm px-2 py-0.5 rounded {node.hand > 6 ? 'bg-red-900 text-red-300' : 'bg-[var(--bg-tertiary)]'}">
				Hand: {node.label}
			</span>
			{#if node.action}
				<span class="text-xs px-2 py-0.5 rounded {node.action === 'hit' ? 'bg-red-800 text-red-200' : 'bg-green-800 text-green-200'}">
					Optimal: {node.action.toUpperCase()}
				</span>
			{/if}
			{#if node.payoff !== undefined}
				<span class="text-xs text-[var(--text-secondary)]">
					EV: {node.payoff.toFixed(2)}
				</span>
			{/if}
		</div>
		{#if node.children}
			{#each node.children as child}
				<div class="border-l border-[var(--bg-tertiary)] ml-4 pl-4">
					<span class="text-xs text-[var(--text-secondary)]">
						Draw {child.card} (p={child.probability})
					</span>
					{@render treeNode(child.node, depth + 1)}
				</div>
			{/each}
		{/if}
	</div>
{/snippet}
