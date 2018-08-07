import { Item } from '../../graph/interfaces/item';

export interface Datasource {
    id: string;
    name: string;
    active: boolean;
    type: 'elasticsearch' | 'splunk' | 'blockchain' | 'live' | 'twitter' | 'csv';
    isCustom: boolean;
    imageFieldPath?: string;
    locationFieldPath?: string;
    labelFieldPath?: string;
    dateFieldPath?: string;
    chooseFieldsAutomatically: boolean;
    icon?: string;

    // Only relevant for custom datasources
    items?: Item[];
}