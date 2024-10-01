import React, { useState, useEffect } from 'react';
import axios from 'axios';

function QuizPage({ excludedIds, onQuestionLoaded, onSubmit, onEnd }) {
  const [question, setQuestion] = useState(null);
  const [userAnswer, setUserAnswer] = useState('');

  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        const response = await axios.get('http://localhost:3000/getSlang', {
          params: { excludedIds: excludedIds.join(',') },
        });
        if (response.data.message) {
          onEnd();
        } else {
          setQuestion(response.data);
          onQuestionLoaded(response.data);
        }
      } catch (error) {
        console.error('Error fetching question:', error);
      }
    };
    if (!question) {
      fetchQuestion();
    }
  }, [excludedIds, onEnd, onQuestionLoaded, question]); // `question`을 의존성에 추가하여 문제가 설정되면 다시 실행되지 않도록 설정

  const handleSubmit = async () => {
    try {
      const response = await axios.post('http://localhost:3000/compare', {
        questionId: question.id,
        userAnswer: userAnswer,
      });
      onSubmit(response.data);
    } catch (error) {
      console.error('Error submitting answer:', error);
    }
  };

  if (!question) return <div>로딩 중...</div>;

  return (
    <div className="quiz-page">
      <h2>다음 슬랭의 의미를 영어로 작성하세요:</h2>
      <p className="question">{question.korean}</p>
      <input
        type="text"
        value={userAnswer}
        onChange={(e) => setUserAnswer(e.target.value)}
        placeholder="Your answer"
      />
      <button onClick={handleSubmit}>확인</button>
    </div>
  );
}

export default QuizPage;
