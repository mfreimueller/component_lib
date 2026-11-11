<script lang="ts">
  import '../../../components/parsons/svelte/theme.css';
  import '#lib/site.css';
  import { asset, resolve } from '$app/paths';
  import { REPO } from '#lib/links.ts';

  let { children } = $props();
</script>

<header class="top">
  <div class="inner">
    <a class="brand" href={resolve('/')}>component_lib</a>
    <nav aria-label="Main">
      <a href={resolve('/components/parsons')}>Parsons puzzle</a>
      <a href={asset('demos/reveal/index.html')}>Reveal.js demo</a>
      <a href={REPO}>GitHub</a>
    </nav>
  </div>
</header>

<main class="page">
  {@render children()}
</main>

<footer class="bottom">
  <div class="inner muted">
    Components for agents to copy into projects, with this page for people.
    Agents start at <a href="{REPO}/blob/main/AGENTS.md">AGENTS.md</a>.
  </div>
</footer>

<style>
  .top {
    border-bottom: 1px solid var(--pz-border);
    background: var(--pz-surface);
  }
  .inner {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    max-width: var(--page-width);
    margin: 0 auto;
    padding: 14px 20px;
  }
  .brand {
    color: var(--pz-text);
    font: 700 17px var(--pz-font-mono);
    text-decoration: none;
  }
  nav {
    display: flex;
    flex-wrap: wrap;
    gap: 18px;
    font-size: 15px;
  }
  nav a {
    color: var(--pz-text);
    text-decoration: none;
  }
  nav a:hover {
    color: var(--pz-primary);
  }
  .bottom {
    border-top: 1px solid var(--pz-border);
    font-size: 14px;
  }
</style>
