import {SET_FPS} from "./statsConstants";

export function setFps(fps: number) {
    return {
        type: SET_FPS,
        payload: {
            fps: fps
        }
    };
}