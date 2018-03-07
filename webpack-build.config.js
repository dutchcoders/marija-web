const baseConfig = require('./webpack.common.config');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = Object.assign(baseConfig, {
    output: {
        path: [__dirname, 'dist'].join(path.sep),
        filename: 'bundle.js'
    },
    plugins: baseConfig.plugins.concat([
        new HtmlWebpackPlugin()
    ])
});