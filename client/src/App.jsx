import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CreatePoll from './CreatePoll';
import PollView from './PollView';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <header className="app-header">
          <h1>📊 Real-Time Polls</h1>
        </header>
        <main>
          <Routes>
            <Route path="/" element={<CreatePoll />} />
            <Route path="/poll/:id" element={<PollView />} />
          </Routes>
        </main>
        <footer>
          <p>Built with React, Node.js, Socket.io & SQLite</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
