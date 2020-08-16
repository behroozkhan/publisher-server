import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import * as serviceWorker from './serviceWorker';
import {BrowserRouter as Router, withRouter} from 'react-router-dom';
import MainRouter from "./Publisher/MainRouter";

const MainApp = withRouter(props => <MainRouter {...props}/>);

ReactDOM.render(
  <React.StrictMode>
      <Router>
          <MainApp/>
      </Router>
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
