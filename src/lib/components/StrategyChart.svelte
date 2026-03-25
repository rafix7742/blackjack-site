<script lang="ts">
	import { HARD_TABLE, SOFT_TABLE, PAIR_TABLE, actionColor } from '$lib/engines/basic-strategy';
	import type { StrategyAction } from '$lib/engines/basic-strategy';

	let {
		highlightRow = -1,
		highlightCol = -1,
		highlightTable = '' as 'hard' | 'soft' | 'pair' | ''
	}: {
		highlightRow?: number;
		highlightCol?: number;
		highlightTable?: 'hard' | 'soft' | 'pair' | '';
	} = $props();

	const dealerHeaders = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'A'];

	const hardRowLabels = [
		'5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21'
	];
	const softRowLabels = ['A,2', 'A,3', 'A,4', 'A,5', 'A,6', 'A,7', 'A,8', 'A,9'];
	const pairRowLabels = ['2,2', '3,3', '4,4', '5,5', '6,6', '7,7', '8,8', '9,9', '10,10', 'A,A'];

	let activeTab = $state<'hard' | 'soft' | 'pair'>('hard');

	function getCellClass(
		action: StrategyAction,
		tableType: 'hard' | 'soft' | 'pair',
		row: number,
		col: number
	): string {
		const base = `${actionColor(action)} text-white text-xs font-bold`;
		const isHighlighted = highlightTable === tableType && highlightRow === row && highlightCol === col;
		return `${base} ${isHighlighted ? 'ring-2 ring-white scale-110 z-10' : ''}`;
	}
</script>

<div class="bg-[var(--bg-secondary)] rounded-lg p-3 border border-[var(--bg-tertiary)]">
	<div class="flex gap-1 mb-3">
		<button
			class="px-3 py-1 text-xs rounded font-medium transition-colors
				{activeTab === 'hard' ? 'bg-[var(--accent-blue)] text-white' : 'text-[var(--text-secondary)] hover:text-white'}"
			onclick={() => (activeTab = 'hard')}
		>Hard</button>
		<button
			class="px-3 py-1 text-xs rounded font-medium transition-colors
				{activeTab === 'soft' ? 'bg-[var(--accent-blue)] text-white' : 'text-[var(--text-secondary)] hover:text-white'}"
			onclick={() => (activeTab = 'soft')}
		>Soft</button>
		<button
			class="px-3 py-1 text-xs rounded font-medium transition-colors
				{activeTab === 'pair' ? 'bg-[var(--accent-blue)] text-white' : 'text-[var(--text-secondary)] hover:text-white'}"
			onclick={() => (activeTab = 'pair')}
		>Pairs</button>
	</div>

	<div class="text-xs mb-2 flex gap-3">
		<span class="flex items-center gap-1"><span class="w-3 h-3 bg-red-600 inline-block rounded"></span> Hit</span>
		<span class="flex items-center gap-1"><span class="w-3 h-3 bg-green-600 inline-block rounded"></span> Stand</span>
		<span class="flex items-center gap-1"><span class="w-3 h-3 bg-blue-600 inline-block rounded"></span> Double</span>
		<span class="flex items-center gap-1"><span class="w-3 h-3 bg-yellow-600 inline-block rounded"></span> Split</span>
	</div>

	<table class="w-full border-collapse text-center">
		<thead>
			<tr>
				<th class="p-1 text-xs text-[var(--text-secondary)]"></th>
				{#each dealerHeaders as h}
					<th class="p-1 text-xs text-[var(--text-secondary)]">{h}</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#if activeTab === 'hard'}
				{#each HARD_TABLE as row, i}
					<tr>
						<td class="p-1 text-xs text-[var(--text-secondary)] font-medium">{hardRowLabels[i]}</td>
						{#each row as cell, j}
							<td class="p-0.5">
								<div class="rounded {getCellClass(cell, 'hard', i, j)} py-0.5 px-1 transition-transform">
									{cell}
								</div>
							</td>
						{/each}
					</tr>
				{/each}
			{:else if activeTab === 'soft'}
				{#each SOFT_TABLE as row, i}
					<tr>
						<td class="p-1 text-xs text-[var(--text-secondary)] font-medium">{softRowLabels[i]}</td>
						{#each row as cell, j}
							<td class="p-0.5">
								<div class="rounded {getCellClass(cell, 'soft', i, j)} py-0.5 px-1 transition-transform">
									{cell}
								</div>
							</td>
						{/each}
					</tr>
				{/each}
			{:else}
				{#each PAIR_TABLE as row, i}
					<tr>
						<td class="p-1 text-xs text-[var(--text-secondary)] font-medium">{pairRowLabels[i]}</td>
						{#each row as cell, j}
							<td class="p-0.5">
								<div class="rounded {getCellClass(cell, 'pair', i, j)} py-0.5 px-1 transition-transform">
									{cell}
								</div>
							</td>
						{/each}
					</tr>
				{/each}
			{/if}
		</tbody>
	</table>
</div>
