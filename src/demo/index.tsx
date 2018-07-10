import * as React from 'react';
import {render} from "react-dom";
import {Marija} from '../app';

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

render((
    <Marija backendUri={getUrl()} />
), document.getElementById('root'));