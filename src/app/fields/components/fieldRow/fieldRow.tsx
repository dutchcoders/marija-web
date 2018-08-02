import Tooltip from 'rc-tooltip';
import * as React from 'react';
import { connect, Dispatch } from 'react-redux';
import Icon from '../../../ui/components/icon';
import {
	createNewConnector,
} from '../../fieldsActions';
import { Field } from '../../interfaces/field';
import FieldType from '../fieldType';
import * as styles from './fieldRow.scss';
import { MAX_FIELDS } from '../../../graph/graphConstants';
import { AppState } from '../../../main/interfaces/appState';
import { FieldStats } from '../../helpers/getFieldStats';

interface Props {
    field: Field;
    dispatch: Dispatch<any>;
    maxFieldsReached: boolean;
    fieldStats: FieldStats;
}

interface State {
    iconSelectorOpened: boolean;
    hoveringOnDropArea: boolean;
    expanded: boolean;
}

class FieldRow extends React.Component<Props, State> {
    state: State = {
        iconSelectorOpened: false,
		hoveringOnDropArea: false,
		expanded: false
    };

    add() {
        const { field, dispatch } = this.props;

        // Url.addQueryParam('fields', field.path);

        dispatch(createNewConnector([field]));
        // dispatch(searchFieldsUpdate());

        // If we add a field for a datasource, we assume that a user wants to
        // search in it, so we go ahead and activate it for the user, saving him
        // a click.
        // dispatch(datasourceActivated(field.datasourceId));
    }

    toggleExpanded() {
    	this.setState({
			expanded: !this.state.expanded
		});
	}

    render() {
        const { field, maxFieldsReached, fieldStats } = this.props;
        const { expanded } = this.state;

        let addButton = null;

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

		const rows = [
			<tr className={styles.tr + (expanded ? ' ' + styles.mainExpanded : '')}
				key="main">

				<td className={styles.td}>{field.path}</td>
				<td className={styles.td}>{fieldStats.uniqueValues.length}/{fieldStats.values}</td>
				<td className={styles.td}>
					<Icon
						onClick={this.toggleExpanded.bind(this)}
						name={styles.add + ' ' + (expanded ? 'ion-ios-arrow-up' : 'ion-ios-arrow-down')}
					/>
				</td>
				{addButton}
			</tr>
		];

		if (expanded) {
			rows.push(
				<tr className={styles.tr + (expanded ? ' ' + styles.extraExpanded : '')} key="extra">
					<td className={styles.td} colSpan={99}>
						<h3 className={styles.label}>Datasource</h3>
						<p className={styles.value}>{field.datasourceId}</p>

						<h3 className={styles.label}>Type</h3>
						<p className={styles.value}>{field.type}</p>

						<h3 className={styles.label}>Values</h3>
						{fieldStats.uniqueValues.map(value =>
							<p key={value} className={styles.value}>{value}</p>
						)}
					</td>
				</tr>
			);
		}

		return rows;
    }
}

const select = (state: AppState, ownProps) => {
    return {
        ...ownProps
    }
};

export default connect(select)(FieldRow);