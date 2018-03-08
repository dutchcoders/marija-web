const baseConfig = require('./webpack-common');
const path = require('path');
const merge = require('webpack-merge');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const webpack = require('webpack');
const { gitDescribeSync } = require('git-describe');
const gitInfo = gitDescribeSync();

module.exports = merge(baseConfig, {
    output: {
        path: [__dirname, 'dist'].join(path.sep),
        filename: '[name].[hash].js'
    },
    plugins: [
        new webpack.DefinePlugin({
            "process.env": {
                NODE_ENV: JSON.stringify("production"),
                WEBSOCKET_URI: null,
                CLIENT_VERSION: JSON.stringify(gitInfo.raw)
            }
        }),
        new UglifyJSPlugin(),
    ]
});