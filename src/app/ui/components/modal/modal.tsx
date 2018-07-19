import * as React from 'react';
import * as styles from './modal.scss';
import Icon from '../../../ui/components/icon';
import { getHistory } from '../../../main/helpers/getHistory';
import Url from '../../../main/helpers/url';

interface Props {
	title: string;
	children: any;
}

interface State {
}

class Modal extends React.Component<Props, State> {
	close() {
		const history = getHistory();

		history.push({
			pathname: '/',
			search: Url.getQueryString()
		});
	}

	stopPropagation(event: MouseEvent) {
		event.stopPropagation();
	}

	render() {
		const { children, title } = this.props;

		return (
			<div className={styles.overlay} onClick={this.close.bind(this)}>
				<div className={styles.modal} onClick={this.stopPropagation.bind(this)}>
					<header className={styles.header}>
						<h1 className={styles.title}>{title}</h1>
						<Icon name={'ion-ios-close '+ styles.close} onClick={this.close.bind(this)}/>
					</header>

					{children}
				</div>
			</div>
		);
	}
}

export default Modal;