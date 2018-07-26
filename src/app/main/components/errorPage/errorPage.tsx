import * as React from 'react';
import * as styles from './errorPage.scss';
import { ErrorDetails } from '../errorBoundary/errorBoundary';

interface Props {
	errorDetails: ErrorDetails;
}

class ErrorPage extends React.Component<Props> {
	getMessage(): string {
		const { errorDetails } = this.props;

		return JSON.stringify(errorDetails);
	}

	render() {
		return (
			<div className={styles.container}>
				<h1 className={styles.title}>Whoops!</h1>
				<h2 className={styles.subtitle}>Something went wrong.</h2>
				<p className={styles.debugTitle}>Debugging information:</p>
				<textarea className={styles.debugInfo} value={this.getMessage()} readOnly />
			</div>
		)
	}
}

export default ErrorPage;