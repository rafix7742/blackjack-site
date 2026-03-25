<script lang="ts">
	import {
		computeOneTypeEquilibrium,
		computeTwoTypeEquilibrium,
		type OneTypeParams,
		type TwoTypeParams
	} from '$lib/equilibrium/bayesian';

	let model = $state<'one' | 'two'>('one');

	// One-type parameters
	let p = $state(0.3);
	let a = $state(10);
	let b = $state(5);
	let FL = $state(3);

	// Two-type additional parameters
	let w = $state(0.2);
	let aH = $state(12);
	let aL = $state(3);
	let FH = $state(15);

	const oneTypeResult = $derived(computeOneTypeEquilibrium({ p, a, b, FL }));
	const twoTypeResult = $derived(
		computeTwoTypeEquilibrium({ p, a, b, FL, w, aH, aL, FH })
	);

	const threshold = $derived((a - b) / a);
	let showRules = $state(false);
</script>

<div class="space-y-6">
	<div class="flex items-start justify-between gap-4">
		<div>
			<h1 class="text-3xl font-bold mb-2">Bayesian Game Equilibria</h1>
			<p class="text-[var(--text-secondary)]">
				Explore how equilibria shift between the player and casino as you adjust parameters.
			</p>
		</div>
		<button
			onclick={() => (showRules = !showRules)}
			class="shrink-0 w-8 h-8 rounded-full border border-[var(--bg-tertiary)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-white hover:border-[var(--accent-blue)] transition-colors flex items-center justify-center text-sm font-serif italic"
			title="Setup"
		>i</button>
	</div>

	{#if showRules}
		<div class="bg-[var(--bg-secondary)] rounded-xl p-5 border border-[var(--bg-tertiary)]">
			<h3 class="font-semibold mb-3 text-sm uppercase tracking-wide text-[var(--text-secondary)]">Game Setup</h3>
			<ul class="text-sm text-[var(--text-secondary)] space-y-1.5 list-disc list-inside">
				<li>The <strong class="text-white">player</strong> chooses: Count cards (C) or play Standard strategy (S)</li>
				<li>The <strong class="text-white">casino</strong> chooses: Observe the player (O) or Not observe (N)</li>
				<li>The casino can be <strong class="text-white">vigilant</strong> (capable of detecting counters, probability p) or <strong class="text-white">non-vigilant</strong> (probability 1−p)</li>
				<li>Counting undetected pays <strong class="text-white">a</strong>, standard strategy pays <strong class="text-white">b</strong>, getting caught pays <strong class="text-white">0</strong> (where a &gt; b)</li>
				<li><strong class="text-white">One-type model</strong>: only the casino's type is unknown to the player</li>
				<li><strong class="text-white">Two-type model</strong>: both the casino's type and the player's skill level are unknown</li>
				<li>In the two-type model, the player is high-skill (payoff a<sub>H</sub>) or low-skill (payoff a<sub>L</sub>) with a<sub>L</sub> &lt; b &lt; a<sub>H</sub></li>
			</ul>
		</div>
	{/if}

	<!-- Model Selector -->
	<div class="flex gap-2">
		<button
			onclick={() => (model = 'one')}
			class="px-4 py-2 rounded-lg font-medium transition-colors
				{model === 'one' ? 'bg-[var(--accent-blue)] text-white' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-white'}"
		>
			One Unknown Type (§4.1-4.2)
		</button>
		<button
			onclick={() => (model = 'two')}
			class="px-4 py-2 rounded-lg font-medium transition-colors
				{model === 'two' ? 'bg-[var(--accent-blue)] text-white' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-white'}"
		>
			Two Unknown Types (§4.3)
		</button>
	</div>

	{#if model === 'one'}
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
			<!-- Parameters -->
			<div class="bg-[var(--bg-secondary)] rounded-xl p-6 border border-[var(--bg-tertiary)]">
				<h2 class="text-xl font-bold mb-4">Parameters</h2>
				<p class="text-sm text-[var(--text-secondary)] mb-4">
					Casino type is unknown to the player. The casino is vigilant with probability p.
				</p>

				<div class="space-y-4">
					<div>
						<label class="flex justify-between text-sm mb-1">
							<span>p (prob. casino is vigilant)</span>
							<span class="font-mono font-bold">{p.toFixed(2)}</span>
						</label>
						<input type="range" min="0" max="1" step="0.01" bind:value={p} class="w-full" />
					</div>
					<div>
						<label class="flex justify-between text-sm mb-1">
							<span>a (card counting payoff)</span>
							<span class="font-mono font-bold">{a}</span>
						</label>
						<input type="range" min="1" max="20" step="0.5" bind:value={a} class="w-full" />
					</div>
					<div>
						<label class="flex justify-between text-sm mb-1">
							<span>b (standard strategy payoff)</span>
							<span class="font-mono font-bold">{b}</span>
						</label>
						<input type="range" min="0" max="15" step="0.5" bind:value={b} class="w-full" />
					</div>
					<div>
						<label class="flex justify-between text-sm mb-1">
							<span>F<sub>L</sub> (fine when caught)</span>
							<span class="font-mono font-bold">{FL}</span>
						</label>
						<input type="range" min="0" max="15" step="0.5" bind:value={FL} class="w-full" />
					</div>
				</div>

				<!-- Payoff Matrix -->
				<div class="mt-6">
					<h3 class="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-2">Payoff Matrix (Player)</h3>
					<table class="w-full text-sm border-collapse">
						<thead>
							<tr>
								<th class="p-2 text-left"></th>
								<th class="p-2 text-center border border-[var(--bg-tertiary)]">O, O</th>
								<th class="p-2 text-center border border-[var(--bg-tertiary)]">O, N</th>
								<th class="p-2 text-center border border-[var(--bg-tertiary)]">N, O</th>
								<th class="p-2 text-center border border-[var(--bg-tertiary)]">N, N</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td class="p-2 font-medium border border-[var(--bg-tertiary)]">Count (C)</td>
								<td class="p-2 text-center border border-[var(--bg-tertiary)]">0</td>
								<td class="p-2 text-center border border-[var(--bg-tertiary)]">{(a * (1 - p)).toFixed(1)}</td>
								<td class="p-2 text-center border border-[var(--bg-tertiary)]">{(a * p).toFixed(1)}</td>
								<td class="p-2 text-center border border-[var(--bg-tertiary)]">{a}</td>
							</tr>
							<tr>
								<td class="p-2 font-medium border border-[var(--bg-tertiary)]">Standard (S)</td>
								<td class="p-2 text-center border border-[var(--bg-tertiary)]">{b}</td>
								<td class="p-2 text-center border border-[var(--bg-tertiary)]">{b}</td>
								<td class="p-2 text-center border border-[var(--bg-tertiary)]">{b}</td>
								<td class="p-2 text-center border border-[var(--bg-tertiary)]">{b}</td>
							</tr>
						</tbody>
					</table>
					<p class="text-xs text-[var(--text-secondary)] mt-1">
						Columns: (Vigilant casino, Non-vigilant casino) actions. O=Observe, N=Not observe.
					</p>
				</div>
			</div>

			<!-- Results -->
			<div class="space-y-4">
				<!-- Threshold Visualization -->
				<div class="bg-[var(--bg-secondary)] rounded-xl p-6 border border-[var(--bg-tertiary)]">
					<h2 class="text-xl font-bold mb-4">Equilibrium Analysis</h2>

					<!-- Threshold bar -->
					<div class="mb-4">
						<div class="flex justify-between text-xs text-[var(--text-secondary)] mb-1">
							<span>p = 0</span>
							<span>Threshold: (a−b)/a = {threshold.toFixed(3)}</span>
							<span>p = 1</span>
						</div>
						<div class="relative h-8 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
							<!-- Pure strategy region -->
							<div
								class="absolute left-0 top-0 bottom-0 bg-green-800/60"
								style="width: {Math.min(threshold * 100, 100)}%"
							></div>
							<!-- Mixed strategy region -->
							<div
								class="absolute top-0 bottom-0 bg-purple-800/60"
								style="left: {Math.min(threshold * 100, 100)}%; right: 0"
							></div>
							<!-- Current p marker -->
							<div
								class="absolute top-0 bottom-0 w-1 bg-white"
								style="left: {p * 100}%"
							></div>
						</div>
						<div class="flex justify-between text-xs mt-1">
							<span class="text-green-400">Pure Strategy</span>
							<span class="text-purple-400">Mixed Strategy</span>
						</div>
					</div>

					<!-- Result -->
					<div class="p-4 rounded-lg {oneTypeResult.type === 'pure' ? 'bg-green-900/30 border border-green-700' : oneTypeResult.type === 'mixed' ? 'bg-purple-900/30 border border-purple-700' : 'bg-gray-900/30 border border-gray-700'}">
						<div class="text-lg font-bold mb-2">
							{oneTypeResult.type === 'pure' ? 'Pure Strategy Equilibrium' : oneTypeResult.type === 'mixed' ? 'Mixed Strategy Equilibrium' : 'No Equilibrium'}
						</div>
						<p class="text-sm text-[var(--text-secondary)]">{oneTypeResult.description}</p>

						{#if oneTypeResult.pureStrategy}
							<div class="mt-3 grid grid-cols-3 gap-2 text-sm">
								<div class="p-2 rounded bg-[var(--bg-tertiary)]">
									<div class="text-xs text-[var(--text-secondary)]">Player</div>
									<div class="font-bold text-[var(--accent-green)]">{oneTypeResult.pureStrategy.player}</div>
								</div>
								<div class="p-2 rounded bg-[var(--bg-tertiary)]">
									<div class="text-xs text-[var(--text-secondary)]">Vigilant Casino</div>
									<div class="font-bold text-[var(--accent-red)]">{oneTypeResult.pureStrategy.vigilantCasino}</div>
								</div>
								<div class="p-2 rounded bg-[var(--bg-tertiary)]">
									<div class="text-xs text-[var(--text-secondary)]">Non-vigilant Casino</div>
									<div class="font-bold">{oneTypeResult.pureStrategy.nonVigilantCasino}</div>
								</div>
							</div>
						{/if}

						{#if oneTypeResult.mixedStrategy}
							<div class="mt-3 grid grid-cols-3 gap-2 text-sm">
								<div class="p-2 rounded bg-[var(--bg-tertiary)]">
									<div class="text-xs text-[var(--text-secondary)]">Player counts with prob</div>
									<div class="font-bold font-mono">q = {oneTypeResult.mixedStrategy.playerCountProb.toFixed(3)}</div>
								</div>
								<div class="p-2 rounded bg-[var(--bg-tertiary)]">
									<div class="text-xs text-[var(--text-secondary)]">Vigilant observes with prob</div>
									<div class="font-bold font-mono">r = {oneTypeResult.mixedStrategy.vigilantObserveProb.toFixed(3)}</div>
								</div>
								<div class="p-2 rounded bg-[var(--bg-tertiary)]">
									<div class="text-xs text-[var(--text-secondary)]">Non-vigilant observes</div>
									<div class="font-bold">Never</div>
								</div>
							</div>
						{/if}

						<div class="mt-3 text-sm">
							<span class="text-[var(--text-secondary)]">Player expected payoff:</span>
							<span class="font-bold font-mono ml-1">{oneTypeResult.playerExpectedPayoff.toFixed(2)}</span>
						</div>
					</div>
				</div>

				<!-- Key Conditions -->
				<div class="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--bg-tertiary)]">
					<h3 class="font-semibold mb-3 text-sm uppercase tracking-wide text-[var(--text-secondary)]">Key Conditions</h3>
					<div class="space-y-2 text-sm">
						<div class="flex items-center gap-2">
							<span class="w-4 h-4 rounded-full {a > b ? 'bg-[var(--accent-green)]' : 'bg-[var(--accent-red)]'}"></span>
							<span>a &gt; b (counting is profitable): {a} &gt; {b} — {a > b ? 'Yes' : 'No'}</span>
						</div>
						<div class="flex items-center gap-2">
							<span class="w-4 h-4 rounded-full {p <= threshold ? 'bg-[var(--accent-green)]' : 'bg-[var(--accent-red)]'}"></span>
							<span>p ≤ (a−b)/a: {p.toFixed(2)} ≤ {threshold.toFixed(3)} — {p <= threshold ? 'Yes (pure)' : 'No (mixed)'}</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	{:else}
		<!-- Two Unknown Types Model -->
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
			<!-- Parameters -->
			<div class="bg-[var(--bg-secondary)] rounded-xl p-6 border border-[var(--bg-tertiary)]">
				<h2 class="text-xl font-bold mb-4">Parameters</h2>
				<p class="text-sm text-[var(--text-secondary)] mb-4">
					Both casino type AND player skill are unknown. Player is high-skill with probability w.
				</p>

				<div class="space-y-4">
					<div>
						<label class="flex justify-between text-sm mb-1">
							<span>p (prob. casino is vigilant)</span>
							<span class="font-mono font-bold">{p.toFixed(2)}</span>
						</label>
						<input type="range" min="0" max="1" step="0.01" bind:value={p} class="w-full" />
					</div>
					<div>
						<label class="flex justify-between text-sm mb-1">
							<span>w (prob. player is high-skill)</span>
							<span class="font-mono font-bold">{w.toFixed(2)}</span>
						</label>
						<input type="range" min="0" max="1" step="0.01" bind:value={w} class="w-full" />
					</div>
					<div>
						<label class="flex justify-between text-sm mb-1">
							<span>a<sub>H</sub> (high-skill counting payoff)</span>
							<span class="font-mono font-bold">{aH}</span>
						</label>
						<input type="range" min="1" max="25" step="0.5" bind:value={aH} class="w-full" />
					</div>
					<div>
						<label class="flex justify-between text-sm mb-1">
							<span>a<sub>L</sub> (low-skill counting payoff)</span>
							<span class="font-mono font-bold">{aL}</span>
						</label>
						<input type="range" min="0" max="15" step="0.5" bind:value={aL} class="w-full" />
					</div>
					<div>
						<label class="flex justify-between text-sm mb-1">
							<span>b (standard strategy payoff)</span>
							<span class="font-mono font-bold">{b}</span>
						</label>
						<input type="range" min="0" max="15" step="0.5" bind:value={b} class="w-full" />
					</div>
					<div>
						<label class="flex justify-between text-sm mb-1">
							<span>F<sub>L</sub> (vigilant casino fine)</span>
							<span class="font-mono font-bold">{FL}</span>
						</label>
						<input type="range" min="0" max="20" step="0.5" bind:value={FL} class="w-full" />
					</div>
					<div>
						<label class="flex justify-between text-sm mb-1">
							<span>F<sub>H</sub> (non-vigilant casino fine)</span>
							<span class="font-mono font-bold">{FH}</span>
						</label>
						<input type="range" min="0" max="30" step="0.5" bind:value={FH} class="w-full" />
					</div>
				</div>

				<!-- Payoff Matrix -->
				<div class="mt-6">
					<h3 class="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-2">Expected Payoff Matrix (Player)</h3>
					<div class="overflow-x-auto">
						<table class="w-full text-sm border-collapse">
							<thead>
								<tr>
									<th class="p-2 text-left border border-[var(--bg-tertiary)]"></th>
									<th class="p-2 text-center border border-[var(--bg-tertiary)]">(O, O)</th>
									<th class="p-2 text-center border border-[var(--bg-tertiary)]">(O, N)</th>
									<th class="p-2 text-center border border-[var(--bg-tertiary)]">(N, O)</th>
									<th class="p-2 text-center border border-[var(--bg-tertiary)]">(N, N)</th>
								</tr>
							</thead>
							<tbody>
								<tr>
									<td class="p-2 font-medium border border-[var(--bg-tertiary)]">(C, C)</td>
									<td class="p-2 text-center border border-[var(--bg-tertiary)]">{(w * 0 + (1 - w) * 0).toFixed(1)}</td>
									<td class="p-2 text-center border border-[var(--bg-tertiary)]">{(w * 0 + (1 - w) * aL).toFixed(1)}</td>
									<td class="p-2 text-center border border-[var(--bg-tertiary)]">{(w * aH + (1 - w) * 0).toFixed(1)}</td>
									<td class="p-2 text-center border border-[var(--bg-tertiary)]">{(w * aH + (1 - w) * aL).toFixed(1)}</td>
								</tr>
								<tr>
									<td class="p-2 font-medium border border-[var(--bg-tertiary)]">(C, S)</td>
									<td class="p-2 text-center border border-[var(--bg-tertiary)]">{(w * 0 + (1 - w) * b).toFixed(1)}</td>
									<td class="p-2 text-center border border-[var(--bg-tertiary)]">{(w * 0 + (1 - w) * b).toFixed(1)}</td>
									<td class="p-2 text-center border border-[var(--bg-tertiary)]">{(w * aH + (1 - w) * b).toFixed(1)}</td>
									<td class="p-2 text-center border border-[var(--bg-tertiary)]">{(w * aH + (1 - w) * b).toFixed(1)}</td>
								</tr>
								<tr>
									<td class="p-2 font-medium border border-[var(--bg-tertiary)]">(S, C)</td>
									<td class="p-2 text-center border border-[var(--bg-tertiary)]">{(w * b + (1 - w) * 0).toFixed(1)}</td>
									<td class="p-2 text-center border border-[var(--bg-tertiary)]">{(w * b + (1 - w) * aL).toFixed(1)}</td>
									<td class="p-2 text-center border border-[var(--bg-tertiary)]">{(w * b + (1 - w) * 0).toFixed(1)}</td>
									<td class="p-2 text-center border border-[var(--bg-tertiary)]">{(w * b + (1 - w) * aL).toFixed(1)}</td>
								</tr>
								<tr>
									<td class="p-2 font-medium border border-[var(--bg-tertiary)]">(S, S)</td>
									<td class="p-2 text-center border border-[var(--bg-tertiary)]">{b}</td>
									<td class="p-2 text-center border border-[var(--bg-tertiary)]">{b}</td>
									<td class="p-2 text-center border border-[var(--bg-tertiary)]">{b}</td>
									<td class="p-2 text-center border border-[var(--bg-tertiary)]">{b}</td>
								</tr>
							</tbody>
						</table>
					</div>
					<p class="text-xs text-[var(--text-secondary)] mt-2">
						Rows: (skilled player's action, unskilled player's action). Columns: (vigilant casino's action, non-vigilant casino's action).
						Payoffs are weighted by type probabilities: w = {w.toFixed(2)}.
						When a vigilant casino observes a counter, the counter is caught (payoff = 0).
					</p>
				</div>
			</div>

			<!-- Results -->
			<div class="space-y-4">
				<div class="bg-[var(--bg-secondary)] rounded-xl p-6 border border-[var(--bg-tertiary)]">
					<h2 class="text-xl font-bold mb-4">Equilibrium Analysis</h2>

					<!-- w threshold bar -->
					<div class="mb-4">
						<div class="flex justify-between text-xs text-[var(--text-secondary)] mb-1">
							<span>w = 0</span>
							<span>F<sub>L</sub>/a<sub>H</sub> = {twoTypeResult.thresholdW.toFixed(3)}</span>
							<span>w = 1</span>
						</div>
						<div class="relative h-8 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
							<div
								class="absolute left-0 top-0 bottom-0 bg-green-800/60"
								style="width: {Math.min(twoTypeResult.thresholdW * 100, 100)}%"
							></div>
							<div
								class="absolute top-0 bottom-0 bg-purple-800/60"
								style="left: {Math.min(twoTypeResult.thresholdW * 100, 100)}%; right: 0"
							></div>
							<div
								class="absolute top-0 bottom-0 w-1 bg-white"
								style="left: {w * 100}%"
							></div>
						</div>
						<div class="flex justify-between text-xs mt-1">
							<span class="text-green-400">Pure [(C,S),(N,N)]</span>
							<span class="text-purple-400">No pure equilibrium</span>
						</div>
					</div>

					<!-- Constraint Check -->
					{#if !twoTypeResult.constraintsSatisfied}
						<div class="p-3 rounded-lg bg-red-900/30 border border-red-700 mb-4">
							<div class="text-sm font-bold text-[var(--accent-red)] mb-1">Constraint Violations</div>
							{#each twoTypeResult.constraintMessages as msg}
								<div class="text-xs text-red-300">- {msg}</div>
							{/each}
						</div>
					{/if}

					<!-- Result -->
					<div class="p-4 rounded-lg {twoTypeResult.type === 'pure' ? 'bg-green-900/30 border border-green-700' : 'bg-purple-900/30 border border-purple-700'}">
						<div class="text-lg font-bold mb-2">
							{twoTypeResult.type === 'pure' ? 'Pure Strategy Equilibrium' : twoTypeResult.type === 'mixed' ? 'No Pure Equilibrium' : 'Invalid Parameters'}
						</div>
						<p class="text-sm text-[var(--text-secondary)]">{twoTypeResult.description}</p>

						{#if twoTypeResult.pureStrategy}
							<div class="mt-3 grid grid-cols-2 gap-2 text-sm">
								<div class="p-2 rounded bg-[var(--bg-tertiary)]">
									<div class="text-xs text-[var(--text-secondary)]">Skilled Player</div>
									<div class="font-bold text-[var(--accent-green)]">{twoTypeResult.pureStrategy.skilledPlayer}</div>
								</div>
								<div class="p-2 rounded bg-[var(--bg-tertiary)]">
									<div class="text-xs text-[var(--text-secondary)]">Unskilled Player</div>
									<div class="font-bold">{twoTypeResult.pureStrategy.unskilledPlayer}</div>
								</div>
								<div class="p-2 rounded bg-[var(--bg-tertiary)]">
									<div class="text-xs text-[var(--text-secondary)]">Vigilant Casino</div>
									<div class="font-bold">{twoTypeResult.pureStrategy.vigilantCasino}</div>
								</div>
								<div class="p-2 rounded bg-[var(--bg-tertiary)]">
									<div class="text-xs text-[var(--text-secondary)]">Non-vigilant Casino</div>
									<div class="font-bold">{twoTypeResult.pureStrategy.nonVigilantCasino}</div>
								</div>
							</div>
						{/if}
					</div>
				</div>

				<!-- Key Insight -->
				<div class="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--bg-tertiary)]">
					<h3 class="font-semibold mb-3 text-sm uppercase tracking-wide text-[var(--text-secondary)]">Key Insight</h3>
					<p class="text-sm text-[var(--text-secondary)]">
						Card counting is sustainable as an equilibrium strategy when the casino believes
						the probability of facing a <strong class="text-white">skilled counter is low enough</strong>
						(w ≤ F<sub>L</sub>/a<sub>H</sub> = {twoTypeResult.thresholdW.toFixed(3)}).
						The unskilled player always prefers standard strategy (a<sub>L</sub> &lt; b),
						so the casino faces a <strong class="text-white">screening problem</strong>.
					</p>
				</div>

				<!-- Conditions -->
				<div class="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--bg-tertiary)]">
					<h3 class="font-semibold mb-3 text-sm uppercase tracking-wide text-[var(--text-secondary)]">Required Conditions</h3>
					<div class="space-y-1.5 text-sm">
						<div class="flex items-center gap-2">
							<span class="w-3 h-3 rounded-full {aL < b ? 'bg-[var(--accent-green)]' : 'bg-[var(--accent-red)]'}"></span>
							<span>a<sub>L</sub> &lt; b: {aL} &lt; {b}</span>
						</div>
						<div class="flex items-center gap-2">
							<span class="w-3 h-3 rounded-full {b < aH ? 'bg-[var(--accent-green)]' : 'bg-[var(--accent-red)]'}"></span>
							<span>b &lt; a<sub>H</sub>: {b} &lt; {aH}</span>
						</div>
						<div class="flex items-center gap-2">
							<span class="w-3 h-3 rounded-full {aL < FL ? 'bg-[var(--accent-green)]' : 'bg-[var(--accent-red)]'}"></span>
							<span>a<sub>L</sub> &lt; F<sub>L</sub>: {aL} &lt; {FL}</span>
						</div>
						<div class="flex items-center gap-2">
							<span class="w-3 h-3 rounded-full {FL < FH ? 'bg-[var(--accent-green)]' : 'bg-[var(--accent-red)]'}"></span>
							<span>F<sub>L</sub> &lt; F<sub>H</sub>: {FL} &lt; {FH}</span>
						</div>
						<div class="flex items-center gap-2">
							<span class="w-3 h-3 rounded-full {FL < aH ? 'bg-[var(--accent-green)]' : 'bg-[var(--accent-red)]'}"></span>
							<span>F<sub>L</sub> &lt; a<sub>H</sub>: {FL} &lt; {aH}</span>
						</div>
						<div class="flex items-center gap-2">
							<span class="w-3 h-3 rounded-full {aH < FH ? 'bg-[var(--accent-green)]' : 'bg-[var(--accent-red)]'}"></span>
							<span>a<sub>H</sub> &lt; F<sub>H</sub>: {aH} &lt; {FH}</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>
