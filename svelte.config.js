import adapter from '@sveltejs/adapter-node';
import sveltePreprocess from "svelte-preprocess";

export default{
  // consult https://github.com/sveltejs/svelte-preprocess for more information about preprocessors
  preprocess: [
    sveltePreprocess({
      typescript: true,
      postcss: true,
    }),
  ],
  kit: {
    adapter: adapter()
  }
  
};