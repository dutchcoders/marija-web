import * as React from 'react';
import { AppState } from '../../../main/interfaces/appState';
import { connect } from 'react-redux';
import * as styles from './customField.scss';
import { FormEvent } from 'react';
import { Field } from '../../../fields/interfaces/field';

interface Props {
	onTypeChange: (type: string) => void;
	path: string;
	field: Field;
}

const availableTypes = [
	'text',
	'number',
	'date',
	'location',
	'image',
];

class CustomField extends React.Component<Props> {
	onTypeChange(event: FormEvent<HTMLSelectElement>) {
		const { onTypeChange } = this.props;

		onTypeChange(event.currentTarget.value);
	}

	render() {
		const { field } = this.props;

		return (
			<tr>
				<td className={styles.td}>{field.path}</td>
				<td className={styles.td}>
					<select className={styles.select} value={field.type} onChange={this.onTypeChange.bind(this)}>
						{availableTypes.map(type =>
							<option key={type} value={type}>{type}</option>
						)}
					</select>
				</td>
				<td className={styles.td}>{field.exampleValues.slice().splice(0, 10).join(', ')}</td>
			</tr>
		);
	}
}

const select = (state: AppState, ownProps) => ({
	...ownProps,
});

export default connect(select)(CustomField);