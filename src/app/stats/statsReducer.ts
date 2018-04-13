import {INITIAL_STATE_RECEIVE} from '../datasources/datasourcesConstants';
import {SET_FPS} from './statsConstants';
import {StatsState} from "./interfaces/statsState";

export const defaultStatsState: StatsState = {
    fps: 0,
    serverVersion: ''
};

export default function statsReducer(state: StatsState = defaultStatsState, action): StatsState {
    switch (action.type) {
        case INITIAL_STATE_RECEIVE: {
            return {
                ...state,
                serverVersion: action.initial_state.version
            }
        }

        case SET_FPS: {
            return {
                ...state,
                fps: action.payload.fps
            };
        }

        default: {
            return state;
        }
    }
}