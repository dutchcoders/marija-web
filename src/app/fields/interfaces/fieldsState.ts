import {Field} from "./field";
import {DefaultConfigs} from "../../datasources/interfaces/defaultConfigs";

export interface FieldsState {
    availableFields: Field[];
    fieldsFetching: boolean;
    defaultConfigs: DefaultConfigs;
}