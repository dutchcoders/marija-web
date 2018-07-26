import * as React from 'react';
import * as styles from './filter.scss';
import Icon from '../../../ui/components/icon';
import { FormEvent } from 'react';
import { connect } from 'react-redux';
import { AppState } from '../../../main/interfaces/appState';
import { setFilterNodesBy } from '../../graphActions';
import FilterResults from '../filterResults/filterResults';

interface Props {
	filterNodesBy: string;
	dispatch: any;
}

interface State {
	opened: boolean;
}

class Filter extends React.Component<Props, State> {
	state: State = {
		opened: false
	};

	onFilterChange(event: FormEvent<HTMLInputElement>) {
		const { dispatch } = this.props;

		dispatch(setFilterNodesBy(event.currentTarget.value));
	}

	toggleOpened() {
		const { opened } = this.state;

		this.setState({
			opened: !opened
		})
	}

	render() {
		const { filterNodesBy } = this.props;
		const { opened } = this.state;

		return (
			<div className={styles.filter}>
				<div className={styles.header}>
					<div className={styles.inputWrapper}>
						<input
							type="text"
							value={filterNodesBy}
							onChange={ this.onFilterChange.bind(this) }
							placeholder="Type to filter"
							className={styles.input}
						/>
						<Icon name={styles.searchIcon + ' ion-ios-search'} />
					</div>
					<Icon
						name={styles.toggle + (opened ? ' ion-ios-arrow-up' : ' ion-ios-arrow-down')}
						onClick={this.toggleOpened.bind(this)}
					/>
				</div>

				{opened && <FilterResults/>}
			</div>
		);
	}
}

const select = (state: AppState) => ({
	filterNodesBy: state.graph.filterNodesBy
});

export default connect(select)(Filter);