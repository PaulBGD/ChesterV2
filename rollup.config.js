import json from 'rollup-plugin-json';
import replace from 'rollup-plugin-replace';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import buble from 'rollup-plugin-buble';
import uglify from 'rollup-plugin-uglify';

export default {
    external: require('builtin-modules/static').concat([ 'discord.js' ]),

    entry: 'index.js',
    dest: 'dist/bundle.js',
    sourceMap: true,
    format: 'cjs',

    plugins: [
        replace({
            ',"":null': ''
        }),
        json({
            include: ['node_modules/**/*.json']
        }),
        resolve({
            main: true,
            jsnext: true,
            preferBuiltins: true,
        }),
        commonjs({
            exclude: ['node_modules/node-brain/**']
        }),
        buble({
            include: ['node_modules/node-brain/**'],
            exclude: ['node_modules/**']
        }),
        process.env.NODE_ENV === 'production' && uglify({
            toplevel: true
        })
    ].filter(Boolean)
}