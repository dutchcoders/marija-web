import { EXPORT_DATA, IMPORT_DATA } from './mainConstants';

export function importData(data) {
    return {
        type: IMPORT_DATA,
        payload: data
    };
}

export function exportData() {
    return {
        type: EXPORT_DATA
    };
}