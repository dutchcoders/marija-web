import {PaneInterface} from "./paneInterface";

export interface PaneCollection {
	[name: string]: PaneInterface
}

export interface UiState {
    workspaceId: string;
    panes: PaneCollection;
    lightboxImageUrl: string | null;
}