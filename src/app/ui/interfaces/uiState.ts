import {PaneInterface} from "./paneInterface";

export interface PaneCollection {
	[name: string]: PaneInterface
}

export interface UiState {
    workspaceId: string;
    panes: PaneCollection;
    lightboxImageUrl: string | null;
    experimentalFeatures: boolean;
    reducerError: any;
    reducerErrorState: any;
    reducerErrorLastAction: any;
}