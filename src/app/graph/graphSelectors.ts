import { createSelector } from 'reselect';
import {Node} from "./interfaces/node";
import {Link} from "./interfaces/link";
import {AppState} from "../main/interfaces/appState";
import { TimelineGrouping } from './interfaces/graphState';
import { Item } from '../items/interfaces/item';
import { Moment, unitOfTime } from 'moment';
import { find, map, groupBy, reduce, forEach, filter, concat } from 'lodash';
import fieldLocator from '../fields/helpers/fieldLocator';
import { Field } from '../fields/interfaces/field';
import * as moment from 'moment';
import { Datasource } from '../datasources/interfaces/datasource';


export const getNodesForDisplay = createSelector(
    (state: AppState) => state.graph.nodes,
    (nodes: Node[]) => nodes.filter(node =>
		node.display
		&& (!node.normalizationId || node.isNormalizationParent)
	)
);

export const getLinksForDisplay = createSelector(
    (state: AppState) => state.graph.links,
    (links: Link[]) => links.filter(link =>
		link.display
		&& (!link.normalizationIds.length || link.isNormalizationParent)
	)
);

export const getSelectedNodes = createSelector(
    (state: AppState) => state.graph.nodes,
    (nodes: Node[]) => nodes.filter(node => node.selected)
);

export const getHighlightedNodes = createSelector(
    (state: AppState) => state.graph.nodes,
    (nodes: Node[]) => nodes.filter(node => node.highlighted)
);

export const isMapAvailable = createSelector(
    (state: AppState) => state.graph.nodes,
    (nodes: Node[]): boolean => typeof nodes.find(node => node.isGeoLocation) !== 'undefined'
);

export interface TimelineGroups {
	groups: {
		[groupName: string]: Node[];
	};
	periods: string[];
}

const getDate = (node: Node, items: Item[], dateFields: Field[]): Moment | undefined => {
	/**
	 * Don't use forEach, because we want to be able to break out of the
	 * loops as soon as we find a date.
	 */
	for (let i = 0; i < node.items.length; i ++) {
		const item: Item = items.find(search => search.id === node.items[i]);

		for (let j = 0; j < dateFields.length; j ++) {
			const date: any = fieldLocator(item.fields, dateFields[j].path);

			if (date) {
				return moment(date);
			}
		}
	}
};

export const getSelectedDateFields = createSelector(
	(state: AppState) => state.datasources.datasources,
	(state: AppState) => state.fields.availableFields,

	(datasources: Datasource[], fields: Field[]): Field[] => {
		const paths: string[] = [];

		datasources.forEach(datasource => {
			if (datasource.dateFieldPath) {
				paths.push(datasource.dateFieldPath);
			}
		});

		return fields.filter(field =>
			paths.indexOf(field.path) !== -1
		);
	}
);

export const getTimelineGroups = createSelector(
    (state: AppState) => state.graph.timelineGrouping,
    (state: AppState) => state.graph.nodes,
    (state: AppState) => state.graph.items,
	(state: AppState) => getSelectedDateFields(state),

    (timelineGrouping: TimelineGrouping, nodes: Node[], items: Item[], dateFields: Field[]): TimelineGroups => {
		const times: Moment[] = [];

		let format: string;
		let unitPlural: string;
		let unitSingular: unitOfTime.StartOf;

		if (timelineGrouping === 'month') {
			format = 'YYYY-M';
			unitPlural = 'months';
			unitSingular = 'month';
		} else if (timelineGrouping === 'week') {
			format = 'YYYY-w';
			unitPlural = 'weeks';
			unitSingular = 'week';
		} else if (timelineGrouping === 'day') {
			format = 'YYYY-M-D';
			unitPlural = 'days';
			unitSingular = 'day';
		} else if (timelineGrouping === 'hour') {
			format = 'YYYY-M-D H';
			unitPlural = 'hours';
			unitSingular = 'hour';
		}

		const groupedNodes = groupBy(nodes, (node: Node) => {
			const date: Moment = getDate(node, items, dateFields);

			if (typeof date === 'undefined') {
				return 'unknown';
			}

			times.push(date);

			return date.format(format);
		});

		if (times.length === 0) {
			return {
				groups: {},
				periods: []
			}
		}

		times.sort((a: Moment, b: Moment) => a.unix() - b.unix());

		const periods: string[] = [];
		const start = times[0];
		const end = times[times.length - 1];
		let current: Moment = start;

		do {
			periods.push(current.format(format));
			current.add({ [unitPlural]: 1 });
		} while (current.clone().startOf(unitSingular).unix() <= end.clone().startOf(unitSingular).unix());

		return {
			groups: groupedNodes,
			periods: periods
		};
    }
);

export const isTableLoading = createSelector(
	(state: AppState) => state.graph.items,

	(items: Item[]) =>
		typeof items.find(item => item.requestedExtraData && !item.receivedExtraData) !== 'undefined'
);

export const createGetNodesByConnector = () => createSelector(
	(state: AppState, connectorName: string) => state.graph.nodes,
	(state: AppState, connectorName: string) => connectorName,

	(nodes: Node[], connectorName: string): Node[] => {
		return nodes.filter(node => node.connector === connectorName);
	}
);

export const createGetNodesByDatasource = () => createSelector(
	(state: AppState, datasourceId: string) => state.graph.nodes,
	(state: AppState, datasourceId: string) => datasourceId,

	(nodes: Node[], datasourceId: string): Node[] => {
		return nodes.filter(node => node.datasourceId === datasourceId);
	}
);