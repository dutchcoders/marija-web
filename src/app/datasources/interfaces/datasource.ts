export interface Datasource {
    id: string;
    name: string;
    active: boolean;
    type: 'elasticsearch' | 'splunk' | 'blockchain' | 'live' | 'twitter';
    imageFieldPath?: string;
    locationFieldPath?: string;
    labelFieldPath?: string;
    icon?: string;
}