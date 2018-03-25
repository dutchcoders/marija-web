import { DATASOURCE_ACTIVATED, DATASOURCE_DEACTIVATED } from './index'
import {Datasource} from "../../interfaces/datasource";

export function datasourceActivated(datasource: Datasource) {
    return {
        type: DATASOURCE_ACTIVATED,
        payload: {
            datasource: datasource
        }
    };
}

export function datasourceDeactivated(datasource) {
    return {
        type: DATASOURCE_DEACTIVATED,
        payload: {
            datasource: datasource
        }
    };
}