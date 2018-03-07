export interface Datasource {
    id: string;
    name: string;
    active: boolean;
    type: 'elasticsearch' | 'splunk' | 'blockchain' | 'live';
}