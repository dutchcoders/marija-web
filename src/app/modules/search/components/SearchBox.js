import React, { Component } from 'react';
import classNames from 'classnames/bind';

import { map } from 'lodash';

export default class SearchBox extends Component {
    constructor(props) {
        super(props);

        this.handleSubmit = this.handleSubmit.bind(this);

        this.state = {
            q: props.q,
            selectValue: this.props.indexes[0]
        };
    }

    handleSubmit(e) {
        e.preventDefault();

        let q = this.refs.q.value;
        this.props.onSubmit(q, this.state.selectValue);
    }

    handleChange(e) {
        this.setState({selectValue: e.target.value});
    }

    renderIndices(indices) {
        const options = map(indices || [], (index) => {
            return (
                <option key={index} value={index}>{ index }</option>
            );
        });

        return (
            <div>
                <select style={{'display': 'none'}}
                        onChange={this.handleChange.bind(this)}
                        value={this.state.selectValue}>
                    {options}
                </select>
            </div>
        );
    }

    render() {

        const {children, isFetching, indexes} = this.props;

        let loader = classNames({
            'sk-search-box__loader': true,
            'sk-spinning-loader': true,
            'is-hidden': !isFetching
        });

        return (
            <nav className="[ navbar ][ navbar-bootsnipp animate ] row" role="navigation">
                <div className="col-xs-2">
                    <img className="logo" src="/images/logo.png" />
                </div>
                <div className="col-xs-9">
                    <div className="form-group">
                        <form onSubmit={this.handleSubmit.bind(this)}>
                            <input ref="q" className="form-control" placeholder="Search" value={ this.state.q }/>
                            <div data-qa="loader" className={loader}></div>
                            { this.renderIndices(indexes) }
                        </form>
                    </div>
                </div>
                <div className="col-xs-1">
                    <center>
                        {children}
                    </center>
                </div>
            </nav>
        );
    }
}
