import * as React from 'react';

import * as styles from './iconSelector.scss';

const ion = require('ionicons-npm/builder/build_data.json');

interface Props {
    onSelectIcon: Function;
}

interface State {
}

export default class IconSelector extends React.Component<Props, State> {
    render() {
        const { onSelectIcon } = this.props;

        return (
            <ul className={styles.iconSelector}>
                {ion.icons.map(icon => {
                    const unicode = String.fromCharCode(parseInt(icon.code, 16));

                    return (
                        <li
                            key={icon.code}
                            className={styles.icon}
                            onClick={() => onSelectIcon(unicode)}>
                            {unicode}
                        </li>
                    );
                })}
            </ul>
        )
    }
}