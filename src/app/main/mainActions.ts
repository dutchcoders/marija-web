import {EXPORT_DATA} from "./mainConstants";
import {IMPORT_DATA} from "./mainConstants";

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