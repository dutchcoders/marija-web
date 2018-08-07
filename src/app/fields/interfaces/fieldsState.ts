import {Field} from "./field";
import {DefaultConfigs} from "../../datasources/interfaces/defaultConfigs";
import { Connector } from '../../graph/interfaces/connector';

export interface FieldsState {
    availableFields: Field[];
    fieldsFetching: boolean;
    defaultConfigs: DefaultConfigs;
    connectors: Connector[];
    suggestedConnectors: Connector[];
    // These fields won't be automatically used again in connectors
    deletedConnectorFields: string[];
	expectedGraphWorkerOutputId: string;
}