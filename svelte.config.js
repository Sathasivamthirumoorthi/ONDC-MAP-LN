import adapter from '@sveltejs/adapter-netlify';
import adapter from '@sveltejs/adapter-node';

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
		adapter: adapter({
			// if true, will create a Netlify Edge Function rather
			// than using standard Node-based functions
			edge: false,

			// if true, will split your app into multiple functions
			// instead of creating a single one for the entire app.
			// if `edge` is true, this option cannot be used
			split: false
		})
	}
  
};