const params = new URLSearchParams(location.search);
const type = params.get("type") || "all";
const QUESTION_LIMIT = 50;
const AUTO_NEXT_DELAY = 900;

const quizInfo = {
  webCreative: {
    title: "Webデザイン・クリエイティブ",
    desc: "HTML・CSS・UI/UX・配色・画像・著作権・制作実務の基礎"
  },
  webDesign3: {
    title: "ウェブデザイン技能検定3級",
    desc: "Web制作の基礎、HTML/CSS、アクセシビリティ、インターネットの基本"
  },
  webDesign2: {
    title: "ウェブデザイン技能検定2級",
    desc: "実務レベルの設計、レスポンシブ、CSS設計、運用、セキュリティ"
  },
  webDesign1: {
    title: "ウェブデザイン技能検定1級",
    desc: "上級設計、品質管理、プロジェクト管理、法務、パフォーマンス最適化"
  }
};

const pageTitle = document.getElementById("pageTitle");
const pageDesc = document.getElementById("pageDesc");
const quizList = document.getElementById("quizList");

if (type === "all") {
  document.title = "Webデザイン・クリエイティブ資格クイズ";
  pageTitle.textContent = "Webデザイン・クリエイティブ資格クイズ";
  pageDesc.textContent = "4カテゴリ・各150問から50問ランダムで出題";
} else {
  const info = quizInfo[type] || quizInfo.webCreative;
  document.title = info.title;
  pageTitle.textContent = info.title;
  pageDesc.textContent = info.desc;
}

quizList.innerHTML = `
  <a href="index.html" class="${type === "all" ? "active" : ""}">全カテゴリ50問</a>
  ${Object.keys(quizInfo).map(key => `
    <a href="?type=${key}" class="${type === key ? "active" : ""}">${quizInfo[key].title}</a>
  `).join("")}
`;

function normalizeQuestion(q){
  return { question: q.question || q.q, choices: q.choices || q.c, answer: q.answer || q.a, explanation: q.explanation || q.e || "" };
}
function shuffle(array){ return array.map(v => [Math.random(), v]).sort((a,b) => a[0] - b[0]).map(v => v[1]); }
function uniqueByQuestion(array){
  const seen = new Set();
  return array.filter(q => {
    const key = q.question.trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

let questions = [];
if (type === "all") {
  Object.keys(quizInfo).forEach(key => {
    if (window.quizData && Array.isArray(window.quizData[key])) questions.push(...window.quizData[key].map(normalizeQuestion));
  });
} else {
  questions = window.quizData?.[type] ? window.quizData[type].map(normalizeQuestion) : [];
}
questions = shuffle(uniqueByQuestion(questions)).slice(0, QUESTION_LIMIT);

let currentIndex = 0;
let score = 0;
let answered = false;
let autoTimer = null;

const counter = document.getElementById("counter");
const scoreEl = document.getElementById("score");
const questionEl = document.getElementById("question");
const choicesEl = document.getElementById("choices");
const resultEl = document.getElementById("result");
const nextBtn = document.getElementById("nextBtn");
const progressBar = document.getElementById("progressBar");

function showQuestion() {
  answered = false;
  clearTimeout(autoTimer);
  resultEl.textContent = "";
  nextBtn.style.display = "none";

  if (questions.length === 0) {
    questionEl.textContent = "問題データが読み込めませんでした";
    choicesEl.innerHTML = ""; counter.textContent = "0 / 0"; scoreEl.textContent = "スコア: 0"; progressBar.style.width = "0%"; return;
  }
  if (currentIndex >= questions.length) {
    questionEl.textContent = "終了！"; choicesEl.innerHTML = ""; counter.textContent = `${questions.length} / ${questions.length}`;
    scoreEl.textContent = `スコア: ${score}`; resultEl.textContent = `${questions.length}問中 ${score}問正解`; progressBar.style.width = "100%"; return;
  }

  const q = questions[currentIndex];
  counter.textContent = `${currentIndex + 1} / ${questions.length}`;
  scoreEl.textContent = `スコア: ${score}`;
  questionEl.textContent = q.question;
  progressBar.style.width = `${((currentIndex + 1) / questions.length) * 100}%`;
  choicesEl.innerHTML = "";

  q.choices.forEach(choice => {
    const btn = document.createElement("button");
    btn.textContent = choice;
    btn.onclick = () => answerQuestion(choice, btn, q);
    choicesEl.appendChild(btn);
  });
}

function answerQuestion(choice, btn, q){
  if (answered) return;
  answered = true;
  if (choice === q.answer) { score++; resultEl.textContent = "正解！"; btn.classList.add("correct"); }
  else { resultEl.textContent = `不正解。正解は「${q.answer}」`; btn.classList.add("wrong"); }
  [...choicesEl.children].forEach(b => { b.disabled = true; if (b.textContent === q.answer) b.classList.add("correct"); });
  if (q.explanation) resultEl.textContent += ` ${q.explanation}`;
  scoreEl.textContent = `スコア: ${score}`;
  nextBtn.style.display = "block";
  autoTimer = setTimeout(() => { currentIndex++; showQuestion(); }, AUTO_NEXT_DELAY);
}

nextBtn.onclick = () => { clearTimeout(autoTimer); currentIndex++; showQuestion(); };
showQuestion();
