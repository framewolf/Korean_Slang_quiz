import React, { useState, useEffect } from 'react';
import axios from 'axios';

function QuizPage({ excludedIds, onQuestionLoaded, onSubmit, onEnd }) {
  const [question, setQuestion] = useState(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null); // 오류 상태 추가

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
  }, [excludedIds, onEnd, onQuestionLoaded, question]);

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError(null); // 오류 상태 초기화

    try {
      const response = await axios.post('http://localhost:3000/compare', {
        questionId: question.id,
        userAnswer: userAnswer,
      });

      if (response.status === 200) {
        onSubmit(response.data);
      } else {
        setError('답변 제출 중 문제가 발생했습니다.');
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      setError('Failed to communicate with the server. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!question) return <div>로딩 중...</div>;

  return (
    <div className="container quiz-page">
      <h2>Translate the following Korean slang into English:</h2>
      <p className="question">{question.korean}</p>
      <input
        type="text"
        value={userAnswer}
        onChange={(e) => setUserAnswer(e.target.value)}
        placeholder="Enter your answer here"
      />
      <button onClick={handleSubmit} disabled={isSubmitting}>
        {isSubmitting ? 'Submitting...' : 'Submit'}
      </button>
      {error && <p className="error">{error}</p>}
    </div>
  );
}

export default QuizPage;
