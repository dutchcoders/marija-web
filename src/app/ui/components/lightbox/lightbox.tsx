import * as React from 'react';
import * as styles from './lightbox.scss';
import { AppState } from '../../../main/interfaces/appState';
import { connect } from 'react-redux';
import { openLightbox } from '../../uiActions';

interface Props {
	imageUrl: string;
	dispatch: any;
}

class Lightbox extends React.Component<Props, any> {
	open() {
		const { dispatch, imageUrl } = this.props;

		dispatch(openLightbox(imageUrl));
	}

	render() {
		const { imageUrl } = this.props;

		return (
			<img src={imageUrl} className={styles.smallImage} onClick={this.open.bind(this)}/>
		);
	}
}

const select = (state: AppState, ownProps) => ({
	...ownProps
});

export default connect(select)(Lightbox);