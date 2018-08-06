import * as React from 'react';
import * as styles from './filter.scss';
import Icon from '../../../ui/components/icon';
import { FormEvent } from 'react';
import { connect } from 'react-redux';
import { AppState } from '../../../main/interfaces/appState';
import { setFilterNodesBy } from '../../graphActions';
import FilterResults from '../filterResults/filterResults';
import { injectIntl, InjectedIntl } from 'react-intl';

interface Props {
	filterNodesBy: string;
	dispatch: any;
	intl: InjectedIntl;
}

interface State {
	opened: boolean;
}

class Filter extends React.Component<Props, State> {
	input: HTMLInputElement;
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

	onKeyDown(event: KeyboardEvent) {
		const { dispatch } = this.props;

		if (event.keyCode === 27) {
			// Escape key

			this.setState({
				opened: false
			});

			dispatch(setFilterNodesBy(''));
			this.input.blur();
		}
	}

	render() {
		const { filterNodesBy, intl } = this.props;
		const { opened } = this.state;

		return (
			<div className={styles.filter}>
				<div className={styles.header}>
					<div className={styles.inputWrapper}>
						<input
							type="text"
							value={filterNodesBy}
							onChange={ this.onFilterChange.bind(this) }
							placeholder={intl.formatMessage({ id: 'type_to_filter' })}
							className={styles.input}
							ref={ref => this.input = ref}
							onKeyDown={this.onKeyDown.bind(this)}
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

const select = (state: AppState, ownProps) => ({
	...ownProps,
	filterNodesBy: state.graph.filterNodesBy
});

export default injectIntl(connect(select)(Filter));