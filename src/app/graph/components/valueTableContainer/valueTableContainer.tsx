import * as React from 'react';
import { AppState } from '../../../main/interfaces/appState';
import { connect } from 'react-redux';
import { selectItemFields } from '../../graphSelectors';
import ValueTable from '../valueTable/valueTable';
import * as styles from './valueTableContainer.scss';
import { FormEvent } from 'react';
import Icon from '../../../ui/components/icon';

interface Props {
	fields: string[]
}

interface State {
	field: string;
	search: string;
}

class ValueTableContainer extends React.Component<Props, State> {
	state: State = {
		field: '',
		search: ''
	};

	onFieldChange(event: FormEvent<HTMLSelectElement>) {
		this.setState({
			field: event.currentTarget.value
		});
	}

	onSearchChange(event: FormEvent<HTMLInputElement>) {
		this.setState({
			search: event.currentTarget.value
		});
	}

	render() {
		const { fields } = this.props;
		const { field, search } = this.state;

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

					<div className={styles.filter}>
						<input
							value={search}
							onChange={this.onSearchChange.bind(this)}
							className={styles.searchInput}
							placeholder="Type to filter"
						/>
						<Icon name={'ion-ios-search ' + styles.searchIcon} />
					</div>
				</div>

				<ValueTable field={field} search={search} />
			</div>
		)
	}
}

const select = (state: AppState) => ({
	fields: selectItemFields(state)
});

export default connect(select)(ValueTableContainer);