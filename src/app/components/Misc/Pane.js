import React from 'react';

import { Icon } from '../index';
import { closePane } from '../../utils/index';

export function Pane(props){
    const { handle, children, name, panes, dispatch } = props;

    const open = panes.reduce((value, item) => {
        if ((item.name == handle && item.state === true) || value === true) {
            return true;
        }
        return false;
    }, false);

    const close = () => {
        dispatch(closePane(handle));
    };

    return (
        <div className={`pane ${handle} ${open ? 'open' : 'closed'}`}>
            <div className="container-fluid">
                <div className="row pane-header">
                    <div className="col-md-12">
                        {name}
                        <Icon onClick={() => close()} name="ion-ios-close shut"/>
                    </div>
                </div>
                <div className="row">
                    <div className="col-md-12 pane-holder">
                        <div className="col-md-12 pane-content">
                            {children}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}