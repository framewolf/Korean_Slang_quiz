// src/components/StartPage.js
import React from 'react';

function StartPage({ onStart }) {
  return (
    <div className="container start-page">
      <h1>Korean Slang Quiz</h1>
      <button onClick={onStart}>Start</button>
    </div>
  );
}

export default StartPage;
