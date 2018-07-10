import * as React from 'react';
import * as styles from './colorPicker.scss';

interface Props {
	selected: string;
	available: string[];
	onChange: (color: string) => void
}

export default class ColorPicker extends React.Component<Props> {
	render() {
		const { selected, onChange, available } = this.props;

		return (
			<ul className={styles.list}>
				{available.map(color => (
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