import { OPEN_PANE, CLOSE_PANE } from '../utils/index'

const defaultState = [
    "http://127.0.0.1:9200/"
];


export default function servers(state = defaultState, action) {
    switch (action.type) {
        default:
            return state;
    }
}