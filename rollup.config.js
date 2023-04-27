// rollup.config.js
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import babel from '@rollup/plugin-babel';
import terser from '@rollup/plugin-terser';
import css from 'rollup-plugin-css-only'
import gzipPlugin from 'rollup-plugin-gzip'
import image from '@rollup/plugin-image';

const isProduction = process.env.NODE_ENV === 'production';

// eslint-disable-next-line import/no-anonymous-default-export
export default {
  input: 'src/lib/index.js',
	output: {
    dir: 'dist',
		format: 'es'
	},
  plugins: [
    /* Automatically exclude peer-deps from the bundle.
     * We want all deps to be peer-deps - none should be in the bundle
     * https://www.npmjs.com/package/rollup-plugin-peer-deps-external */
    peerDepsExternal(),
    babel({ babelHelpers: 'bundled' }),
    image(), // inlines images (as base64)
    css({output: 'index.css'}),
    isProduction && terser(),
    gzipPlugin(),
  ]
};