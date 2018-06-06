const webpack = require('webpack');
const path = require('path');
const dotenv = require('dotenv');
const { gitDescribeSync } = require('git-describe');
const HtmlWebpackPlugin = require('html-webpack-plugin');

dotenv.config();

const gitInfo = gitDescribeSync();
const SRC_DIR = path.resolve(__dirname, 'src');

module.exports = {
    entry: {
        app: SRC_DIR + '/demo/index.tsx'
    },
    plugins: [
        new webpack.DefinePlugin({
            "process.env": { 
                NODE_ENV: JSON.stringify(process.env.NODE_ENV || "development"),
                WEBSOCKET_URI: process.env.WEBSOCKET_URI ? JSON.stringify(process.env.WEBSOCKET_URI) : null,
                CLIENT_VERSION: JSON.stringify(gitInfo.raw),
                MOCK_SERVER: JSON.stringify(process.env.MOCK_SERVER)
            }
        }),
        new HtmlWebpackPlugin({
            template: 'src/index.html',
            inject: true
        })
    ],
    resolve: {
        extensions: ['.js', '.ts', '.tsx', '.scss', '.css']
    },
    module: {
        rules: [
            {
                test: /\.worker\.ts$/,
                use: [
                    {
                        loader: 'worker-loader',
                        options: {
                            inline: true
                        }
                    }
                ]
            },
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
                // Css files in src/app/ are modular (module: true in the css-loader config)
                // This means that the class names are prefixed and suffixed with a hash to make them scoped
                test: /\.(scss|css)$/,
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
                        loader: 'sass-loader'
                    }
                ]
            },
            {
                // Css files that are not in src/app/ are not modular, so the css classes not prefixed or suffixed
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
                test: /\.(png|jpg|jpeg)$/,
                loader: 'url-loader',
                options: {
                    name: 'images/[name].[ext]',
                    limit: 9999999
                }
            },
            {
                test: /\.(woff|woff2|eot|ttf|svg)$/,
                loader: 'url-loader',
                options: {
                    limit: 9999999
                }
            }
        ]
    },
    node: {
        fs: 'empty',
        child_process: 'empty'
    },
	optimization: {
		splitChunks: {
			cacheGroups: {
				commons: { test: /[\\/]node_modules[\\/]/, name: "vendors", chunks: "all" }
			}
		}
	},
};

