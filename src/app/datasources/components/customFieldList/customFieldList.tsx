import * as React from 'react';
import CustomField from '../customField/customField';
import * as styles from './customFieldList.scss';
import { Field } from '../../../fields/interfaces/field';
import { FormattedMessage } from 'react-intl';

interface Props {
	fields: Field[];
	onTypeChange: (field: Field, type: string) => void;
}

interface State {
}

class CustomFieldList extends React.Component<Props, State> {
	onTypeChange(field: Field, type: string) {
		const { onTypeChange } = this.props;

		onTypeChange(field, type);
	}

	render() {
		const { fields } = this.props;

		return (
			<table className={styles.table}>
				<thead className={styles.thead}>
				<tr>
					<td className={styles.td}><FormattedMessage id="field" /></td>
					<td className={styles.td}><FormattedMessage id="type"/></td>
					<td className={styles.td}><FormattedMessage id="unique_values_max_10"/></td>
				</tr>
				</thead>
				<tbody>
				{fields.map(field => (
					<CustomField key={field.path} field={field} onTypeChange={(type) => this.onTypeChange(field, type)}/>
				))}
				</tbody>
			</table>
		)
	}
}

export default CustomFieldList;