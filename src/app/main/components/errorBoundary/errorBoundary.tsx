import * as React from 'react';
import { AppState } from '../../interfaces/appState';
import { connect } from 'react-redux';

export interface ErrorDetails {
	componentError?: any;
	componentErrorInfo?: any;
	reducerError?: any;
	reducerErrorState?: any;
	reducerErrorLastAction?: any;
}

interface Props {
	onError: (errorDetails: ErrorDetails) => void;
	reducerError: any;
	reducerErrorState: any;
	reducerErrorLastAction: any;
	children: any;
}

class ErrorBoundary extends React.Component<Props> {
	componentDidCatch(error, info) {
		const { onError } = this.props;

		onError({
			componentError: error,
			componentErrorInfo: info
		});
	}

	componentWillReceiveProps(nextProps: Props) {
		const { onError, reducerError, reducerErrorState, reducerErrorLastAction } = nextProps;

		onError({
			reducerError,
			reducerErrorLastAction,
			reducerErrorState,
		});
	}

	render() {
		const { children } = this.props;

		return children;
	}
}

const select = (state: AppState, ownProps) => ({
	...ownProps,
	reducerError: state.ui.reducerError,
	reducerErrorState: state.ui.reducerErrorState,
	reducerErrorLastAction: state.ui.reducerErrorLastAction
});

export default connect(select)(ErrorBoundary);