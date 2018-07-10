import * as React from 'react';
import * as styles from './colorPicker.scss';
import { colors } from '../../uiConstants';

interface Props {
	selected: string;
	onChange: (color: string) => void
}

export default class ColorPicker extends React.Component<Props> {
	render() {
		const { selected, onChange } = this.props;

		return (
			<ul className={styles.list}>
				{colors.map(color => (
					<li
						key={color}
						className={styles.color + (selected === color ? ' ' + styles.selected : '')}
						onClick={() => onChange(color)}
						style={{backgroundColor: color}}
					/>
				))}
			</ul>
		);
	}
}