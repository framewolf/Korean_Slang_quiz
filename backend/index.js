require('dotenv').config();
const axios = require('axios');
const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');
const { HfInference } = require('@huggingface/inference');

const app = express();

// Hugging Face Inference 인스턴스 생성
const hf = new HfInference(process.env.HUGGING_FACE_API_TOKEN);

let corsOptions = {
    origin: '*',
    credentials: true
  }
app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const slangList = [
    { id: 0, korean: "킹받네", english: "I'm so annoyed" },
    { id: 1, korean: "갑분싸", english: "The mood suddenly turned awkward" },
    { id: 2, korean: "빵터지다", english: "Burst into laughter" },
    { id: 3, korean: "짤", english: "Meme or funny picture" },
    { id: 4, korean: "아싸", english: "Outsider (someone who is not part of a social group)" },
    { id: 5, korean: "쪼렙", english: "Noob (low-level player or beginner)" },
  ];

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

  try {
    // 프롬프트 구성
    const prompt = `Do the following two sentences have the same meaning? Answer only with "Yes" or "No".\n\nSentence 1: "${userAnswer}"\nSentence 2: "${correctAnswer}"`;

    // Hugging Face Inference API 호출
    const response = await hf.chatCompletion({
      model: 'google/gemma-2-2b-it',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.0, // 응답의 일관성을 높이기 위해 온도 낮춤
      max_tokens: 10,   // 응답 길이 제한
    });

    // 응답에서 'Yes' 또는 'No' 추출
    const assistantMessage = response.generated_text.trim().toLowerCase();

    let isSameMeaning = false;
    if (assistantMessage.startsWith('yes')) {
      isSameMeaning = true;
    } else if (assistantMessage.startsWith('no')) {
      isSameMeaning = false;
    } else {
      // 예상치 못한 응답 처리
      return res.status(500).json({ error: 'Unexpected response from the model.' });
    }

    if (isSameMeaning) {
      res.json({ is_same_meaning: true });
    } else {
      res.json({ is_same_meaning: false, correct_answer: correctAnswer });
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


module.exports.handler = serverless(app);