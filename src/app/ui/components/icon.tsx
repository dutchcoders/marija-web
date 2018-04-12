import * as React from 'react';

export default class Icon extends React.Component<any, any> {
    render() {
        const { name } = this.props;
        return (
            <i className={`ion ${name}`} {...this.props} />
        );
    }
}