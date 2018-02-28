import { DATASOURCE_ACTIVATED, DATASOURCE_DEACTIVATED } from './index'
import {getFields} from "../fields/actions";

function datasourceActivated(datasource: string) {
    return {
        type: DATASOURCE_ACTIVATED,
        payload: {
            datasource: datasource
        }
    };
}

export function activateDatasource(index: string) {
    return (dispatch, getState) => {
        dispatch(datasourceActivated(index));

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

export function deActivateDatasource(index) {
    return (dispatch, getState) => {
        dispatch(datasourceDeactivated(index));

        // Get the updated datasources
        const datasources = getState().datasources.datasources;

        // Update the fields based on the new datasources
        dispatch(getFields(datasources));
    };
}