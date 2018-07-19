import * as React from 'react';
import Modal from '../../../ui/components/modal/modal';
import HeatMapComponent from '../heatMapComponent/heatMapComponent';
import * as styles from './connectorWizard.scss';

class ConnectorWizard extends React.Component {
	render() {
		return (
			<Modal title="Create connectors">
				<main className={styles.main}>
					<HeatMapComponent/>
				</main>
			</Modal>
		)
	}
}

export default ConnectorWizard;