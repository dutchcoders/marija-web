import { EventEmitter } from 'fbemitter';
import { saveAs } from 'file-saver';
import { concat, findIndex, map, pull } from 'lodash';
import * as React from 'react';
import { connect, Dispatch } from 'react-redux';
import { Field } from '../fields/interfaces/field';
import { getSelectedNodes } from '../graph/graphSelectors';
import { Node } from '../graph/interfaces/node';
import { Normalization } from '../graph/interfaces/normalization';
import { Item } from '../graph/interfaces/item';
import { AppState } from '../main/interfaces/appState';
import { Search } from '../search/interfaces/search';
import Icon from '../ui/components/icon';
import Record from './components/record';
import RecordDetail from './components/recordDetail';
import { Column } from './interfaces/column';
import { SortType } from './interfaces/sortType';
import { tableColumnAdd, tableColumnRemove, tableSort } from './tableActions';
import * as styles from './table.scss';
import { FormEvent } from 'react';
import { getSelectedFields } from '../fields/fieldsSelectors';
import { createNewConnector } from '../fields/fieldsActions';

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
    filter: string;
}

class Table extends React.Component<Props, State> {
    state: State = {
        items: [],
        expandedItems: [],
		filter: ''
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

        dispatch(createNewConnector(field));
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

    componentWillReceiveProps(nextProps: Props) {
        const sortChanged: boolean =
            nextProps.sortColumn !== this.props.sortColumn
            || nextProps.sortType !== this.props.sortType;

        const selectionChanged: boolean = nextProps.selectedNodes !== this.props.selectedNodes;

        if (selectionChanged || sortChanged) {
            const items = this.getSelectedItems(nextProps.selectedNodes, nextProps.items);
            this.setState({items: items});
        }
    }

    componentDidMount() {
        const { exportEvents } = this.props;

        exportEvents.addListener('export', this.exportCsv.bind(this));
    }

    componentWillUnmount() {
        const { exportEvents } = this.props;

        exportEvents.removeAllListeners();
    }

    renderBody() {
        const { columns, searches, fields } = this.props;
        const { items, filter } = this.state;

        const activeFields = fields.map(field => field.path);
        let filteredItems = items;

        if (filter.length > 0) {
        	filteredItems = filteredItems.filter(item => {
        		const keys = Object.keys(item.fields);
        		const lowercaseFilter: string = filter.toLowerCase();

        		for (let i = 0; i < keys.length; i ++) {
        			const value: any = item.fields[keys[i]];
        			let transformed: string;

        			if (typeof value === 'number') {
        				transformed = value.toString();
					} else if (typeof value === 'string') {
        				transformed = value;
					} else {
        				continue;
					}

        			if (transformed.toLowerCase().includes(lowercaseFilter)) {
        				return true;
					}
				}

				return false;
			});
		}

        return map(filteredItems, (record, i) => {
            const expanded = (findIndex(this.state.expandedItems, function(o) { return o == record.id; }) >= 0);
            const className = (i % 2 === 0 ? 'odd' : 'even') + (columns.length ? '' : ' noColumns');

            return [
                <Record
                    key={'record' + record.id}
                    columns={ columns }
                    record={ record }
                    searches={ searches }
                    toggleExpand = { this.toggleExpand.bind(this) }
                    expanded = { expanded }
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
					filter={filter}
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

    onFilterChange(event: FormEvent<HTMLInputElement>) {
		this.setState({
			filter: event.currentTarget.value
		});
	}

    render() {
        const { items, filter } = this.state;
        const { selectedNodes } = this.props;

        if (!selectedNodes.length) {
            return <p className="noNodes">Select some nodes first</p>;
        }

        if (!items.length) {
            return <p className="noNodes">No items found for these nodes</p>;
        }

        return (
            <div className="form-group">
				<form className={styles.filter}>
					<input
						className={styles.filterInput}
						placeholder="Filter"
						onChange={this.onFilterChange.bind(this) }
						value={filter}
					/>
					<Icon name="ion-ios-search" className={'ion-ios-search ' + styles.searchIcon} />
				</form>

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


function select(state: AppState) {
    return {
        selectedNodes: getSelectedNodes(state),
        normalizations: state.graph.normalizations,
        items: state.graph.items,
        searches: state.graph.searches,
        fields: getSelectedFields(state),
        columns: state.table.columns,
        sortColumn: state.table.sortColumn,
        sortType: state.table.sortType,
        availableFields: state.fields.availableFields
    };
}


export default connect(select)(Table);
