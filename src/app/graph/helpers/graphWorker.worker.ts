import { graphWorkerOutput } from '../graphActions';
import GraphWorkerClass, { GraphWorkerOutput } from './graphWorkerClass';

const graphWorker = new GraphWorkerClass();

onmessage = (event: MessageEvent) => {
    graphWorker.onMessage(event.data);
};

graphWorker.output.addListener('output', (output: GraphWorkerOutput) => {
    postMessage(graphWorkerOutput(output));
});