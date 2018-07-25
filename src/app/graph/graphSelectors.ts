import {
	createSelector,
	createSelectorCreator,
	defaultMemoize
} from 'reselect';
import { Node } from "./interfaces/node";
import { Link } from "./interfaces/link";
import { AppState } from "../main/interfaces/appState";
import { TimelineGrouping } from './interfaces/graphState';
import { Item } from './interfaces/item';
import * as moment from 'moment';
import { Moment, unitOfTime } from 'moment';
import { groupBy } from 'lodash';
import fieldLocator from '../fields/helpers/fieldLocator';
import { Field } from '../fields/interfaces/field';
import { getSelectedDateFields } from '../fields/fieldsSelectors';
import App from '../main/main';
import { getValueInfo } from './helpers/getValueInfo';

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
    (nodes: Node[]) => nodes.filter(node => node.highlightLevel !== null)
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

export const getTimelineGroups = createSelector(
    (state: AppState) => state.graph.timelineGrouping,
    (state: AppState) => getNodesForDisplay(state),
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
			format = 'YYYY-M-D HH';
			unitPlural = 'hours';
			unitSingular = 'hour';
		} else if (timelineGrouping === 'minute') {
			format = 'YYYY-M-D HH:mm';
			unitPlural = 'minutes';
			unitSingular = 'minute';
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

		let periods: string[] = [];
		const maxPeriods = 100;
		const start = times[0];
		const end = times[times.length - 1];
		let current: Moment = start;

		do {
			periods.push(current.format(format));
			current.add({ [unitPlural]: 1 });
		} while (
			current.clone().startOf(unitSingular).unix() <= end.clone().startOf(unitSingular).unix()
			&& periods.length <= maxPeriods
		);

		if (periods.length > maxPeriods) {
			periods = Object.keys(groupedNodes);
		}

		return {
			groups: groupedNodes,
			periods: periods
		};
    }
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

export interface GroupedNodes {
	[key: string]: Node[]
}

export const getNodesGroupedByConnector = createSelector(
	(state: AppState) => getNodesForDisplay(state),

	(nodes: Node[]) => {
		let connectorNodes = nodes.filter(node => node.type === 'connector');

		return groupBy(nodes, node => node.connector);
	}
);

export const getNodesGroupedByDatasource = createSelector(
	(state: AppState) => getNodesForDisplay(state),

	(nodes: Node[]) => {
		let connectorNodes = nodes.filter(node => node.type === 'item');

		return groupBy(nodes, node => node.datasourceId);
	}
);

export const getItemNodeByItemId = createSelector(
	(state: AppState) => state.graph.nodes,
	(state: AppState, itemId: string) => itemId,

	(nodes: Node[], itemId: string) =>
		nodes.find(node =>
			node.type === 'item' && node.items.indexOf(itemId) !== -1
		)
);

const createArrayLengthSelector = createSelectorCreator(
	defaultMemoize,
	(a: any, b: any) => a.length === b.length
);

export const selectValueInfo = createArrayLengthSelector(
	(state: AppState) => state.graph.items,
	(state: AppState) => state.graph.nodes,

	(items, nodes) => getValueInfo(items, nodes)
);

export const searchValueInfo = createSelector(
	(state: AppState, field: string) => selectValueInfo(state),
	(state: AppState, field: string) => field,

	(valueInfo, field) => {
		if (!field) {
			return valueInfo
		}

		return valueInfo.filter(info => {
			return info.fields.indexOf(field) !== -1
		});
	}
);

export const selectItemFields = createSelector(
	(state: AppState) => state.graph.items,

	(items): string[] => {
		const fields: string[] = [];

		items.forEach(item => {
			Object.keys(item.fields).forEach(field => {
				if (fields.indexOf(field) === -1) {
					fields.push(field);
				}
			});
		});

		return fields;
	}
);