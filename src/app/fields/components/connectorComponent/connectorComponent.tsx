import { saveAs } from 'file-saver';
import * as React from 'react';
import { connect, Dispatch } from 'react-redux';
import {
	MatchingStrategy,
	Connector
} from '../../../graph/interfaces/connector';
import { AppState } from '../../../main/interfaces/appState';
import * as styles from './connectorComponent.scss';
import { FormEvent } from 'react';
import Icon from '../../../ui/components/icon';
import {
	moveRuleBetweenConnectors,
	moveRuleToNewConnector, setMatchingStrategy, updateConnector
} from '../../fieldsActions';
import { hexToString } from '../../helpers/hexToString';
import RuleComponent from '../ruleComponent/ruleComponent';
import { createGetNodesByConnector } from '../../../graph/graphSelectors';
import { Node } from '../../../graph/interfaces/node';
import {
	deselectNodes,
	highlightNodes,
	nodesSelect
} from '../../../graph/graphActions';
import ColorPicker from '../../../ui/components/colorPicker/colorPicker';
import IconSelector from '../iconSelector/iconSelector';
import { connectorColors, queryColors } from '../../../ui/uiConstants';

interface State {
	isHoveringOnDropArea: boolean;
	iconSelectorOpen: boolean;
}

interface Props {
	dispatch: Dispatch<any>;
	connector: Connector | null;
	isDragging: boolean;
	nodes: Node[];
}

class ConnectorComponent extends React.Component<Props, State> {
	state: State = {
		isHoveringOnDropArea: false,
		iconSelectorOpen: false
	};

	getDragData(event: DragEvent) {
		const text: string = event.dataTransfer.getData('text');

		try {
			return JSON.parse(text);
		} catch (e) {
			return null;
		}
	}

	onDragOver(event: DragEvent) {
		event.preventDefault();
	}

	onDragEnter(event: DragEvent) {
		const { connector } = this.props;
		const data = this.getDragData(event);

		this.setState({
			isHoveringOnDropArea: true
		});
	}

	onDragLeave() {
		this.setState({
			isHoveringOnDropArea: false
		});
	}

	onDrop(event: DragEvent) {
		const { connector, dispatch } = this.props;

		const data = this.getDragData(event);

		if (!data) {
			return;
		}

		if (connector === null) {
			dispatch(moveRuleToNewConnector(data.ruleId, data.fromConnectorName));
		} else if (connector.name !== data.fromConnectorName) {
			dispatch(moveRuleBetweenConnectors(data.ruleId, data.fromConnectorName, connector.name));
		}

		this.setState({
			isHoveringOnDropArea: false
		});
	}

	onStrategyChange(event: FormEvent<HTMLInputElement>) {
		const { connector, dispatch } = this.props;

		dispatch(setMatchingStrategy(connector.name, event.currentTarget.value as MatchingStrategy));
	}

	selectNodes() {
		const { nodes, dispatch } = this.props;

		let allSelected = true;
		nodes.forEach(node => {
			if (!node.selected) {
				allSelected = false;
			}
		});

		if (allSelected) {
			dispatch(deselectNodes(nodes));
		} else {
			dispatch(nodesSelect(nodes));
		}
	}

	highlightNodes() {
		const { nodes, dispatch } = this.props;

		dispatch(highlightNodes(nodes));
	}

	unHighlightNodes() {
		const { dispatch } = this.props;

		dispatch(highlightNodes([]));
	}

	toggleIconSelector() {
		const { iconSelectorOpen } = this.state;

		this.setState({
			iconSelectorOpen: !iconSelectorOpen
		});
	}

	onColorChange(color: string) {
		const { dispatch, connector } = this.props;

		dispatch(updateConnector(connector.name, {
			color
		}));

		this.setState({
			iconSelectorOpen: false
		});
	}

	onIconChange(icon: string) {
		const { dispatch, connector } = this.props;

		dispatch(updateConnector(connector.name, {
			icon
		}));

		this.setState({
			iconSelectorOpen: false
		});
	}

	render() {
		const { connector, isDragging, nodes } = this.props;
		const { isHoveringOnDropArea, iconSelectorOpen } = this.state;

		return (
			<div className={styles.connector}>
				{connector !== null && (
					<div className={styles.icon}
						 onClick={this.toggleIconSelector.bind(this)}
						 style={{backgroundColor: connector.color}}>
						{connector.icon}
					</div>
				)}

				{connector !== null && (
					<button
						className={styles.nodes}
						onClick={this.selectNodes.bind(this)}
						onMouseEnter={this.highlightNodes.bind(this)}
						onMouseLeave={this.unHighlightNodes.bind(this)}>
						{nodes.length}
						<Icon name="ion-ios-color-wand" />
					</button>
				)}

				<div className={styles.main}>
					{isDragging && connector && connector.rules.length > 1 && (
						<form className={styles.strategy}>
							<label>
								<input type="radio" name="strategy" checked={connector.strategy === 'OR'} value="OR" onChange={this.onStrategyChange.bind(this)}/>
								<span>Match at least one</span>
							</label>
							<label>
								<input type="radio" name="strategy" checked={connector.strategy === 'AND'} value="AND" onChange={this.onStrategyChange.bind(this)}/>
								<span>Match all</span>
							</label>
						</form>
					)}

					{connector !== null && (
						<ul className={styles.fields}>
							{connector.rules.map(rule => (
								<RuleComponent rule={rule} connector={connector} key={rule.id} />
							))}
						</ul>
					)}

					{isDragging && (
						<div className={styles.dropZone + (isHoveringOnDropArea ? ' ' + styles.hovering : '')}
							 onDragOver={this.onDragOver.bind(this)}
							 onDragEnter={this.onDragEnter.bind(this)}
							 onDragLeave={this.onDragLeave.bind(this)}
							 onDrop={this.onDrop.bind(this)}>
							{connector === null ? 'Drop field here to create new connector' : 'Drop field here to make part of connector'}
						</div>
					)}
				</div>

				{iconSelectorOpen && (
					<div className={styles.iconSelector}>
						<ColorPicker
							selected={connector.color}
							onChange={this.onColorChange.bind(this)}
						/>
						<IconSelector onSelectIcon={this.onIconChange.bind(this)}/>
					</div>
				)}
			</div>
		);
	}
}


function select() {
	const getNodesByConnector = createGetNodesByConnector();

	return (state: AppState, ownProps) => ({
		...ownProps,
		nodes: ownProps.connector ? getNodesByConnector(state, ownProps.connector.name) : []
	});
}

export default connect(select)(ConnectorComponent);
