import {PaneInterface} from "./paneInterface";

export interface PaneCollection {
	[name: string]: PaneInterface
}

export type Language = 'en' | 'nl';

export interface UiState {
    workspaceId: string;
    panes: PaneCollection;
    lightboxImageUrl: string | null;
    experimentalFeatures: boolean;
    reducerError: any;
    reducerErrorLastAction: any;
    lang: Language
}