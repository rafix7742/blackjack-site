<script lang="ts">
	import type { Card as CardType } from '$lib/engines/blackjack';
	import { handTotal } from '$lib/engines/blackjack';
	import Card from './Card.svelte';

	let {
		cards,
		label = '',
		showTotal = true,
		small = false
	}: {
		cards: CardType[];
		label?: string;
		showTotal?: boolean;
		small?: boolean;
	} = $props();

	const total = $derived(handTotal(cards));
	const hasHiddenCard = $derived(cards.some((c) => !c.faceUp));
</script>

<div class="flex flex-col items-center gap-2">
	{#if label}
		<div class="text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wide">
			{label}
		</div>
	{/if}
	<div class="flex gap-1 flex-wrap justify-center">
		{#each cards as card}
			<Card {card} {small} />
		{/each}
	</div>
	{#if showTotal && cards.length > 0}
		<div class="text-lg font-bold">
			{#if hasHiddenCard}
				{total}+?
			{:else}
				{total}
			{/if}
		</div>
	{/if}
</div>
