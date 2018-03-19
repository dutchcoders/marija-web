import * as React from 'react';
import {connect, Dispatch} from 'react-redux';
import {saveAs} from 'file-saver';
import { forEach, uniqWith, reduce, find, findIndex, pull, concat, map } from 'lodash';
import { Record, RecordDetail, Icon } from '../index';
import { tableColumnAdd, tableColumnRemove } from '../../modules/data/index';
import { tableSort } from '../../modules/data/actions';
import {requestItems} from "../../modules/items/actions";
import {Item} from "../../interfaces/item";
import {Node} from "../../interfaces/node";
import {Normalization} from "../../interfaces/normalization";
import {Search} from "../../interfaces/search";
import {Field} from "../../interfaces/field";
import {dispatch} from "d3-dispatch";
import { fieldAdd } from '../../modules/data/index';
import {searchFieldsUpdate} from "../../modules/search/actions";
import { EventEmitter } from 'fbemitter';
import {getSelectedNodes} from "../../reducers/entriesSelectors";
import {Column} from "../../interfaces/column";
import {SortType} from "../../interfaces/sortType";
import IconSelector from "../Configuration/iconSelector/iconSelector";

interface Props {
    dispatch: Dispatch<any>;
    selectedNodes: Node[];
    items: Item[];
    fields: any;
    columns: Column[];
    sortColumn: Column;
    sortType: SortType;
    normalizations: Normalization[];
    searches: Search[];
    availableFields: Field[];
    exportEvents: EventEmitter;
}

interface State {
    items: Item[];
    expandedItems: any[];
    queryColorMap: QueryColorMap;
}

export interface QueryColorMap {
    [itemId: string]: string[]
}

class TableView extends React.Component<Props, State> {
    state: State = {
        items: [],
        expandedItems: [],
        queryColorMap: {}
    };

    toggleExpand(id) {
        if (findIndex(this.state.expandedItems, (o) => o === id) >= 0) {
            // remove 
            this.setState({expandedItems: pull(this.state.expandedItems, id)});
        } else {
            // add
            this.setState({expandedItems: concat(this.state.expandedItems, id)});
        }
    }

    handleTableAddColumn(field) {
        const { dispatch } = this.props;
        dispatch(tableColumnAdd(field));
    }

    handleTableRemoveColumn(field) {
        const { dispatch } = this.props;

        dispatch(tableColumnRemove(field));
    }

    handleAddField(path: string) {
        const { dispatch, availableFields } = this.props;
        const field = availableFields.find(search => search.path === path);

        dispatch(fieldAdd(field));
        dispatch(searchFieldsUpdate());
    }

    getSelectedItems(selectedNodes: Node[], items: Item[]): Item[] {
        const nodeMap = {};

        selectedNodes.forEach(node => {
            node.items.forEach(itemId => {
                nodeMap[itemId] = true;
            });
        });

        const itemMap = {};

        items.forEach(item => {
            if (!nodeMap[item.id]) {
                // Item is not selected
                return;
            }

            itemMap[item.id] = item;
        });

        // Convert object to array
        const selectedItems: Item[] = Object.keys(itemMap).map(id => itemMap[id]);

        return selectedItems;
    }

    requestData(selectedNodes: Node[], items: Item[]) {
        const selectedItems = this.getSelectedItems(selectedNodes, items);
        const { dispatch } = this.props;

        const request = selectedItems.filter(item => !item.requestedExtraData);

        if (request.length > 0) {
            dispatch(requestItems(request));
        }
    }

    setQueryColorMap(selectedNodes: Node[], searches: Search[]) {
        const colorMap = {};
        searches.forEach(search => colorMap[search.q] = search.color);

        const queryMap: QueryColorMap = {};

        selectedNodes.forEach(node => {
            node.items.forEach(itemId => {
                node.queries.forEach(query => {
                    const color: string = colorMap[query];

                    if (!queryMap[itemId]) {
                        queryMap[itemId] = [color];
                        return;
                    }

                    if (queryMap[itemId].indexOf(color) === -1) {
                        queryMap[itemId].push(color);
                    }
                });
            });
        });

        this.setState({
            queryColorMap: queryMap
        });
    }

    componentWillReceiveProps(nextProps: Props) {
        const sortChanged: boolean =
            nextProps.sortColumn !== this.props.sortColumn
            || nextProps.sortType !== this.props.sortType;

        const selectionChanged: boolean = nextProps.selectedNodes !== this.props.selectedNodes;

        if (selectionChanged || sortChanged) {
            const items = this.getSelectedItems(nextProps.selectedNodes, nextProps.items);
            this.setState({items: items});
            this.setQueryColorMap(nextProps.selectedNodes, nextProps.searches);
        }

        if (nextProps.selectedNodes.length !== this.props.selectedNodes.length) {
            // Fetch more info about the items from the server
            this.requestData(nextProps.selectedNodes, nextProps.items);
        }
    }

    componentDidMount() {
        const { exportEvents, selectedNodes, items } = this.props;

        this.requestData(selectedNodes, items);

        exportEvents.addListener('export', this.exportCsv.bind(this));
    }

    componentWillUnmount() {
        const { exportEvents } = this.props;

        exportEvents.removeAllListeners();
    }

    renderBody() {
        const { columns, searches, fields, selectedNodes } = this.props;
        const { items, queryColorMap } = this.state;

        const activeFields = fields.map(field => field.path);

        return map(items, (record, i) => {
            const expanded = (findIndex(this.state.expandedItems, function(o) { return o == record.id; }) >= 0);
            const className = (i % 2 === 0 ? 'odd' : 'even') + (columns.length ? '' : ' noColumns');

            return [
                <Record
                    key={'record' + record.id}
                    columns={ columns }
                    selectedNodes={ selectedNodes }
                    record={ record }
                    searches={ searches }
                    toggleExpand = { this.toggleExpand.bind(this) }
                    expanded = { expanded }
                    queryColorMap={queryColorMap}
                    className={className}
                />,
                <RecordDetail
                    key={'recordDetail' + record.id}
                    columns={ columns }
                    record={ record }
                    onTableAddColumn={(field) => this.handleTableAddColumn(field) }
                    onTableRemoveColumn={(field) => this.handleTableRemoveColumn(field) }
                    onAddField={field => this.handleAddField(field)}
                    expanded = { expanded }
                    className={className}
                    activeFields={activeFields}
                />
            ];
        });
    }

    sort(column: Column, type: SortType) {
        const { dispatch } = this.props;

        dispatch(tableSort(column, type));
    }

    renderHeader() {
        const { columns, sortColumn, sortType } = this.props;

        return map(columns, (value) => {
            let sortIcon;

            if (value === sortColumn && sortType === 'asc') {
                sortIcon = (
                    <Icon
                        name="ion-ios-arrow-down"
                        onClick={() => this.sort(value, 'desc')}
                    />
                )
            } else if (value === sortColumn && sortType === 'desc' ) {
                sortIcon = (
                    <Icon
                        name="ion-ios-arrow-up"
                        onClick={() => this.sort(value, 'asc')}
                    />
                )
            } else {
                sortIcon = (
                    <Icon
                        name="ion-ios-arrow-down unsorted"
                        onClick={() => this.sort(value, 'asc')}
                    />
                )
            }

            return (
                <th key={ 'header_' + value }>
                    <h1>
                        <span>{ value }</span>
                        {sortIcon}
                        <Icon onClick={(e) => this.handleTableRemoveColumn(value)} name="ion-ios-close-empty"/>
                    </h1>
                </th>
            );
        });
    }

    exportCsv() {
        const { items } = this.state;
        const { columns } = this.props;
        const table = [];
        const delimiter = '|';

        table.push(columns.join(delimiter));

        items.forEach(item => {
            const row = [];
            columns.forEach(column => row.push(item.fields[column]));
            table.push(row.join(delimiter));
        });

        const csv = table.join("\n");

        const blob = new Blob(
            [csv],
            {type: "text/csv;charset=utf-8"}
        );

        const now = new Date();
        const dateString = now.getFullYear() + '-' + (now.getMonth() + 1) + '-' + now.getDate();
        const filename = 'marija-export-table-' + dateString + '.csv';

        saveAs(blob, filename);
    }

    render() {
        const { items } = this.state;

        if (!items.length) {
            return <p className="noNodes">Select some nodes first</p>;
        }

        return (
            <div className="form-group">
                <table className="tableView">
                    <tbody>
                    <tr>
                        <th>
                        </th>
                        { this.renderHeader() }
                    </tr>
                    {this.renderBody()}
                    </tbody>
                </table>
            </div>
        );
    }
}


function select(state) {
    return {
        selectedNodes: getSelectedNodes(state),
        normalizations: state.entries.normalizations,
        items: state.entries.items,
        searches: state.entries.searches,
        fields: state.entries.fields,
        columns: state.entries.columns,
        sortColumn: state.entries.sortColumn,
        sortType: state.entries.sortType,
        availableFields: state.fields.availableFields
    };
}


export default connect(select)(TableView);
