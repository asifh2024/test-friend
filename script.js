
/* ========================================
   CONFIGURATION
======================================== */

const WEB3FORMS_ACCESS_KEY = "06beb580-5c7e-4eaa-b083-6e7534924d33";

const STORAGE_KEY = "friendshipQuizResult_v1";


/* ========================================
   STATE
======================================== */

let questions = [];
let friendName = "";
let currentQuestion = 0;
let answers = [];
let quizFinished = false;


/* ========================================
   DOM ELEMENTS
======================================== */

const welcomeScreen = document.getElementById("welcomeScreen");
const quizScreen = document.getElementById("quizScreen");
const resultScreen = document.getElementById("resultScreen");

const friendNameInput = document.getElementById("friendName");
const welcomeError = document.getElementById("welcomeError");

const startButton = document.getElementById("startButton");
const previousButton = document.getElementById("previousButton");
const nextButton = document.getElementById("nextButton");
const submitButton = document.getElementById("submitButton");

const questionCounter = document.getElementById("questionCounter");
const progressPercentage = document.getElementById("progressPercentage");
const progressBar = document.getElementById("progressBar");

const questionText = document.getElementById("questionText");
const optionsContainer = document.getElementById("optionsContainer");
const selectionMessage = document.getElementById("selectionMessage");

const resultHeading = document.getElementById("resultHeading");
const resultGreeting = document.getElementById("resultGreeting");
const scoreValue = document.getElementById("scoreValue");
const resultMessage = document.getElementById("resultMessage");
const resultDescription = document.getElementById("resultDescription");
const resultEmoji = document.getElementById("resultEmoji");

const wrongQuestionSummary = document.getElementById("wrongQuestionSummary");
const solutionsContainer = document.getElementById("solutionsContainer");
const submissionStatus = document.getElementById("submissionStatus");


/* ========================================
   LOAD QUESTIONS FROM JSON
======================================== */

async function loadQuestions() {
    const response = await fetch("./questions.json", {
        cache: "no-store"
    });

    if (!response.ok) {
        throw new Error("Unable to load questions.json.");
    }

    const data = await response.json();

    if (
        !data ||
        !Array.isArray(data.questions) ||
        data.questions.length === 0
    ) {
        throw new Error("The questions.json file has no questions.");
    }

    const ids = new Set();

    data.questions.forEach((question) => {
        if (
            !Number.isInteger(question.id) ||
            typeof question.question !== "string" ||
            !question.question.trim() ||
            !Array.isArray(question.options) ||
            question.options.length < 2 ||
            question.options.some(
                option => typeof option !== "string" || !option.trim()
            ) ||
            !Number.isInteger(question.correctAnswer) ||
            question.correctAnswer < 0 ||
            question.correctAnswer >= question.options.length ||
            typeof question.explanation !== "string"
        ) {
            throw new Error(
                `Question ${question.id ?? "unknown"} has invalid data.`
            );
        }

        if (ids.has(question.id)) {
            throw new Error(`Duplicate question ID: ${question.id}`);
        }

        ids.add(question.id);
    });

    questions = data.questions;
    answers = new Array(questions.length).fill(null);
}


/* ========================================
   START QUIZ
======================================== */

startButton.addEventListener("click", () => {
    const enteredName = friendNameInput.value.trim();

    if (!enteredName) {
        welcomeError.textContent = "Please enter your name first.";
        friendNameInput.focus();
        return;
    }

    if (questions.length === 0) {
        welcomeError.textContent =
            "Questions are still loading. Please try again.";
        return;
    }

    friendName = enteredName;
    currentQuestion = 0;
    answers = new Array(questions.length).fill(null);
    quizFinished = false;

    welcomeError.textContent = "";

    welcomeScreen.classList.add("hidden");
    resultScreen.classList.add("hidden");
    quizScreen.classList.remove("hidden");

    renderQuestion();
});


/* ========================================
   RENDER QUESTION
======================================== */

function renderQuestion() {
    const question = questions[currentQuestion];

    questionCounter.textContent =
        `Question ${currentQuestion + 1} of ${questions.length}`;

    const percentage = Math.round(
        ((currentQuestion + 1) / questions.length) * 100
    );

    progressPercentage.textContent = `${percentage}%`;
    progressBar.style.width = `${percentage}%`;

    questionText.textContent = question.question;

    optionsContainer.replaceChildren();
    selectionMessage.textContent = "";

    question.options.forEach((optionText, index) => {
        const label = document.createElement("label");
        label.className = "option";

        const radio = document.createElement("input");
        radio.type = "radio";
        radio.name = "quizAnswer";
        radio.value = String(index);
        radio.checked = answers[currentQuestion] === index;

        const text = document.createElement("span");
        text.textContent = optionText;

        if (radio.checked) {
            label.classList.add("selected");
        }

        radio.addEventListener("change", () => {
            answers[currentQuestion] = index;

            optionsContainer
                .querySelectorAll(".option")
                .forEach(option => option.classList.remove("selected"));

            label.classList.add("selected");
            selectionMessage.textContent = "Answer selected 💗";
        });

        label.append(radio, text);
        optionsContainer.appendChild(label);
    });

    previousButton.classList.toggle("hidden", currentQuestion === 0);

    const lastQuestion = currentQuestion === questions.length - 1;

    nextButton.classList.toggle("hidden", lastQuestion);
    submitButton.classList.toggle("hidden", !lastQuestion);
}


/* ========================================
   NAVIGATION
======================================== */

nextButton.addEventListener("click", () => {
    if (answers[currentQuestion] === null) {
        selectionMessage.textContent =
            "Please select an answer before continuing.";
        return;
    }

    if (currentQuestion < questions.length - 1) {
        currentQuestion++;
        renderQuestion();
    }
});


previousButton.addEventListener("click", () => {
    if (currentQuestion > 0) {
        currentQuestion--;
        renderQuestion();
    }
});


/* ========================================
   CALCULATE SCORE
======================================== */

function calculateScore(selectedAnswers) {
    return questions.reduce((score, question, index) => {
        return score +
            (selectedAnswers[index] === question.correctAnswer ? 1 : 0);
    }, 0);
}


/* ========================================
   FIND WRONG QUESTIONS
======================================== */

function getWrongQuestions(selectedAnswers) {
    return questions
        .map((question, index) => ({
            question,
            index,
            selectedAnswer: selectedAnswers[index]
        }))
        .filter(item => {
            return item.selectedAnswer !== item.question.correctAnswer;
        });
}


/* ========================================
   RESULT MESSAGES
======================================== */

function getResult(score) {
    const total = questions.length;
    const percentage = (score / total) * 100;

    if (percentage <= 30) {
        return {
            emoji: "🥹",
            message: "Ab aap hi batao kitna jaante ho mujhe",
            description:
                "There's still a lot for you to discover about me. " +
                "Khair chhoro...!"
        };
    }

    if (percentage <= 70) {
        return {
            emoji: "😊",
            message: "Kya hi kahun sahi hai",
            description:
                "You know a few things about me, khair...chhoro aise hi puchh liya!"
        };
    }

    if (percentage <= 80) {
        return {
            emoji: "💖",
            message: "You're a pretty good friend!",
            description:
                "You know me quite well! I'm glad we've shared so many moments."
        };
    }

    return {
        emoji: "🥰",
        message: "You're an amazing friend!",
        description:
            "Wow! You know me really well. I'm lucky to have a friend like you!"
    };
}


/* ========================================
   DISPLAY WRONG ANSWERS AND SOLUTIONS
======================================== */

function displaySolutions(selectedAnswers) {
    const wrongQuestions = getWrongQuestions(selectedAnswers);

    solutionsContainer.replaceChildren();

    if (wrongQuestions.length === 0) {
        wrongQuestionSummary.textContent =
            "Wrong question numbers: None 🎉";

        const congratulations = document.createElement("div");
        congratulations.className = "all-correct";
        congratulations.textContent =
            "🥰 Perfect score! You answered every question correctly. " +
            "You really know me well!";

        solutionsContainer.appendChild(congratulations);

        return wrongQuestions;
    }

    const wrongIds = wrongQuestions.map(item => item.question.id);

    wrongQuestionSummary.textContent =
        `Wrong question numbers: ${wrongIds.join(", ")}`;

    wrongQuestions.forEach(item => {
        const question = item.question;
        const selectedIndex = item.selectedAnswer;

        const card = document.createElement("article");
        card.className = "solution-card";

        const heading = document.createElement("h3");
        heading.textContent =
            `Question ${question.id}: ${question.question}`;

        const yourAnswer = document.createElement("div");
        yourAnswer.className = "answer-row your-answer";

        const selectedText =
            selectedIndex === null
                ? "Not answered"
                : question.options[selectedIndex];

        yourAnswer.textContent = `❌ Your answer: ${selectedText}`;

        const correctAnswer = document.createElement("div");
        correctAnswer.className = "answer-row correct-answer";

        correctAnswer.textContent =
            `✅ Correct answer: ${question.options[question.correctAnswer]}`;

        const explanation = document.createElement("p");
        explanation.className = "explanation";

        const explanationTitle = document.createElement("strong");
        explanationTitle.textContent = "💡 Explanation: ";

        explanation.appendChild(explanationTitle);
        explanation.appendChild(
            document.createTextNode(question.explanation)
        );

        card.append(
            heading,
            yourAnswer,
            correctAnswer,
            explanation
        );

        solutionsContainer.appendChild(card);
    });

    return wrongQuestions;
}


/* ========================================
   DISPLAY RESULT SCREEN
======================================== */

function showResult(name, selectedAnswers, score) {
    const result = getResult(score);

    welcomeScreen.classList.add("hidden");
    quizScreen.classList.add("hidden");
    resultScreen.classList.remove("hidden");

    resultHeading.textContent = "Your Friendship Result!";
    resultGreeting.textContent =
        `Hey ${name}, here's your friendship score!`;

    scoreValue.textContent = `${score}/${questions.length}`;

    resultEmoji.textContent = result.emoji;
    resultMessage.textContent = result.message;
    resultDescription.textContent = result.description;

    displaySolutions(selectedAnswers);

    return result;
}


/* ========================================
   SAVE RESULT IN LOCAL STORAGE
======================================== */

function saveResultLocally(name, selectedAnswers, score, result) {
    const savedResult = {
        version: 1,
        name,
        answers: selectedAnswers,
        score,
        totalQuestions: questions.length,
        result,
        completedAt: new Date().toISOString()
    };

    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(savedResult)
        );

        return true;
    } catch (error) {
        console.error("Unable to save the result:", error);
        return false;
    }
}


/* ========================================
   RESTORE PREVIOUS RESULT
======================================== */

function restorePreviousResult() {
    try {
        const savedData = localStorage.getItem(STORAGE_KEY);

        if (!savedData) {
            return false;
        }

        const saved = JSON.parse(savedData);

        const valid =
            saved &&
            saved.version === 1 &&
            typeof saved.name === "string" &&
            Array.isArray(saved.answers) &&
            saved.answers.length === questions.length &&
            saved.answers.every((answer, index) => {
                return Number.isInteger(answer) &&
                    answer >= 0 &&
                    answer < questions[index].options.length;
            }) &&
            Number.isInteger(saved.score) &&
            saved.score >= 0 &&
            saved.score <= questions.length;

        if (!valid) {
            localStorage.removeItem(STORAGE_KEY);
            return false;
        }

        const calculatedScore = calculateScore(saved.answers);

        if (calculatedScore !== saved.score) {
            localStorage.removeItem(STORAGE_KEY);
            return false;
        }

        friendName = saved.name;
        answers = saved.answers;
        quizFinished = true;

        showResult(saved.name, saved.answers, saved.score);

        submissionStatus.textContent =
            "Your previous result has been restored from this browser.";

        return true;

    } catch (error) {
        console.error("Unable to restore the previous result:", error);

        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch (_) {
            // Ignore storage errors.
        }

        return false;
    }
}


/* ========================================
   WEB3FORMS EMAIL

   Sends only these four result fields:
   1. Name
   2. Score
   3. Result message
   4. Wrong question numbers
======================================== */


async function sendResultEmail(name, score, result, wrongQuestions) {
    const accessKey = WEB3FORMS_ACCESS_KEY.trim();

    if (!accessKey) {
        throw new Error("Access key is empty. Add your Web3Forms access key.");
    }

    const wrongNumbers = wrongQuestions.length
        ? wrongQuestions.map(item => item.question.id).join(", ")
        : "None";

    const formData = new FormData();

    formData.append("access_key", accessKey);
    formData.append("name", name);
    formData.append("score", `${score}/${questions.length}`);
    formData.append("result_message", result.message);
    formData.append("wrong_question_numbers", wrongNumbers);
    formData.append("subject", "New Friendship Quiz Result");

    let response;

    try {
        response = await fetch("https://api.web3forms.com/submit", {
            method: "POST",
            body: formData
        });
    } catch (error) {
        throw new Error(
            "Network request failed. Check your internet connection or browser console."
        );
    }

    const responseText = await response.text();

    let data;

    try {
        data = JSON.parse(responseText);
    } catch {
        throw new Error(
            `Web3Forms returned an unexpected response (HTTP ${response.status}).`
        );
    }

    if (!response.ok || !data.success) {
        throw new Error(
            data.message || `Email failed with HTTP ${response.status}.`
        );
    }

    return data;
}


/* ========================================
   FINISH QUIZ
======================================== */

submitButton.addEventListener("click", async () => {
    if (quizFinished) {
        return;
    }

    const unansweredIndex = answers.findIndex(
        answer => answer === null
    );

    if (unansweredIndex !== -1) {
        currentQuestion = unansweredIndex;
        renderQuestion();

        selectionMessage.textContent =
            "Please answer this question before submitting.";

        return;
    }

    quizFinished = true;
    submitButton.disabled = true;
    submitButton.textContent = "Submitting...";

    const finalAnswers = [...answers];
    const score = calculateScore(finalAnswers);
    const result = getResult(score);
    const wrongQuestions = getWrongQuestions(finalAnswers);

    /*
     * Display the result and save it before attempting email.
     * Email errors will not prevent the friend from seeing the result.
     */

    showResult(friendName, finalAnswers, score);

    const saved = saveResultLocally(
        friendName,
        finalAnswers,
        score,
        result
    );

    if (!saved) {
        submissionStatus.textContent =
            "Your result is visible, but this browser could not save it.";
    } else {
        submissionStatus.textContent =
            "Your result is saved. Sending your result by email...";
    }

    try {
        await sendResultEmail(
            friendName,
            score,
            result,
            wrongQuestions
        );

        submissionStatus.textContent = saved
            ? "I have sent this result to Your friend Asif."
            : "I have sent this result to Your friend.";

    } catch (error) {
        console.error("Email submission failed:", error);

        submissionStatus.textContent =
            "Your result is ready, but I can't send to Asif. " +
            "Please check your internet connection and try again after clear cookies & site data ";
    }
});


/* ========================================
   INITIALIZE WEBSITE
======================================== */

async function initializeQuiz() {
    startButton.disabled = true;
    startButton.textContent = "Loading questions...";

    try {
        await loadQuestions();

        startButton.disabled = false;
        startButton.textContent = "Let's Start 💖";

        const restored = restorePreviousResult();

        if (!restored) {
            welcomeScreen.classList.remove("hidden");
        }

    } catch (error) {
        console.error("Quiz initialization failed:", error);

        startButton.disabled = true;
        startButton.textContent = "Questions could not load";

        welcomeError.textContent =
            "Unable to load the quiz questions. Please try again later.";
    }
}

initializeQuiz();
