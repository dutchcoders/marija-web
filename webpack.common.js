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
        extensions: ['.js', '.scss', '.ts', '.tsx', '.css']
    },
    module: {
        rules: [
            {
                test: /\.(tsx|ts|js)$/,
                loader: 'awesome-typescript-loader',
                include: [path.join(__dirname, "src")]
            },
            {
                enforce: "pre",
                test: /\.js$/,
                loader: "source-map-loader"
            },
            {
                test: /\.(png|woff|woff2|eot|ttf|svg)$/,
                loader: 'url-loader?limit=100000'
            },
            {
                // Css files in src/app/ are loaded with postcss.
                // This is the new standard and takes preference over css files
                // in src/css/ or src/scss/
                test: /\.css$/,
                exclude: [
                    path.join(__dirname, 'src', 'css'),
                    path.join(__dirname, 'src', 'scss'),
                ],
                use: [
                    {
                        loader: 'style-loader',
                    },
                    {
                        loader: 'css-loader',
                        options: {
                            modules: true,
                            localIdentName: '[name]__[local]--[hash:base64:5]'
                        }
                    },
                    {
                        loader: 'postcss-loader'
                    }
                ]
            },
            {
                // Other css files are loaded with the sass loader etc.
                test: /\.(scss|css)$/,
                exclude: [
                    path.join(__dirname, 'src', 'app')
                ],
                use: [
                    {
                        loader: 'style-loader',
                    },
                    {
                        loader: 'css-loader',
                        options: {
                            importLoaders: 1,
                        }
                    },
                    {
                        loader: 'sass-loader'
                    }
                ]
            },
            {
                test: /\.(html)$/i,
                loader: 'file-loader?name=/[name].[ext]'
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

