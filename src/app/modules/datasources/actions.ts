import { DATASOURCE_ACTIVATED, DATASOURCE_DEACTIVATED } from './index'
import {getFields, clearFields} from "../fields/actions";
import {Datasource} from "../../interfaces/datasource";
import {deleteSearch} from "../search/actions";

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