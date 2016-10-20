import React, { Component } from 'react';
import classNames from 'classnames/bind';


export class SearchBox extends Component {
    constructor(props) {
        super(props);

        this.handleSubmit = this.handleSubmit.bind(this);

        console.log(this.props.indexes);

        this.state = {
            q: props.q,
            selectValue: this.props.indexes[0],
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

    componentDidUpdate(prevProps, prevState) {
    }

    render() {

        let indexes = null;

        if (this.props.indexes) {
            let options = _.map(this.props.indexes, (index) => {
                return <option key={index} value={index}>{ index }</option>;
            });

            indexes = <div>
                <select onChange={this.handleChange.bind(this)} value={this.state.selectValue}>{options}</select>
            </div>;
        }

        let loader = classNames({
            'sk-search-box__loader': true,
            'sk-spinning-loader': true,
            'is-hidden': !this.props.isFetching
        });

        return <div className="row">
            <nav className="[ navbar ][ navbar-bootsnipp animate ]" role="navigation">
                <div className="col-md-offset-2 col-sm-offset-2 col-xs-offset-1 col-xs-10 col-sm-8 col-md-8 col-lg-6">
                    <div className="form-group">
                        <form onSubmit={this.handleSubmit.bind(this)}>
                            <input ref="q" className="form-control" placeholder="query" value={ this.state.q }/>
                            <div data-qa="loader" className={loader}></div>
                            { indexes }
                        </form>
                    </div>
                </div>
            </nav>
        </div>
    }
}