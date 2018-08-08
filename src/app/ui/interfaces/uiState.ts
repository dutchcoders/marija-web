import {PaneInterface} from "./paneInterface";
import { WorkspaceDescription } from './workspace';

export interface PaneCollection {
	[name: string]: PaneInterface
}

export type Language = 'en' | 'nl';

export interface UiState {
    workspaceDescriptions: WorkspaceDescription[];
    workspaceId: string;
    panes: PaneCollection;
    lightboxImageUrl: string | null;
    experimentalFeatures: boolean;
    reducerError: any;
    reducerErrorLastAction: any;
    lang: Language;
    isRequestingWorkspace: boolean;
}