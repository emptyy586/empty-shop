import React, { Component } from 'react';
import { BrowserRouter } from 'react-router-dom';
import './App.css';
import './styles/theme.css';
import './styles/motion.css';
import LoginComponent from './components/LoginComponent';
import MainComponent from './components/MainComponent';
import MyProvider from './contexts/MyProvider';
import Toast from './components/ui/Toast';

class App extends Component {
  render() {
    return (
      <BrowserRouter>
        <MyProvider>
          <LoginComponent />
          <MainComponent />
          <Toast />
        </MyProvider>
      </BrowserRouter>
    );
  }
}

export default App;