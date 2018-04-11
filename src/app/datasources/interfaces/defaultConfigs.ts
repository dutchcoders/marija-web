import { Field } from '../../fields/interfaces/field';
import { Via } from '../../graph/interfaces/via';

export interface DefaultConfigs {
    [datasource: string]: {
        fields: Field[];
        via: Via[]
    }
}