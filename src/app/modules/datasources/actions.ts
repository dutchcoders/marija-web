import { DATASOURCE_ACTIVATED, DATASOURCE_DEACTIVATED } from './index'
import {getFields} from "../fields/actions";
import {Datasource} from "../../interfaces/datasource";

function datasourceActivated(datasource: Datasource) {
    return {
        type: DATASOURCE_ACTIVATED,
        payload: {
            datasource: datasource
        }
    };
}

export function activateDatasource(datasource: Datasource) {
    return (dispatch, getState) => {
        dispatch(datasourceActivated(datasource));

        // Get the updated datasources
        const datasources = getState()
            .datasources
            .datasources
            .filter(datasource => datasource.active);

        // Update the fields based on the new datasources
        dispatch(getFields(datasources));
    };
}

function datasourceDeactivated(datasource) {
    return {
        type: DATASOURCE_DEACTIVATED,
        payload: {
            datasource: datasource
        }
    };
}

export function deActivateDatasource(datasource: Datasource) {
    return (dispatch, getState) => {
        dispatch(datasourceDeactivated(datasource));

        // Get the updated datasources
        const datasources = getState().datasources.datasources;

        // Update the fields based on the new datasources
        dispatch(getFields(datasources));
    };
}