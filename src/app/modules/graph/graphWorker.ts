import {graphWorkerOutput} from "./actions";
import GraphWorkerClass from './graphWorkerClass';

const graphWorker = new GraphWorkerClass();

onmessage = (event: MessageEvent) => {
    graphWorker.onMessage(event);
};

graphWorker.output.addListener('output', output => {
    postMessage(graphWorkerOutput(
        output.nodes,
        output.links,
        output.items,
        output.fields
    ));
});