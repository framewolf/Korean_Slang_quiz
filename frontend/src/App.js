// src/App.js
import React, { useState } from 'react';
import StartPage from './components/StartPage';
import QuizPage from './components/QuizPage';
import ResultPage from './components/ResultPage';
import EndPage from './components/EndPage';
import './App.css';


function App() {
  const [page, setPage] = useState('start');
  const [question, setQuestion] = useState(null);
  const [excludedIds, setExcludedIds] = useState([]);
  const [result, setResult] = useState(null);

  return (
    <div className="App">
      {page === 'start' && (
        <StartPage
          onStart={() => {
            setPage('quiz');
          }}
        />
      )}
      {page === 'quiz' && (
        <QuizPage
          excludedIds={excludedIds}
          onQuestionLoaded={(question) => setQuestion(question)}
          onSubmit={(result) => {
            setResult(result);
            setExcludedIds([...excludedIds, question.id]);
            setPage('result');
          }}
          onEnd={() => setPage('end')}
        />
      )}
      {page === 'result' && (
        <ResultPage
          result={result}
          onNext={() => {
            setResult(null);
            setPage('quiz');
          }}
          onEnd={() => setPage('end')}
        />
      )}
      {page === 'end' && <EndPage />}
    </div>
  );
}

export default App;
