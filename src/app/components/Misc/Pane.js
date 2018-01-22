import React from 'react';
import Rnd from 'react-rnd';
import { Icon } from '../index';
import { closePane, openPane } from '../../utils/index';
import {movePaneToTop, setPaneConfig} from "../../utils/actions";
import { debounce } from 'lodash';

class Pane extends React.Component {
    close() {
        const { dispatch, handle } = this.props;

        dispatch(closePane(handle));
    }

    updatePositionToStore(x, y, width, height) {
        const { handle, dispatch, container } = this.props;
        const containerSize = container.getBoundingClientRect();

        const newConfig = {
            width: width,
            height: height,
            x: x,
            y: y,
            alignRight: (width + x) >= containerSize.width,
            alignBottom: (height + y) >= containerSize.height,
            fullHeight: height >= containerSize.height,
            fullWidth: width >= containerSize.width
        };

        dispatch(setPaneConfig(handle, newConfig));
    }

    onResizeStop(e, dir, refToElement, delta, position) {
        const rect = refToElement.getBoundingClientRect();
        this.updatePositionToStore(position.x, position.y, rect.width, rect.height);
    }

    onDragStop(e, data) {
        const rect = data.node.getBoundingClientRect();
        this.updatePositionToStore(data.x, data.y, rect.width, rect.height);
    }

    /**
     * Make sure that none of the panes go out of bounds when the window is resized
     *
     * @type {Function}
     */
    onWindowResize = debounce(() => {
        const { config, container } = this.props;
        const containerSize = container.getBoundingClientRect();

        const sizeUpdates = {
            width: config.fullWidth ? containerSize.width : config.width,
            height: config.fullHeight ? containerSize.height : config.height
        };

        const positionUpdates = {
            x: config.alignRight && !config.fullWidth ? containerSize.width - config.width : config.x,
            y: config.alignBottom && !config.fullHeight ? containerSize.height - config.height : config.y
        };

        if (config.fullWidth) {
            // When we want the full width anyway, it becomes very simple
            sizeUpdates.width = containerSize.width;
        } else if ((config.width + config.x) > containerSize.width) {
            // It won't fit, resize or reposition
            if (config.width <= containerSize.width) {
                // It can fit if we reposition it, get the highest possible 'x'
                positionUpdates.x = containerSize.width - config.width;
            } else {
                // It won't fit by only repositioning, we also need to resize
                positionUpdates.x = 0;
                sizeUpdates.width = containerSize.width;
            }
        }

        if (config.fullHeight) {
            // When we want the full height anyway, it becomes very simple
            sizeUpdates.height = containerSize.height;
        } else if ((config.height + config.y) > containerSize.height) {
            // It won't fit, resize or reposition
            if (config.height <= containerSize.height) {
                // It can fit if we reposition it, get the highest possible 'y'
                positionUpdates.y = containerSize.height - config.height;
            } else {
                // It won't fit by only repositioning, we also need to resize
                positionUpdates.y = 0;
                sizeUpdates.height = containerSize.height;
            }
        }

        this.rnd.updateSize(sizeUpdates);
        this.rnd.updatePosition(positionUpdates);
        this.updatePositionToStore(positionUpdates.x, positionUpdates.y, sizeUpdates.width, sizeUpdates.height);
    }, 300);

    componentDidMount() {
        window.addEventListener('resize', () => this.onWindowResize());
    }

    componentDidUpdate(prevProps) {
        const { config } = this.props;

        if (prevProps.config.zIndex !== config.zIndex) {
            this.rnd.updateZIndex(config.zIndex);
        }

        if (!prevProps.config.open && config.open) {
            this.moveToTop();
        }
    }

    moveToTop() {
        const { dispatch, handle } = this.props;
        dispatch(movePaneToTop(handle));
    }

    render() {
        const { handle, children, name, description, top, container, config } = this.props;
        const isOpen = config.open;
        const containerSize = container.getBoundingClientRect();

        let descriptionEl = null;
        if (description) {
            descriptionEl = <span className="description">{description}</span>;
        }

        let style = {};
        if (top) {
            style.top = top + 'px';
        }

        let rndStyle = {};
        if (!isOpen) {
            rndStyle.display = 'none';
        }

        let height;
        if (config.fullHeight) {
            height = containerSize.height;
        } else {
            height = config.height;
        }

        let width;
        if (config.fullWidth) {
            width = containerSize.width;
        } else {
            width = config.width;
        }

        let x;
        if (config.alignRight) {
            x = containerSize.width - width;
        } else {
            x = config.x;
        }

        let y;
        if (config.alignBottom) {
            y = containerSize.height - height;
        } else {
            y = config.y;
        }

        return (
            <Rnd
                default={{
                    x: x,
                    y: y,
                    width: width,
                    height: height
                }}
                minWidth={config.minWidth}
                minHeight={config.minHeight}
                bounds=".main"
                dragHandleClassName=".pane-header"
                onResizeStop={this.onResizeStop.bind(this)}
                onDragStop={this.onDragStop.bind(this)}
                style={rndStyle}
                ref={rnd => this.rnd = rnd}
            >
                <div className={`pane ${handle}`} style={style} onMouseDown={this.moveToTop.bind(this)}>
                    <div className="container-fluid">
                        <div className="row pane-header">
                            <div className="col-md-12">
                                {name}
                                {descriptionEl}
                                <Icon onClick={this.close.bind(this)} name="ion-ios-close shut"/>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-md-12 pane-holder">
                                <div className="col-md-12 pane-content">
                                    {isOpen ? children : null}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Rnd>
        );
    }
}

export default Pane;
