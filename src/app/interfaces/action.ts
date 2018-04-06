interface ActionMeta {
    receivedAt: number;
    WebWorker?: true;
}

export interface Action {
    type: string;
    payload: any;
    meta: ActionMeta;
}