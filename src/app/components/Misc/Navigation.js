import React from 'react';
import { connect} from 'react-redux';
import {Icon} from "../index";
import {closePane, openPane} from "../../utils/actions";
import Tooltip from 'rc-tooltip';
import {setSelectingMode} from "../../modules/graph/actions";

class Navigation extends React.Component {
    enableMoving() {
        const { dispatch } = this.props;
        dispatch(setSelectingMode(false));
    }

    enableSelecting() {
        const { dispatch } = this.props;
        dispatch(setSelectingMode(true));
    }

    togglePane(handle) {
        const { dispatch } = this.props;

        if (this.isActive(handle)) {
            dispatch(closePane(handle));
        } else {
            dispatch(openPane(handle));
        }
    }

    isActive(name) {
        const { panes } = this.props;

        return panes[name].open;
    }

    getButton(icon, tooltip, clickHandler, active) {
        return (
            <li className={active ? 'active': ''}>
                <Tooltip
                    overlay={tooltip}
                    placement="bottom"
                    mouseLeaveDelay={0}
                    arrowContent={<div className="rc-tooltip-arrow-inner" />}>
                    <Icon name={icon} onClick={clickHandler} />
                </Tooltip>
            </li>
        );
    }

    render() {
        const { selectingMode, zoomIn, zoomOut } = this.props;

        return (
            <nav className="navigation">
                <ul className="paneToggles">
                    {this.getButton(
                        'ion-ios-gear',
                        'Configuration',
                        () => this.togglePane('configuration'),
                        this.isActive('configuration')
                    )}
                    {this.getButton(
                        'ion-android-share-alt',
                        'Selected nodes',
                        () => this.togglePane('nodes'),
                        this.isActive('nodes')
                    )}
                    {this.getButton(
                        'ion-ios-grid-view',
                        'Table',
                        () => this.togglePane('table'),
                        this.isActive('table')
                    )}
                    {this.getButton(
                        'ion-ios-clock',
                        'Histogram',
                        () => this.togglePane('histogram'),
                        this.isActive('histogram')
                    )}
                    {this.getButton(
                        'ion-ios-search',
                        'Filter',
                        () => this.togglePane('filter'),
                        this.isActive('filter')
                    )}
                </ul>
                <ul className="mapControls">
                    {this.getButton(
                        'ion-arrow-move',
                        'Move',
                        () => this.enableMoving(),
                        !selectingMode
                    )}
                    {this.getButton(
                        'ion-qr-scanner',
                        'Select',
                        () => this.enableSelecting(),
                        selectingMode
                    )}
                    {this.getButton(
                        'ion-ios-minus',
                        'Zoom out',
                        () => zoomOut(),
                        false
                    )}
                    {this.getButton(
                        'ion-ios-plus',
                        'Zoom in',
                        () => zoomIn(),
                        false
                    )}
                </ul>
            </nav>
        );
    }
}

const select = (state, ownProps) => {
    return {
        ...ownProps,
        panes: state.utils.panes,
        selectingMode: state.entries.selectingMode
    };
};

export default connect(select)(Navigation);