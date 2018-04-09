    import { DATASOURCE_ACTIVATED, DATASOURCE_DEACTIVATED } from './index'

export function datasourceActivated(datasourceId: string) {
    return {
        type: DATASOURCE_ACTIVATED,
        payload: {
            datasourceId: datasourceId
        }
    };
}

export function datasourceDeactivated(datasourceId: string) {
    return {
        type: DATASOURCE_DEACTIVATED,
        payload: {
            datasourceId: datasourceId
        }
    };
}