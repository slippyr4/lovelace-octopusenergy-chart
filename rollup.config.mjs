import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import serve from 'rollup-plugin-serve';
import livereload from 'rollup-plugin-livereload';


const isDev = process.env.ROLLUP_WATCH === 'true';


export default {
  input: 'src/octopusenergy-chart.ts',
  output: {
    file: 'dist/octopusenergy-chart.js',
    format: 'es',
    sourcemap: false
  },
  plugins: [
    resolve({
      exportConditions: ['default'], // Needed for better Node-style resolution in Rollup 4
    }),
    typescript({ tsconfig: './tsconfig.json', declaration: false }),
    isDev && serve({
      contentBase: 'dist',
      port: 5001,
      allowCrossOrigin: true,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    }),
    isDev && livereload({
      watch: 'public',
      clientUrl:  'http://localhost:35729/livereload.js?snipver=1'
    }),
  ],
  watch: {
    clearScreen: false,
  },
};