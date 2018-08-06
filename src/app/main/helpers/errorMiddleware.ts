import reduxCatch from 'redux-catch';
import { setReducerError } from '../../ui/uiActions';

export function errorMiddleware() {
	return reduxCatch((error, getState, lastAction, dispatch) => {
		console.error('Error occured in reducer!');
		console.error(error);
		console.error('current state', getState());
		console.error('last action was', lastAction);

		dispatch(setReducerError(error.toString(), lastAction));
	});
}