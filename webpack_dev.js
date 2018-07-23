const webpack = require('webpack');

const { gitDescribeSync } = require('git-describe');
const gitInfo = gitDescribeSync();

const merge = require('webpack-merge');
const common = require('./webpack_common.js');
const { execSync } = require('child_process');
const lastCommitDate = execSync('git show -s --format=%ci ' + gitInfo.hash).toString();

module.exports = merge(common, {
    devtool: 'eval-cheap-module-source-map',
    target: 'web',
    plugins: [
		new webpack.DefinePlugin({
			"process.env": {
				NODE_ENV: JSON.stringify(process.env.NODE_ENV || "development"),
				WEBSOCKET_URI: process.env.WEBSOCKET_URI ? JSON.stringify(process.env.WEBSOCKET_URI) : null,
				CLIENT_VERSION: JSON.stringify(gitInfo.raw),
				LAST_COMMIT_DATE: JSON.stringify(lastCommitDate),
				MOCK_SERVER: JSON.stringify(process.env.MOCK_SERVER),
				MEASURE_PERFORMANCE: JSON.stringify(process.env.MEASURE_PERFORMANCE),
			}
		})
    ],
    devServer: {
        publicPath: "/",
        contentBase: "./src",
		historyApiFallback: {
			disableDotRule: true,
		}
    },
    mode: 'development'
});
