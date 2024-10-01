// src/components/StartPage.js
import React from 'react';

function StartPage({ onStart }) {
  return (
    <div className="start-page">
      <h1>한국어 슬랭 퀴즈</h1>
      <button onClick={onStart}>시작하기</button>
    </div>
  );
}

export default StartPage;
