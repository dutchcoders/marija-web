import * as React from 'react';
import CustomField from '../customField/customField';
import * as styles from './customFieldList.scss';
import { Field } from '../../../fields/interfaces/field';

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
					<td className={styles.td}>Field</td>
					<td className={styles.td}>Type</td>
					<td className={styles.td}>Values</td>
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