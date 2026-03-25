<script lang="ts">
	import type { Card } from '$lib/engines/blackjack';

	let { card, small = false }: { card: Card; small?: boolean } = $props();

	const suitSymbols: Record<string, string> = {
		hearts: '♥',
		diamonds: '♦',
		clubs: '♣',
		spades: '♠'
	};

	const isRed = $derived(card.suit === 'hearts' || card.suit === 'diamonds');
	const suitSymbol = $derived(suitSymbols[card.suit]);
</script>

{#if card.faceUp}
	<div
		class="inline-flex flex-col items-center justify-between rounded-lg border-2 border-gray-600 bg-white shadow-lg select-none
			{small ? 'w-12 h-16 p-0.5 text-xs' : 'w-20 h-28 p-1.5 text-base'}
			{isRed ? 'text-red-600' : 'text-gray-900'}"
	>
		<div class="self-start font-bold leading-none">{card.rank}</div>
		<div class="{small ? 'text-lg' : 'text-2xl'}">{suitSymbol}</div>
		<div class="self-end font-bold leading-none rotate-180">{card.rank}</div>
	</div>
{:else}
	<div
		class="inline-flex items-center justify-center rounded-lg border-2 border-gray-600 shadow-lg
			{small ? 'w-12 h-16' : 'w-20 h-28'}"
		style="background: repeating-linear-gradient(45deg, #1e40af, #1e40af 4px, #1e3a8a 4px, #1e3a8a 8px);"
	>
		<div class="text-white font-bold {small ? 'text-xs' : 'text-sm'}">?</div>
	</div>
{/if}
