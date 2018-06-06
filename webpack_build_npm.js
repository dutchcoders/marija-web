const webpack = require('webpack');
const path = require('path');
const dotenv = require('dotenv');
const { gitDescribeSync } = require('git-describe');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const commonConfig = require('./webpack_common');

dotenv.config();
const gitInfo = gitDescribeSync();
const SRC_DIR = path.resolve(__dirname, 'src');

module.exports = Object.assign(commonConfig, {
    entry: {
        index: SRC_DIR + '/app/index.ts'
    },
    output: {
        path: [__dirname, 'dist_npm'].join(path.sep),
        filename: 'index.js',
        libraryTarget: 'commonjs2',
        library: 'Marija'
    },
    plugins: [
        new webpack.DefinePlugin({
            "process.env": {
                WEBSOCKET_URI: process.env.WEBSOCKET_URI ? JSON.stringify(process.env.WEBSOCKET_URI) : null,
                CLIENT_VERSION: JSON.stringify(gitInfo.raw)
            }
        })
    ],
    externals: {
        react: 'commonjs react'
    },
	mode: 'production'
});
