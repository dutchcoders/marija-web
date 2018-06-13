import { createSelector } from 'reselect';
import {Node} from "./interfaces/node";
import {Link} from "./interfaces/link";
import {AppState} from "../main/interfaces/appState";
import { TimelineGrouping } from './interfaces/graphState';
import { Item } from '../items/interfaces/item';
import { Moment } from 'moment';
import { find, map, groupBy, reduce, forEach, filter, concat } from 'lodash';
import fieldLocator from '../fields/helpers/fieldLocator';
import { Field } from '../fields/interfaces/field';
import * as moment from 'moment';


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

export const getTimelineGroups = createSelector(
    (state: AppState) => state.graph.timelineGrouping,
    (state: AppState) => state.graph.nodes,
    (state: AppState) => state.graph.items,
	(state: AppState) => state.graph.date_fields,

    (timelineGrouping: TimelineGrouping, nodes: Node[], items: Item[], dateFields: Field[]): TimelineGroups => {
		const times: Moment[] = [];

		let format: string;

		if (timelineGrouping === 'month') {
			format = 'YYYY-M';
		} else if (timelineGrouping === 'week') {
			format = 'YYYY-w';
		} else if (timelineGrouping === 'day') {
			format = 'YYYY-M-D';
		} else if (timelineGrouping === 'hour') {
			format = 'YYYY-M-D H';
		} else if (timelineGrouping === 'minute') {
			format = 'YYYY-M-D H:mm';
		} else if (timelineGrouping === 'second') {
			format = 'YYYY-M-D H:mm:ss'
		}

		const groupedNodes = groupBy(nodes, (node: Node) => {
			const date: Moment = getDate(node, items, dateFields);

			if (typeof date === 'undefined') {
				return 'unknown';
			}

			times.push(date);

			return date.format(format);
		});

		times.sort((a: Moment, b: Moment) => {
			return a.unix() - b.unix();
		});

		const periods: string[] = [];

		times.forEach(moment => {
			const period: string = moment.format(format);

			if (periods.indexOf(period) === -1) {
				periods.push(period);
			}
		});

		return {
			groups: groupedNodes,
			periods: periods
		};
    }
);