import * as React from 'react';
import {render} from "react-dom";
import {Marija} from '../app';
import * as Raven from 'raven-js';

if (process.env.NODE_ENV === 'production') {
	Raven
		.config('https://0a30ff2e22b74bd2b3456534d4b3cf33@sentry.io/1250319', {
			tags: {
				clientVersion: process.env.CLIENT_VERSION,
				lastCommitDate: process.env.LAST_COMMIT_DATE
			},
		})
		.install();
}

function getUrl(): string {
	let url;

	if (process.env.WEBSOCKET_URI) {
		url = process.env.WEBSOCKET_URI;
	} else {
		const {location} = window;
		url = ((location.protocol === "https:") ? "wss://" : "ws://") + location.host + "/ws";
	}

	return url;
}

Raven.context(function () {
	render((
		<Marija backendUri={getUrl()} />
	), document.getElementById('root'));
});