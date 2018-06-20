import * as React from 'react';
import * as styles from './lightboxOutlet.scss';
import { AppState } from '../../../main/interfaces/appState';
import { connect } from 'react-redux';
import { closeLightbox } from '../../uiActions';

interface Props {
	lightboxImageUrl: string;
	dispatch: any;
}

class LightboxOutlet extends React.Component<Props, any> {
	close() {
		const { dispatch } = this.props;

		dispatch(closeLightbox());
	}

	render() {
		const { lightboxImageUrl } = this.props;

		if (lightboxImageUrl) {
			return (
				<div className={styles.overlay} onClick={this.close.bind(this)}>
					<img src={lightboxImageUrl} className={styles.largeImage} />
				</div>
			);
		}

		return null;
	}
}

const select = (state: AppState, ownProps) => ({
	...ownProps,
	lightboxImageUrl: state.ui.lightboxImageUrl
});

export default connect(select)(LightboxOutlet);