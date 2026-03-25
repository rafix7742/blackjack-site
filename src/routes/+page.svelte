<script lang="ts">
	import { base } from '$app/paths';
</script>

<div class="flex flex-col items-center justify-center min-h-[70vh] text-center">
	<h1 class="text-5xl font-bold mb-4">Game Theory & Blackjack</h1>
	<p class="text-xl text-[var(--text-secondary)] mb-2">From Optimal Strategy to Card Counting</p>
	<p class="text-[var(--text-secondary)] mb-10">Interactive demos exploring strategy, counting, and equilibria</p>

	<div class="grid grid-cols-2 gap-4 max-w-2xl w-full">
		<a href="{base}/six" class="bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] border border-[var(--bg-tertiary)] rounded-xl p-6 text-left transition-all no-underline text-[var(--text-primary)]">
			<div class="text-3xl mb-2">🎲</div>
			<h2 class="text-lg font-semibold mb-1">Game of Six</h2>
			<p class="text-sm text-[var(--text-secondary)]">Simplified Blackjack with a 6-card deck</p>
		</a>
		<a href="{base}/blackjack" class="bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] border border-[var(--bg-tertiary)] rounded-xl p-6 text-left transition-all no-underline text-[var(--text-primary)]">
			<div class="text-3xl mb-2">🃏</div>
			<h2 class="text-lg font-semibold mb-1">Blackjack</h2>
			<p class="text-sm text-[var(--text-secondary)]">Play with basic strategy advisor</p>
		</a>
		<a href="{base}/counting" class="bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] border border-[var(--bg-tertiary)] rounded-xl p-6 text-left transition-all no-underline text-[var(--text-primary)]">
			<div class="text-3xl mb-2">🧮</div>
			<h2 class="text-lg font-semibold mb-1">Card Counting</h2>
			<p class="text-sm text-[var(--text-secondary)]">Hi-Lo system with live count tracking</p>
		</a>
		<a href="{base}/equilibrium" class="bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] border border-[var(--bg-tertiary)] rounded-xl p-6 text-left transition-all no-underline text-[var(--text-primary)]">
			<div class="text-3xl mb-2">⚖️</div>
			<h2 class="text-lg font-semibold mb-1">Equilibria</h2>
			<p class="text-sm text-[var(--text-secondary)]">Explore Bayesian game equilibria</p>
		</a>
	</div>
</div>
