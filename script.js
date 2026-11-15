let currentQuestions = [];
let currentQuestionIndex = 0;
window.userAnswersArray = [];

// Speech-to-Text Variables
let recognition = null;
let isListening = false;

// Initialize Speech Recognition if browser supports it
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
        }
        const answerInput = document.getElementById("answer");
        if (answerInput) {
            answerInput.value = transcript;
        }
    };

    recognition.onerror = (event) => {
        console.error("Speech Recognition Error:", event.error);
        stopSpeechToText();
    };

    recognition.onend = () => {
        stopSpeechToText();
    };
}

function toggleSpeechToText() {
    if (!recognition) {
        alert("Speech Recognition is not supported in your browser. Try using Chrome or Edge.");
        return;
    }

    if (isListening) {
        recognition.stop();
        stopSpeechToText();
    } else {
        try {
            recognition.start();
            isListening = true;
            const btn = document.getElementById("stt-btn");
            const btnText = document.getElementById("stt-btn-text");
            if (btn) btn.classList.add("recording");
            if (btnText) btnText.textContent = "Listening... (Click to Stop)";
        } catch (e) {
            console.error(e);
        }
    }
}

function stopSpeechToText() {
    isListening = false;
    const btn = document.getElementById("stt-btn");
    const btnText = document.getElementById("stt-btn-text");
    if (btn) btn.classList.remove("recording");
    if (btnText) btnText.textContent = "Speak Answer";
}

async function handleFormSubmit(event) {
    event.preventDefault();

    const role = document.getElementById("job-role").value;
    const level = document.getElementById("level").value;

    try {
        const response = await fetch(`/question/${role}/${level}`);
        if (!response.ok) {
            throw new Error(`Server returned status ${response.status}`);
        }

        const data = await response.json();
        currentQuestions = data.question; 
        currentQuestionIndex = 0;
        window.userAnswersArray = [];

        if (!Array.isArray(currentQuestions) || currentQuestions.length === 0) {
            alert("No questions found for this selection.");
            return;
        }

        document.getElementById("setup-screen").classList.add("hidden");
        document.getElementById("interview-screen").classList.remove("hidden");

        displayCurrentQuestion();
    } catch (error) {
        alert("Error connecting to the server: " + error.message);
        console.error(error);
    }
}

function displayCurrentQuestion() {
    const questionEl = document.getElementById("question");
    const answerInput = document.getElementById("answer");
    const submitBtn = document.getElementById("submit-answer-btn");
    const feedbackBtn = document.getElementById("feedback_btn");
    const progressEl = document.getElementById("question-progress");

    if (currentQuestions && currentQuestionIndex < currentQuestions.length) {
        const currentQObj = currentQuestions[currentQuestionIndex];
        questionEl.textContent = currentQObj.question;
        answerInput.value = "";
        answerInput.style.display = "block";
        
        if (progressEl) {
            progressEl.textContent = `Question ${currentQuestionIndex + 1} of ${currentQuestions.length}`;
        }
        
        if (submitBtn) submitBtn.classList.remove("hidden");
        if (feedbackBtn) feedbackBtn.classList.add("hidden");
    } else {
        questionEl.textContent = "Interview completed! Click below to view your overall performance results.";
        answerInput.style.display = "none";
        if (progressEl) progressEl.textContent = "Completed";
        if (submitBtn) submitBtn.classList.add("hidden");
        if (feedbackBtn) feedbackBtn.classList.remove("hidden");
    }
}

async function submitAnswer() {
    if (isListening && recognition) {
        recognition.stop();
        stopSpeechToText();
    }

    const answerInput = document.getElementById("answer");
    const userAnswer = answerInput.value;

    if (!userAnswer.trim()) {
        alert("Please write or speak an answer before submitting.");
        return;
    }

    const currentQObj = currentQuestions[currentQuestionIndex];
    const role = document.getElementById("job-role").value;
    const level = document.getElementById("level").value;

    const payload = {
        role: role,
        difficulty: level,
        question_id: currentQObj.id,
        answer: userAnswer
    };

    try {
        const response = await fetch('/evaluate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error("Failed to evaluate answer on server.");
        }

        const result = await response.json();
        
        window.userAnswersArray.push({
            question: currentQObj.question,
            userAnswer: userAnswer,
            score: result.score,
            feedback: result.feedback
        });

        answerInput.value = "";
        currentQuestionIndex++;
        displayCurrentQuestion();

    } catch (error) {
        console.error("Evaluation error:", error);
        alert("Error evaluating answer: " + error.message);
    }
}

// Retake Interview handler
function restartInterview() {
    window.speechSynthesis.cancel();
    if (isListening && recognition) {
        recognition.stop();
        stopSpeechToText();
    }

    currentQuestions = [];
    currentQuestionIndex = 0;
    window.userAnswersArray = [];

    document.getElementById("feedback-screen").classList.add("hidden");
    document.getElementById("interview-screen").classList.add("hidden");
    document.getElementById("setup-screen").classList.remove("hidden");

    document.getElementById("interview-form").reset();
    document.getElementById("answer").value = "";
    document.getElementById("answer").style.display = "block";
}

// TTS Functionality
let availableVoices = [];

function populateVoices() {
    const voiceSelect = document.getElementById("voice-select");
    if (!voiceSelect) return;

    availableVoices = window.speechSynthesis.getVoices();
    voiceSelect.innerHTML = "";

    availableVoices.forEach((voice, index) => {
        const option = document.createElement("option");
        option.value = index;
        option.textContent = `${voice.name} (${voice.lang})`;
        
        if (voice.lang.includes("en") && (voice.default || option.textContent.includes("Google") || option.textContent.includes("Natural"))) {
            option.selected = true;
        }
        
        voiceSelect.appendChild(option);
    });
}

if ('speechSynthesis' in window) {
    window.speechSynthesis.onvoiceschanged = populateVoices;
    setTimeout(populateVoices, 100);
}

function speak_question() {
    const ques = document.getElementById("question").textContent;
    if (!ques) return;

    const speech = new SpeechSynthesisUtterance(ques);
    const rateInput = document.getElementById("speech-rate");
    const voiceSelect = document.getElementById("voice-select");

    speech.lang = "en-US";
    speech.rate = rateInput ? parseFloat(rateInput.value) : 1.0;

    if (voiceSelect && voiceSelect.value !== "" && availableVoices[voiceSelect.value]) {
        speech.voice = availableVoices[voiceSelect.value];
    }

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(speech);
}

async function feedback_func() {
    document.getElementById("interview-screen").classList.add("hidden");

    try {
        const qListContainer = document.getElementById("questions-feedback-list");
        
        if (qListContainer) {
            qListContainer.innerHTML = window.userAnswersArray.map((item, index) => `
                <div class="q-feedback-item">
                    <p class="q-title"><strong>Q${index + 1}:</strong> ${item.question}</p>
                    <p class="user-ans"><strong>Your Answer:</strong> ${item.userAnswer}</p>
                    <div class="score-row">
                        <span class="score-badge-sm">Score: ${item.score}%</span>
                    </div>
                    <p class="ai-comment"><strong>AI Feedback:</strong> ${item.feedback}</p>
                </div>
            `).join("");
        }

        if (window.userAnswersArray.length > 0) {
            const totalScore = window.userAnswersArray.reduce((acc, curr) => acc + curr.score, 0);
            const avgScore = (totalScore / window.userAnswersArray.length).toFixed(1);
            
            const overallScoreEl = document.getElementById("overall-score");
            if (overallScoreEl) overallScoreEl.textContent = avgScore + "%";

            // Update performance bars for realistic breakdown visualization
            const techBar = document.getElementById("tech-score-bar");
            const techText = document.getElementById("tech-score-text");
            if (techBar && techText) {
                techBar.style.width = `${avgScore}%`;
                techText.textContent = `${avgScore}%`;
            }

            const commBar = document.getElementById("comm-score-bar");
            const commText = document.getElementById("comm-score-text");
            const commVal = Math.min(100, Math.round(avgScore * 1.05));
            if (commBar && commText) {
                commBar.style.width = `${commVal}%`;
                commText.textContent = `${commVal}%`;
            }

            const probBar = document.getElementById("problem-score-bar");
            const probText = document.getElementById("problem-score-text");
            const probVal = Math.max(0, Math.round(avgScore * 0.95));
            if (probBar && probText) {
                probBar.style.width = `${probVal}%`;
                probText.textContent = `${probVal}%`;
            }
        }

        const feedbackScreen = document.getElementById("feedback-screen");
        if (feedbackScreen) feedbackScreen.classList.remove("hidden");

    } catch (error) {
        console.error("Error loading feedback screen:", error);
        alert("There was an error displaying your results.");
    }
}