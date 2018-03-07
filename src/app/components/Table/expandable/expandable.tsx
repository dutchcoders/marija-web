import * as React from 'react';
import * as styles from './expandable.scss';

interface Props {
    content: string;
}

interface State {
    expanded: boolean;
}

export default class Expandable extends React.Component<Props, State> {
    readonly maxLength: number = 300;

    state: State = {
        expanded: false
    };

    toggleExpanded() {
        const { expanded } = this.state;

        this.setState({
            expanded: !expanded
        })
    }

    render() {
        const { expanded } = this.state;
        const { content } = this.props;

        let text = content;

        if (!expanded) {
            text = text.substring(0, this.maxLength);
        }

        return (
            <span>
                {text}
                <button
                    className={styles.button}
                    onClick={this.toggleExpanded.bind(this)}>
                    {expanded ? 'Show less' : 'Show more'}
                </button>
            </span>
        )
    }
}