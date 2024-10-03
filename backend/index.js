// index.js

require('dotenv').config();
const axios = require('axios');
const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');
const { HfInference } = require('@huggingface/inference');

const app = express();

// Hugging Face Inference 인스턴스 생성
const hf = new HfInference(process.env.HUGGING_FACE_API_TOKEN);

const corsOptions = {
  origin: '*',
  credentials: true
};
app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// slangList 가져오기 (CommonJS 방식)
const slangList = require('./slangList');
// console.log('Slang List Loaded:', slangList); 

// GET /getSlang - 슬랭 문제 제공 (이미 출제된 문제 제외)
app.get('/getSlang', (req, res) => {
  const excludedIds = req.query.excludedIds
    ? req.query.excludedIds.split(',').map(Number)
    : [];

  // 제외할 ID를 제외한 슬랭 리스트 생성
  const availableSlangs = slangList.filter(slang => !excludedIds.includes(slang.id));

  if (availableSlangs.length === 0) {
    return res.json({ message: '더 이상 남은 문제가 없습니다.' });
  }

  const randomIndex = Math.floor(Math.random() * availableSlangs.length);
  const selectedSlang = availableSlangs[randomIndex];

  res.json({ id: selectedSlang.id, korean: selectedSlang.korean });
});

function withTimeout(promise, ms) {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Request timed out')), ms)
  );
  return Promise.race([promise, timeout]);
}

// POST /compare - 사용자의 답변 검증
app.post('/compare', async (req, res) => {
  const questionId = req.body.questionId;
  const userAnswer = req.body.userAnswer.trim();

  // 서버에서 correctAnswer 가져오기
  const question = slangList.find(slang => slang.id === questionId);

  if (!question) {
    return res.status(400).json({ error: 'Invalid question ID.' });
  }

  const correctAnswer = question.english.trim();

  // 프롬프트 구성
  const prompt = `Consider the following two sentences and determine if they convey the same meaning, even if they use different words or phrasing. Take into account synonyms and similar concepts. Answer only with "Yes" or "No".\n\nSentence 1: "${userAnswer}"\nSentence 2: "${correctAnswer}"`;

  const maxRetries = 3;
  let retries = 0;
  let success = false;
  let assistantMessage = '';

  while (retries < maxRetries && !success) {
    try {
      // 요청 시간 제한 설정 (예: 10초)
      const timeoutMs = 10000;

      // API 호출에 타임아웃 적용
      const response = await withTimeout(
        hf.chatCompletion({
          model: 'google/gemma-2-2b-it',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.0,
          max_tokens: 10,
        }),
        timeoutMs
      );

      assistantMessage = response.choices[0].message.content.trim().toLowerCase();
      success = true; // 요청이 성공하면 루프 탈출

    } catch (error) {
      console.error('Error:', error.message);
      retries++;
      console.log(`Retrying... (${retries}/${maxRetries})`);

      // 타임아웃 에러가 발생한 경우 추가 처리
      if (error.message === 'Request timed out') {
        console.log('Request timed out. Retrying...');
      } else {
        // 다른 종류의 에러인 경우에도 재시도할지 결정해야 함
        // 여기서는 모든 에러에 대해 재시도
      }
    }
  }

  if (!success) {
    return res.status(500).json({ error: 'Failed to get a response from the model.' });
  }

  let isSameMeaning = false;
  if (assistantMessage.startsWith('yes')) {
    isSameMeaning = true;
  } else if (assistantMessage.startsWith('no')) {
    isSameMeaning = false;
  } else {
    return res.status(500).json({ error: 'Unexpected response from the model.' });
  }

  res.json({
    is_same_meaning: isSameMeaning,
    correct_answer: correctAnswer,
  });
});

// 서버 실행
if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`서버가 http://localhost:${port} 에서 실행 중입니다.`);
  });
} else {
  module.exports.handler = serverless(app);
}
