import * as React from 'react';
import { AppState } from '../../../main/interfaces/appState';
import { HeatMap } from '../../helpers/getHeatMap';
import { selectHeatMap } from '../../fieldsSelectors';
import { connect } from 'react-redux';
import * as styles from './heatMapComponent.scss';
import * as tinygradient from 'tinygradient';

interface Props {
	heatMap: HeatMap;
}

const gradient = tinygradient('blue', 'red');

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

						{heatMap[sourceField].map(target =>
							<td
								key={target.targetField}
								style={{ backgroundColor: '#' + gradient.rgbAt(target.score).toHex()}}
							>
								Score: {target.score}<br />
								Uniques: {target.uniqueConnectors}<br />
								Connected: {target.links}
							</td>
						)}
					</tr>
				)}
				<tr>
					<td />
					{heatMap[sourceFields[0]].map(target =>
						<td key={target.targetField}>{target.targetField}</td>
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