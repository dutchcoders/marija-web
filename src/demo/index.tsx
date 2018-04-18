import * as React from 'react';
import {render} from "react-dom";
import {Marija} from '../app';

render((
    <Marija backendUri={process.env.WEBSOCKET_URI} />
), document.getElementById('root'));