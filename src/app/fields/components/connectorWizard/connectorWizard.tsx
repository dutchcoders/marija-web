import * as React from 'react';
import Modal from '../../../ui/components/modal/modal';
import SuggestedConnectorList from '../suggestedConnectorList/suggestedConnectorList';
import * as styles from './connectorWizard.scss';

class ConnectorWizard extends React.Component {
	render() {
		return (
			<Modal title="Suggested connectors">
				<main className={styles.main}>
					<SuggestedConnectorList/>
				</main>
			</Modal>
		)
	}
}

export default ConnectorWizard;