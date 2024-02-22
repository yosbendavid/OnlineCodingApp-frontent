import './App.css';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom'
import Lobby from './components/lobby/Lobby.jsx';
import CodeBlock from './components/CodeBlock.jsx';

function App() {
  return (
    <Router>
      <div className="App">
        <Switch>
          <Route path="/" exact component={Lobby}/> 
           <Route path="/codeBlock/:id" component={CodeBlock} />
        </Switch>
      </div>
    </Router>
  );
}

export default App;
