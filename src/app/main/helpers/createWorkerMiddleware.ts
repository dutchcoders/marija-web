import { markPerformance, measurePerformance } from './performance';
import { GraphWorkerPayload } from '../../graph/helpers/graphWorkerClass';
import { LIVE_RECEIVE, SEARCH_RECEIVE } from '../../search/searchConstants';
import { AppState } from '../interfaces/appState';
import { REBUILD_GRAPH } from '../../graph/graphConstants';
import { setExpectedGraphWorkerOutputId } from '../../graph/graphActions';
import { uniqueId } from 'lodash';

export function createWorkerMiddleware(worker) {
	/*
	  for now, we don't really care if you actually pass it a Worker instance; as long as
	  it look likes a Worker and works like a Worker (has a `postMessage` method), it _is_ a Worker.
	   The reason behind is that we want to support WebWorker shims in an easy manner,
	  although shimming it doesn't make a lot of sense.
	*/

	if (!worker) {
		throw new Error('`createWorkerMiddleware` expects a worker instance as the argument. Instead received: ' + worker);
	} else if (!worker.postMessage) {
		throw new Error('The worker instance is expected to have a `postMessage` method.');
	}

	return function (_ref) {
		var dispatch = _ref.dispatch;
		const getState = _ref.getState;

		/*
		  when the worker posts a message back, dispatch the action with its payload
		  so that it will go through the entire middleware chain
		*/
		worker.onmessage = function (_ref2) {
			var resultAction = _ref2.data;
			// eslint-disable-line no-param-reassign
			dispatch(resultAction);
		};

		return function (next) {
			if (!next) {
				throw new Error('Worker middleware received no `next` action. Check your chain of middlewares.');
			}

			return function (action) {
				if (action.meta && action.meta.WebWorker) {
					if (action.type !== SEARCH_RECEIVE && action.type !== LIVE_RECEIVE && action.type !== REBUILD_GRAPH) {
						// These is the only action types we currently support in this worker
						return;
					}

					const payload: GraphWorkerPayload = action.payload;

					if (action.type !== REBUILD_GRAPH) {
						if (!payload.items) {
							return;
						}

						const searchIndex: number = payload.searches.findIndex(loop =>
							loop.searchId === payload.searchId
							&& !loop.paused
						);

						if (searchIndex === -1) {
							// received items for a query we were not searching for
							return;
						}

						const state: AppState = getState();

						// Dont send data to the graph worker that it already has available, to save on CPU
						// Posting messages to workers can be very heavy
						if (state.graph.graphWorkerCacheIsValid) {
							delete payload.prevItems;
							delete payload.prevLinks;
							delete payload.prevNodes;
						}
					}

					markPerformance('beforePostToGraphWorker');

					const outputId = uniqueId();

					dispatch(setExpectedGraphWorkerOutputId(outputId));

					payload.outputId = outputId;

					worker.postMessage(action);

					markPerformance('afterPostToGraphWorker');
					measurePerformance('beforePostToGraphWorker', 'afterPostToGraphWorker');
				}
				// always pass the action along to the next middleware
				return next(action);
			};
		};
	};
};