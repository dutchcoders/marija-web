import Tooltip from 'rc-tooltip';
import * as React from 'react';
import { connect, Dispatch } from 'react-redux';

import { datasourceActivated } from '../../../datasources/datasourcesActions';
import {
	fieldNodesHighlight,
	selectFieldNodes,
	setIsDraggingSubFields
} from '../../../graph/graphActions';
import Url from '../../../main/helpers/url';
import { searchFieldsUpdate } from '../../../search/searchActions';
import Icon from '../../../ui/components/icon';
import { fieldAdd, fieldDelete, fieldUpdate } from '../../fieldsActions';
import { Field } from '../../interfaces/field';
import FieldType from '../fieldType';
import IconSelector from '../iconSelector/iconSelector';
import * as styles from './fieldRow.scss';
import { MAX_FIELDS } from '../../../graph/graphConstants';
import { AppState } from '../../../main/interfaces/appState';

interface Props {
    field: Field;
    isActive: boolean;
    dispatch: Dispatch<any>;
    maxFieldsReached: boolean;
    isDraggingSubFields: boolean;
}

interface State {
    iconSelectorOpened: boolean;
    hoveringOnDropArea: boolean;
}

class FieldRow extends React.Component<Props, State> {
    state: State = {
        iconSelectorOpened: false,
		hoveringOnDropArea: false
    };

    add() {
        const { field, dispatch } = this.props;

        Url.addQueryParam('fields', field.path);

        dispatch(fieldAdd(field));
        dispatch(searchFieldsUpdate());

        // If we add a field for a datasource, we assume that a user wants to
        // search in it, so we go ahead and activate it for the user, saving him
        // a click.
        dispatch(datasourceActivated(field.datasourceId));
    }

    remove() {
        const { field, dispatch } = this.props;

        Url.removeQueryParam('fields', field.path);

        dispatch(fieldDelete(field));
    }

    highlightNodes() {
        const { field, isActive, dispatch } = this.props;

        if (!isActive) {
            return;
        }

        dispatch(fieldNodesHighlight(field.path));
    }

    toggleIconSelector() {
        const { iconSelectorOpened } = this.state;

        this.setState({
            iconSelectorOpened: !iconSelectorOpened
        });
    }

    selectIcon(icon: string) {
        const { dispatch, field } = this.props;

        dispatch(fieldUpdate(field.path, {
            icon: icon
        }));

        this.setState({
            iconSelectorOpened: false
        });
    }

    selectNodes() {
        const { field, dispatch } = this.props;

        dispatch(selectFieldNodes(field.path));
    }

    onDragStart() {
    	const { dispatch } = this.props;

    	console.log('start');

    	dispatch(setIsDraggingSubFields(true));
	}

    onDragEnter() {
		this.setState({
			hoveringOnDropArea: true
		});
	}


    onDragLeave() {
		this.setState({
			hoveringOnDropArea: false
		});
	}

	onDrop() {

	}

    render() {
        const { field, isActive, maxFieldsReached, isDraggingSubFields } = this.props;
        const { iconSelectorOpened, hoveringOnDropArea } = this.state;

        let deleteButton = null;

        if (isActive) {
            deleteButton = (
                <td className={styles.buttonTd}>
                    <Icon
                        onClick={this.remove.bind(this)}
                        name={styles.delete + ' ion-ios-close'}
                    />
                </td>
            );
        }

        let addButton = null;

        if (!isActive) {
            if (maxFieldsReached) {
				addButton = (
					<td className={styles.buttonTd}>
                        <Tooltip
                            overlay={'You can not add more than ' + MAX_FIELDS + ' fields'}>
                            <Icon
                                name={styles.add + ' ' + styles.addDisabled + ' ion-ios-plus'}
                            />
                        </Tooltip>
					</td>
				);
            } else {
				addButton = (
					<td className={styles.buttonTd}>
						<Icon
							onClick={this.add.bind(this)}
							name={styles.add + ' ion-ios-plus'}
						/>
					</td>
				);
            }
        }

        let selectIconButton = null;
        let selectNodesButton = null;

        if (isActive && field.childOf) {
			selectIconButton = <td />;
			selectNodesButton = <td />;
		} else if (isActive && !field.childOf) {
            selectIconButton = (
                <td className={styles.td}>
                    <i className={styles.icon}
                       onClick={() => this.toggleIconSelector()}>{ field.icon }</i>
                    {!iconSelectorOpened ? null :
                        <IconSelector onSelectIcon={(icon: string) => this.selectIcon(icon)} />
                    }
                </td>
            );

            selectNodesButton = (
                <td className={styles.td}>
                    <Tooltip
                        overlay={'Select nodes'}
                        placement="bottom"
                        mouseLeaveDelay={0}
                        arrowContent={<div className="rc-tooltip-arrow-inner" />}>
                        <Icon name={styles.selectNodesButton + ' ion-qr-scanner'}
                              onClick={this.selectNodes.bind(this)} />
                    </Tooltip>
                </td>
            );
        }

        const ret = [
			<tr className={styles.tr + (isDraggingSubFields ? ' ' + styles.draggable : '') + ' ' + (hoveringOnDropArea ? styles.hovering : '')}
				draggable={true}
				onDragStart={this.onDragStart.bind(this)}
				onMouseEnter={this.highlightNodes.bind(this)}
				key="main">

				<td className={styles.td}><FieldType type={field.type} /></td>
				<td className={styles.td}>{field.path}</td>
				<td className={styles.td}>{field.datasourceId}</td>
				{selectIconButton}
				{selectNodesButton}
				{deleteButton}
				{addButton}
			</tr>
		];

        if (isDraggingSubFields && isActive) {
        	ret.push(
        		<tr>
					<td />
					<td colSpan={999}>
						<div onDragEnter={this.onDragEnter.bind(this)}
							onDragLeave={this.onDragLeave.bind(this)}
							className={styles.dropable + ' ' + (hoveringOnDropArea ? styles.hovering : '')}>
							Drag here
						</div>
					</td>
				</tr>
			);
		}

		return ret;
    }
}

const select = (state: AppState, ownProps) => {
    return {
        ...ownProps,
		// isDraggingSubFields: state.graph.isDraggingSubFields
    }
};

export default connect(select)(FieldRow);