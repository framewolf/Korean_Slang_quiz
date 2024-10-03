// src/components/ResultPage.js
import React from 'react';

function ResultPage({ result, onNext, onEnd }) {
  const { is_same_meaning, correct_answer } = result;

  return (
    <div className="container result-page">
      {is_same_meaning ? <h2>Correct!</h2> : <h2>Incorrect.</h2>}
      <p>Correct Answer: {correct_answer}</p>
      <button onClick={onNext}>Next Question</button>
      <button onClick={onEnd}>End Quiz</button>
    </div>
  );
}

export default ResultPage;
