import adapter from '@sveltejs/adapter-vercel';
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
		// default options are shown
		adapter: adapter()
	}
  
};