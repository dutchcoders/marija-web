const webpack = require('webpack');
const path = require('path');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const dotenv = require('dotenv');
const { gitDescribeSync } = require('git-describe');

dotenv.config();

const gitInfo = gitDescribeSync();

const BUILD_DIR = path.resolve(__dirname, 'build');
const SRC_DIR = path.resolve(__dirname, 'src');

module.exports = {
    entry: {
        index: [SRC_DIR + '/app/main.js']
    },
    target: 'web',
    output: {
        path: BUILD_DIR,
        filename: 'bundle.js'
    },
    devtool: 'source-map',
    plugins: [
        new ExtractTextPlugin('../dist/app.css'),
        new webpack.DefinePlugin({
            "process.env": { 
                NODE_ENV: JSON.stringify(process.env.NODE_ENV || "development"),
                WEBSOCKET_URI: process.env.WEBSOCKET_URI ? JSON.stringify(process.env.WEBSOCKET_URI) : null,
                CLIENT_VERSION: JSON.stringify(gitInfo.raw)
            }
        })
    ],
    resolve: {
        // modules: ['node_modules', 'src'],
        extensions: ['.js', '.scss', '.ts']
    },
    module: {
        rules: [
            {
                test: /\.(tsx|js)$/,
                loader: 'awesome-typescript-loader',
                include: [path.join(__dirname, "src")]
            },
            {
                enforce: "pre",
                test: /\.js$/,
                loader: "source-map-loader"
            },
            {
                test: /\.(scss|css)$/,
                loaders: ['style-loader','css-loader','sass-loader']
            },
            {
                test: /\.(html)$/i,
                loader: 'file-loader?name=/[name].[ext]'
            },
            {
                test: /\.(eot|svg|ttf|woff|woff2)([\?]?.*)$/,
                loader: 'file-loader?name=fonts/[name].[ext]'
            },
            {
                test: /\.(png|jpg|jpeg)$/,
                loader: 'file-loader?name=images/[name].[ext]'
            }
        ]
    },
    node: {
        fs: 'empty',
        child_process: 'empty'
    },
};

