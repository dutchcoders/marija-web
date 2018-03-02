import * as React from 'react';
import {Node} from "../../interfaces/node";
import * as styles from './contextMenu.scss';
import { Icon } from '../../components/index';
import {connect, Dispatch} from "react-redux";
import {deleteNodes, nodesSelect} from "../graph";
import getDirectlyRelatedNodes from "../../helpers/getDirectlyRelatedNodes";
import {Link} from "../../interfaces/link";
import {hideContextMenu} from "./contextMenuActions";
import {searchAround} from "../search/actions";

interface Props {
    node: Node;
    nodes: Node[];
    links: Link[];
    x: number;
    y: number;
    dispatch: Dispatch<any>
}

interface State {

}

class ContextMenu extends React.Component<Props, State> {
    selectRelated() {
        const { dispatch, nodes, links, node } = this.props;

        const relatedNodes = getDirectlyRelatedNodes([node], nodes, links);
        dispatch(nodesSelect(relatedNodes));

        this.close();
    }

    delete() {
        const { dispatch, node } = this.props;
        dispatch(deleteNodes([node]));

        this.close();
    }

    searchAround() {
        const { dispatch, node } = this.props;

        dispatch(searchAround(node));
        this.close();
    }

    close() {
        const { dispatch } = this.props;
        dispatch(hideContextMenu());
    }

    render() {
        const { node, x, y } = this.props;

        if (!node) {
            return null;
        }

        return (
            <nav className={styles.contextMenu} style={{top: y, left: x}}>
                <button onClick={this.selectRelated.bind(this)} className={styles.button}>
                    <Icon name="ion-qr-scanner" />
                    <span>Select related</span>
                </button>
                <button onClick={this.searchAround.bind(this)} className={styles.button}>
                    <Icon name="ion-ios-search" />
                    <span>Search around</span>
                </button>
                <button onClick={this.delete.bind(this)} className={styles.button}>
                    <Icon name="ion-ios-trash" />
                    <span>Delete</span>
                </button>
            </nav>
        );
    }
}


const select = (state, ownProps) => {
    return {
        ...ownProps,
        node: state.contextMenu.node,
        nodes: state.entries.nodes,
        links: state.entries.links,
        x: state.contextMenu.x,
        y: state.contextMenu.y,
    };
};

export default connect(select)(ContextMenu);
