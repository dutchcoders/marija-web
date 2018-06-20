import {PaneInterface} from "./paneInterface";

export interface UiState {
    panes: {
        [name: string]: PaneInterface
    },
    lightboxImageUrl: string | null;
}