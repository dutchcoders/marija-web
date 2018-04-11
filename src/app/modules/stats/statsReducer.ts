import {SET_FPS} from "./statsConstants";
import {INITIAL_STATE_RECEIVE} from "../datasources/datasourcesConstants";

export interface StatsState {
   fps: number;
   serverVersion: string;
}

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