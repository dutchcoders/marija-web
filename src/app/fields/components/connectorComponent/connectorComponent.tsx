import { saveAs } from 'file-saver';
import * as React from 'react';
import { connect, Dispatch } from 'react-redux';
import {
	MatchingStrategy,
	Connector, ConnectorRule
} from '../../../graph/interfaces/connector';
import { AppState } from '../../../main/interfaces/appState';
import * as styles from './connectorComponent.scss';
import { FormEvent } from 'react';
import Icon from '../../../ui/components/icon';
import {
	deleteFromConnector,
	moveRuleBetweenConnectors,
	moveRuleToNewConnector, setMatchingStrategy
} from '../../fieldsActions';
import { hexToString } from '../../helpers/hexToString';

interface State {
	isHoveringOnDropArea: boolean;
}

interface Props {
	dispatch: Dispatch<any>;
	connector: Connector | null;
	isDragging: boolean;
}

class ConnectorComponent extends React.Component<Props, State> {
	state: State = {
		isHoveringOnDropArea: false
	};

	onDragOver(event: DragEvent) {
		event.preventDefault();
	}

	onDragEnter() {
		this.setState({
			isHoveringOnDropArea: true
		});
	}

	onDragLeave() {
		this.setState({
			isHoveringOnDropArea: false
		});
	}

	onDragStart(event: DragEvent, rule: ConnectorRule) {
		const { connector } = this.props;

		const data = JSON.stringify({
			ruleId: rule.id,
			fromConnectorName: connector.name
		});

		event.dataTransfer.setData('text', data);
	}

	onDrop(event: DragEvent) {
		const { connector, dispatch } = this.props;

		const text: string = event.dataTransfer.getData('text');
		let data: any;

		try {
			data = JSON.parse(text);
		} catch (e) {
			return;
		}

		if (connector === null) {
			dispatch(moveRuleToNewConnector(data.ruleId, data.fromConnectorName));
		} else {
			dispatch(moveRuleBetweenConnectors(data.ruleId, data.fromConnectorName, connector.name));
		}
	}

	onStrategyChange(event: FormEvent<HTMLInputElement>) {
		const { connector, dispatch } = this.props;

		dispatch(setMatchingStrategy(connector.name, event.currentTarget.value as MatchingStrategy));
	}

	deleteRule(rule: ConnectorRule) {
		const { dispatch, connector } = this.props;

		dispatch(deleteFromConnector(connector.name, rule.id));
	}

	render() {
		const { connector, isDragging } = this.props;

		return (
			<div className={styles.connector}>
				{connector !== null && (
					<div className={styles.icon} style={{backgroundColor: hexToString(connector.color)}}>{connector.icon}</div>
				)}

				<div className={styles.main}>
					{isDragging && connector && connector.rules.length > 1 && (
						<form className={styles.strategy}>
							<label>
								<input type="radio" name="strategy" checked={connector.strategy === 'AND'} value="AND" onChange={this.onStrategyChange.bind(this)}/>
								<span>Match all</span>
							</label>
							<label>
								<input type="radio" name="strategy" checked={connector.strategy === 'OR'} value="OR" onChange={this.onStrategyChange.bind(this)}/>
								<span>Match at least one</span>
							</label>
						</form>
					)}

					{connector !== null && (
						<ul className={styles.fields}>
							{connector.rules.map(rule => (
								<li
									key={rule.id}
									className={styles.field}
									draggable={true}
									onDragStart={(event: any) => this.onDragStart(event, rule)}>
									<span>{rule.field.path}</span>
									<Icon name={styles.delete + ' ion-ios-close'} onClick={() => this.deleteRule(rule)}/>
								</li>
							))}
						</ul>
					)}

					{isDragging && (
						<div className={styles.dropZone}
							 onDragOver={this.onDragOver.bind(this)}
							 onDrop={this.onDrop.bind(this)}>
							{connector === null ? 'Drop field here to create new matcher' : 'Drop field here to make part of matcher'}
						</div>
					)}
				</div>
			</div>
		);
	}
}


function select(state: AppState, ownProps) {
	return {
		...ownProps
	};
}

export default connect(select)(ConnectorComponent);
