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

interface Props {
    field: Field;
    dispatch: Dispatch<any>;
    maxFieldsReached: boolean;
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

        // Url.addQueryParam('fields', field.path);

        dispatch(createNewConnector([field]));
        // dispatch(searchFieldsUpdate());

        // If we add a field for a datasource, we assume that a user wants to
        // search in it, so we go ahead and activate it for the user, saving him
        // a click.
        // dispatch(datasourceActivated(field.datasourceId));
    }

    render() {
        const { field, maxFieldsReached } = this.props;

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

        return (
			<tr className={styles.tr}
				key="main">

				<td className={styles.td}><FieldType type={field.type} /></td>
				<td className={styles.td}>{field.path}</td>
				<td className={styles.td}>{field.datasourceId}</td>
				{addButton}
			</tr>
		);
    }
}

const select = (state: AppState, ownProps) => {
    return {
        ...ownProps
    }
};

export default connect(select)(FieldRow);