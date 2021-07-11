import React, { Component } from 'react'
import Video from './Video'
import withRoot from './Homepage(UI)/Withroot';
import Index from './Homepage';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';

//Define the routes
class App extends Component {
	render() {
		return (
			<div>
				<Router>
					<Switch>
						<Route path="/" exact component={withRoot(Index)} />
						<Route path="/:url" component={Video} />
						</Switch>
				</Router>
			</div>
		)
	}
}

export default App;


