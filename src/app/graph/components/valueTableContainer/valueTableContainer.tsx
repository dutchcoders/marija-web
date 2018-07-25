import * as React from 'react';
import { AppState } from '../../../main/interfaces/appState';
import { connect } from 'react-redux';
import { selectItemFields } from '../../graphSelectors';
import ValueTable from '../valueTable/valueTable';
import * as styles from './valueTableContainer.scss';
import { FormEvent } from 'react';

interface Props {
	fields: string[]
}

interface State {
	field: string;
}

class ValueTableContainer extends React.Component<Props, State> {
	state: State = {
		field: ''
	};

	onFieldChange(event: FormEvent<HTMLSelectElement>) {
		this.setState({
			field: event.currentTarget.value
		});
	}

	render() {
		const { fields } = this.props;
		const { field } = this.state;

		return (
			<div className={styles.container}>

				<div className={styles.filters}>
					<div className={styles.filter}>
						<label className={styles.label}>Filter by field: </label>
						<select value={field} onChange={this.onFieldChange.bind(this)} className={styles.select}>
							<option value="">All fields</option>
							{fields.map(fieldLoop =>
								<option key={fieldLoop} value={fieldLoop}>{fieldLoop}</option>
							)}
						</select>
					</div>
				</div>

				<ValueTable field={field} />
			</div>
		)
	}
}

const select = (state: AppState) => ({
	fields: selectItemFields(state)
});

export default connect(select)(ValueTableContainer);