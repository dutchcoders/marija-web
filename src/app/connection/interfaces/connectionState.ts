export interface ErrorList {
	[requestId: string]: string;
}

export interface ConnectionState {
    backendUri: string;
    requestErrors: ErrorList;
    genericErrors: string;
    connected: boolean;
}