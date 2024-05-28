<script lang="ts">
  import { link } from "svelte-spa-router";
  import { examples } from "./router";
  import AppSidebar from "./components/AppSidebar.svelte";
</script>

<AppSidebar noHeader>
  <span slot="title">Features</span>

  <ul>
    {#each examples.sort((a, b) => a.index - b.index) as example}
      <li>
        <a href={example.path} use:link>{example.name}</a>
      </li>
    {/each}
  </ul>
</AppSidebar>

<div class="basis-full lg:basis-2/3 overflow-hidden rounded-3xl shadow-xl">
  <div
    class="p-5 lg:p-10 h-full flex flex-col gap-5 lg:gap-10 justify-start lg:justify-center items-center flex-col bg-inherit overflow-x-hidden overflow-y-auto"
  >
    <h1 class="text-center max-w-3xl">ONDC MAPS</h1>

  </div>
</div>

<style lang="postcss">
  ::-webkit-scrollbar {
    width: 10px;
    @apply bg-transparent;
  }

  ::-webkit-scrollbar-thumb {
    @apply bg-slate-600 hover:bg-slate-500 rounded-md border-2 border-amber-50;
  }
</style>
