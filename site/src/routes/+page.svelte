<script lang="ts">
  import { resolve } from '$app/paths';
  import CopyBox from '#lib/CopyBox.svelte';
  import { REPO } from '#lib/links.ts';
  import { catalog } from '#lib/parsons.ts';

  const parts = [
    ['Contract', 'COMPONENT.md: when to use it, the data format, the rules, how to install, the API, pitfalls.'],
    ['Core', 'TypeScript without dependencies or DOM: the logic, fully tested.'],
    ['UI', 'Svelte 5 components, plus a custom element for pages without a build.'],
    ['Conformance', 'Language-neutral test cases. Any port must pass them.'],
    ['Porting guide', 'The algorithms in pseudocode, for Java and other platforms.'],
    ['Skill', 'Instructions so agents can also write the content (e.g. puzzle files).'],
  ];
</script>

<svelte:head>
  <title>component_lib</title>
  <meta name="description" content="Reusable components for agents to copy into projects, with live demos for people." />
</svelte:head>

<section class="hero">
  <h1>Components for agents to copy, and for people to try.</h1>
  <p class="lead">
    Tools I reuse across projects, written down once: data format, rules, tested code, test cases and the
    lessons from earlier projects. An agent copies a component into a project and adapts it. Nothing is
    installed as a package.
  </p>
</section>

<h2>Use one with an agent</h2>
<p>Tell your agent which component and variant you want. It finds the rest in the repository.</p>
<CopyBox text="Add the parsons component from github.com/mfreimueller/component_lib to this project (line variant)." />

<h2>Components</h2>
<div class="cards">
  {#each catalog.components as c (c.name)}
    <a class="card panel" href={resolve('/components/parsons')}>
      <div class="head">
        <h3>{c.title}</h3>
        <span class="muted">{c.name}@{c.version}</span>
      </div>
      <p>{c.summary}</p>
      <ul class="chips">
        {#each c.variants as v (v.id)}<li>{v.id}</li>{/each}
        {#if c.embed}<li>embed</li>{/if}
      </ul>
    </a>
  {/each}
</div>

<h2>What every component has</h2>
<div class="parts">
  {#each parts as [name, text] (name)}
    <div class="panel">
      <h3>{name}</h3>
      <p class="muted">{text}</p>
    </div>
  {/each}
</div>

<h2>For agents</h2>
<p>
  Start at <a href="{REPO}/blob/main/AGENTS.md">AGENTS.md</a>. The index is
  <a href="{REPO}/blob/main/catalog.json">catalog.json</a> (also as <a href="{REPO}/blob/main/llms.txt">llms.txt</a>).
</p>

<style>
  .hero {
    padding: 56px 0 8px;
  }
  .hero h1 {
    max-width: 22ch;
    margin: 0 0 16px;
    font-size: clamp(30px, 5vw, 44px);
  }
  .cards,
  .parts {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
  }
  .card {
    display: flex;
    flex-direction: column;
    gap: 6px;
    color: inherit;
    text-decoration: none;
  }
  .card:hover {
    border-color: var(--pz-primary);
  }
  .card .head {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;
  }
  .card h3,
  .parts h3 {
    margin: 0;
  }
  .parts p {
    margin: 6px 0 0;
    font-size: 15px;
  }
</style>
