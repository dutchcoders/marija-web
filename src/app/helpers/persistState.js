import { concat, merge } from 'lodash';
import { Workspaces, Migrations } from '../domain/index.js';

export default function persistState() {
    return (next) => (reducer, initialState, enhancer) => {

        initialState = Workspaces.loadCurrentWorkspace(initialState)
        return next(reducer, initialState, enhancer);
    };
}
