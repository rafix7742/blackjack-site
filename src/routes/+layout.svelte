<script lang="ts">
	import '../app.css';
	import { page } from '$app/state';
	import { base } from '$app/paths';

	let { children } = $props();

	const tabs = [
		{ href: `${base}/six`, label: 'Game of Six', icon: '🎲' },
		{ href: `${base}/blackjack`, label: 'Blackjack', icon: '🃏' },
		{ href: `${base}/counting`, label: 'Card Counting', icon: '🧮' },
		{ href: `${base}/equilibrium`, label: 'Equilibria', icon: '⚖️' }
	];
</script>

<svelte:head>
	<title>Game Theory & Blackjack</title>
</svelte:head>

<div class="min-h-screen flex flex-col">
	<nav class="bg-[var(--bg-secondary)] border-b border-[var(--bg-tertiary)] px-6 py-3">
		<div class="max-w-7xl mx-auto flex items-center gap-8">
			<a href="{base}/" class="text-xl font-bold text-[var(--accent-blue)] hover:text-[var(--accent-purple)] transition-colors no-underline">
				Game Theory & Blackjack
			</a>
			<div class="flex gap-1">
				{#each tabs as tab}
					<a
						href={tab.href}
						class="px-4 py-2 rounded-lg text-sm font-medium transition-all no-underline
							{page.url.pathname.startsWith(tab.href)
								? 'bg-[var(--accent-blue)] text-white'
								: 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'}"
					>
						<span class="mr-1.5">{tab.icon}</span>
						{tab.label}
					</a>
				{/each}
			</div>
		</div>
	</nav>

	<main class="flex-1 p-6 max-w-7xl mx-auto w-full">
		{@render children()}
	</main>
</div>
