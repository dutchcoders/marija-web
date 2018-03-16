import {Field} from "./field";
import {Via} from "./via";

export interface DefaultConfigs {
    [datasource: string]: {
        fields: Field[];
        via: Via[]
    }
}