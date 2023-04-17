import { babel } from '@rollup/plugin-babel';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default {
    input: 'src/index.ts',
    output: {
        file: 'dist/bundle.js',
        format: 'es'
    },
    plugins: [resolve(), commonjs(), babel({ babelHelpers: 'bundled' })],
    external: ['react', 'react-dom']
};
