import { BrowserRouter } from 'react-router-dom';
import Main from './components/MainComponent';
import MyProvider from './contexts/MyProvider';
import './App.css';
import './styles/theme.css';
import './styles/motion.css';

function App() {
  return (
    <MyProvider>
      <BrowserRouter>
        <Main />
      </BrowserRouter>
    </MyProvider>
  );
}

export default App;
