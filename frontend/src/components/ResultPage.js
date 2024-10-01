// src/components/ResultPage.js
import React from 'react';

function ResultPage({ result, onNext, onEnd }) {
  const { is_same_meaning, correct_answer } = result;

  return (
    <div className="result-page">
      {is_same_meaning ? <h2>정답입니다!</h2> : <h2>오답입니다.</h2>}
      <p>정답: {correct_answer}</p>
      <button onClick={onNext}>다음 문제</button>
      <button onClick={onEnd}>종료하기</button>
    </div>
  );
}

export default ResultPage;
