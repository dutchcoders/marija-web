import * as React from 'react';
import * as styles from './adjacencyMatrix.scss';
import {Node} from "../../interfaces/node";
import {Link} from "../../interfaces/link";
import {AppState} from "../../../main/interfaces/appState";
import {getLinksForDisplay, getSelectedNodes} from "../../graphSelectors";
import {connect, Dispatch} from "react-redux";
import {Search} from "../../../search/interfaces/search";

interface Props {
    selectedNodes: Node[];
    links: Link[];
    searches: Search[];
    dispatch: Dispatch<any>;
}

interface State {

}

class AdjacencyMatrix extends React.Component<Props, State> {
    render() {
        return null;
    }
}

const select = (state: AppState) => {
    return {
        selectedNodes: getSelectedNodes(state),
        links: getLinksForDisplay(state),
        searches: state.graph.searches
    };
};

export default connect(select)(AdjacencyMatrix);