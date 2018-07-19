import * as React from 'react';
import { AppState } from '../../../main/interfaces/appState';
import { HeatMap } from '../../helpers/getHeatMap';
import { selectHeatMap } from '../../fieldsSelectors';
import { connect } from 'react-redux';
import * as styles from './heatMapComponent.scss';

interface Props {
	heatMap: HeatMap;
}

class HeatMapComponent extends React.Component<Props> {
	render() {
		const { heatMap } = this.props;
		const sourceFields = Object.keys(heatMap);

		if (sourceFields.length === 0) {
			return null;
		}

		return (
			<table className={styles.table}>
				<tbody>
				{sourceFields.map(sourceField =>
					<tr key={sourceField}>
						<td>{sourceField}</td>

						{Object.keys(heatMap[sourceField]).map(targetField =>
							<td key={targetField}>{heatMap[sourceField][targetField]}</td>
						)}
					</tr>
				)}
				<tr>
					<td />
					{Object.keys(heatMap[sourceFields[0]]).map(targetField =>
						<td key={targetField}>{targetField}</td>
					)}
				</tr>
				</tbody>
			</table>
		);
	}
}

const select = (state: AppState) => ({
	heatMap: selectHeatMap(state)
});

export default connect(select)(HeatMapComponent);