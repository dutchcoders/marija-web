var path = require('path');
var webpack = require('webpack');
var ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = {
    entry: './src/app/main.js',
    target: 'web',
    plugins: [
        new ExtractTextPlugin('../dist/app.css'),
    ],
    resolve: {
        modulesDirectories: ['node_modules']
    },
    output: {
        path: [__dirname, 'dist'].join(path.sep),
        filename: 'bundle.js'
    },
    module: {
        loaders: [
            {
                test: /.js?$/,
                loader: 'babel-loader',
                exclude: /node_modules/,
                query: {
                    presets: ['es2015', 'stage-1', 'react'],
                }
            },
            {
                test: /\.scss$/,
                loader: ExtractTextPlugin.extract('style-loader', 'css-loader?sourceMap!sass-loader?outputStyle=expanded&sourceMap=true&sourceMapContents=true')
            },
            {
                test: /\.(html)$/i,
                loader: "file-loader?name=/[name].[ext]"
            }
        ]
    }
};

