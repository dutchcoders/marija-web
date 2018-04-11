import * as React from 'react';

export default class Loader extends React.Component<any, any> {
    render() {
        const { show, classes } = this.props;

        if (!show) {
            return null;
        }

        const defaultClasses = [
            'loader',
            'sk-spinning-loader'
        ];

        if (classes) {
            classes.forEach(customClass => {
                defaultClasses.push(customClass);
            });
        }

        return <div data-qa="loader" className={defaultClasses.join(' ')} />;
    }
}