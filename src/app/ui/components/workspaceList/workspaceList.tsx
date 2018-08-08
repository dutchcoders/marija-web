import * as React from 'react';
import { AppState } from '../../../main/interfaces/appState';
import { connect } from 'react-redux';
import { WorkspaceDescription } from '../../interfaces/workspace';
import {
	selectActiveWorkspaceDescription,
	selectNonActiveWorkspaceDescriptions
} from '../../uiSelectors';
import * as styles from './workspaceList.scss';
import Icon from '../icon';
import { FormEvent } from 'react';
import {
	editWorkspaceTitle,
	requestWorkspace,
	saveWorkspaceOnServer
} from '../../uiActions';
import Loader from '../loader';

interface Props {
	workspaceDescriptions: WorkspaceDescription[];
	activeWorkspaceDescription: WorkspaceDescription;
	isRequestingWorkspace: boolean;
	dispatch: any;
}

interface State {
	expanded: boolean;
}

class WorkspaceList extends React.Component<Props, State> {
	state: State = {
		expanded: false
	};

	toggleExpanded() {
		this.setState({
			expanded: !this.state.expanded
		});
	}

	onTitleChange(event: FormEvent<HTMLInputElement>) {
		const { activeWorkspaceDescription, dispatch } = this.props;

		dispatch(editWorkspaceTitle(activeWorkspaceDescription.id, event.currentTarget.value));
	}

	onSave() {
		const { dispatch } = this.props;

		dispatch(saveWorkspaceOnServer());

		this.setState({
			expanded: false
		});
	}

	onSelect(workspaceId: string) {
		const { dispatch } = this.props;

		dispatch(requestWorkspace(workspaceId));

		this.setState({
			expanded: false
		})
	}

	render() {
		const { workspaceDescriptions, activeWorkspaceDescription, isRequestingWorkspace } = this.props;
		const { expanded } = this.state;

		return (
			<div className={styles.container}>
				<header className={styles.header + (expanded ? ' ' + styles.expanded : '')} onClick={this.toggleExpanded.bind(this)}>
					<div className={styles.active}>
						<p className={styles.description}>Workspace</p>
						<h2 className={styles.title}>{activeWorkspaceDescription.title}</h2>
					</div>
					<Icon name={styles.toggle + ' ' + (expanded ? 'ion-ios-arrow-up' : 'ion-ios-arrow-down')}/>

					{isRequestingWorkspace && (
						<div className={styles.loading}>
							<Loader show={true} classes={[styles.loadingIcon]}/>
						</div>
					)}
				</header>

				{expanded && (
					<main className={styles.main}>
						<div className={styles.edit}>
							<input className={styles.titleInput} onChange={this.onTitleChange.bind(this)} value={activeWorkspaceDescription.title}/>
							<button className={styles.save} onClick={this.onSave.bind(this)}>Save</button>
						</div>

						<ul className={styles.list}>
							{workspaceDescriptions.map(description =>
								<li key={description.id} className={styles.listItem} onClick={() => this.onSelect(description.id)}>{description.title}</li>
							)}
						</ul>
					</main>
				)}
			</div>
		);
	}
}

const select = (state: AppState) => ({
	workspaceDescriptions: selectNonActiveWorkspaceDescriptions(state),
	activeWorkspaceDescription: selectActiveWorkspaceDescription(state),
	isRequestingWorkspace: state.ui.isRequestingWorkspace
});

export default connect(select)(WorkspaceList);