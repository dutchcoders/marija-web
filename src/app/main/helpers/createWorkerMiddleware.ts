import { markPerformance, measurePerformance } from './performance';

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
					markPerformance('beforePostToGraphWorker');

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