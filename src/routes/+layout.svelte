<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Cardiac Cascade Simulator</title>
	<meta name="description" content="Interactive educational simulator for cardiac pathophysiology" />
</svelte:head>

{@render children()}
