const baseConfig = require('./webpack_common');
const path = require('path');
const merge = require('webpack-merge');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const webpack = require('webpack');
const { gitDescribeSync } = require('git-describe');
const { execSync } = require('child_process');

const gitInfo = gitDescribeSync();
const lastCommitDate = execSync('git show -s --format=%ci ' + gitInfo.hash).toString();

module.exports = merge(baseConfig, {
    output: {
        path: [__dirname, 'dist'].join(path.sep),
        filename: '[name].[hash].js'
    },
    target: 'web',
    plugins: [
        new webpack.DefinePlugin({
            "process.env": {
				NODE_ENV: JSON.stringify("production"),
				WEBSOCKET_URI: process.env.WEBSOCKET_URI ? JSON.stringify(process.env.WEBSOCKET_URI) : null,
				CLIENT_VERSION: JSON.stringify(gitInfo.raw),
				LAST_COMMIT_DATE: JSON.stringify(lastCommitDate)
            }
        }),
        new UglifyJSPlugin(),
    ],
    mode: 'production'
});