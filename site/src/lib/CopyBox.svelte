<!-- A block of text (a prompt or a snippet) with a copy button. -->
<script lang="ts">
  let { text, label = 'Copy' }: { text: string; label?: string } = $props();
  let copied = $state(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      copied = true;
      setTimeout(() => (copied = false), 1500);
    } catch {
      copied = false;
    }
  }
</script>

<div class="copybox">
  <pre><code>{text}</code></pre>
  <button type="button" onclick={copy} aria-live="polite">{copied ? 'Copied' : label}</button>
</div>

<style>
  .copybox {
    position: relative;
  }
  pre {
    margin: 0;
    padding: 14px 16px;
    padding-right: 84px;
    border: 1px solid var(--pz-border);
    border-radius: var(--pz-radius);
    background: var(--code-bg);
    color: var(--code-text);
    font: 13px/1.55 var(--pz-font-mono);
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }
  button {
    position: absolute;
    top: 8px;
    right: 8px;
    min-height: 32px;
    padding: 0 12px;
    font-size: 12px;
  }
</style>
