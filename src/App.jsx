import { useState, useRef } from "react";
import { motion } from "framer-motion";
import Particles from "react-tsparticles";
import { loadFull } from "tsparticles";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

async function askGemini(prompt) {
  try {
    const res = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": GEMINI_API_KEY,
        },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      }
    );
    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response from Gemini.";
  } catch (err) {
    console.error(err);
    return "Error contacting Gemini API.";
  }
}

function App() {
  const [topic, setTopic] = useState("");
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const aboutRef = useRef(null);

  const scrollToAbout = () => {
    aboutRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const generateQuestions = async () => {
    if (!topic.trim()) return alert("Enter a topic or role!");
    setLoading(true);

    const prompt = `Generate 5 simple AI interview questions about ${topic}. Return as a numbered list.`;
    const q = await askGemini(prompt);

    const qArray = q
      .split(/\d+\.\s+/)
      .filter((item) => item.trim())
      .map((item, idx) => ({ number: idx + 1, question: item.trim() }));

    setQuestions(qArray);
    setCurrentIndex(0);
    setAnswer("");
    setFeedback("");
    setLoading(false);
  };

  const evaluateAnswer = async () => {
    if (!answer.trim()) return alert("Enter your answer!");
    setLoading(true);
    const fb = await askGemini(
      `Evaluate this answer: "${answer}" for the question: "${questions[currentIndex].question}". Provide short constructive feedback.`
    );
    setFeedback(fb);
    setLoading(false);
  };

  const nextQuestion = () => {
    setAnswer("");
    setFeedback("");
    if (currentIndex + 1 < questions.length) setCurrentIndex(currentIndex + 1);
    else setQuestions([]);
  };

  const particlesInit = async (main) => {
    await loadFull(main);
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-indigo-900 via-slate-950 to-emerald-900 text-white font-sans overflow-x-hidden">
      {/* Particles Background */}
      <Particles
        id="tsparticles"
        init={particlesInit}
        options={{
          fpsLimit: 60,
          interactivity: { events: { onHover: { enable: true, mode: "repulse" } } },
          particles: {
            color: { value: "#10b981" },
            links: { color: "#10b981", distance: 150, enable: true, opacity: 0.2, width: 1 },
            move: { enable: true, speed: 1, outModes: "bounce" },
            number: { value: 50 },
            size: { value: { min: 2, max: 4 } },
            opacity: { value: 0.6 },
          },
        }}
        className="absolute top-0 left-0 w-full h-full z-0"
      />

      {/* Header */}
      <header className="relative z-10 flex flex-col items-center justify-center pt-20 gap-6 text-center">
        <h1 className="text-6xl font-extrabold animate-bounce">QuesAI</h1>
        <p className="text-2xl max-w-3xl">
          AI-powered interview question generator and answer evaluator. Practice multiple questions in sequence.
        </p>
        <button
          onClick={scrollToAbout}
          className="mt-6 px-8 py-3 bg-emerald-600 rounded-xl hover:bg-emerald-700 text-lg font-semibold transition transform hover:scale-105"
        >
          Learn More About QuesAI
        </button>
      </header>

      {/* Quiz Section */}
      <main className="relative z-10 pt-20 flex flex-col items-center gap-16 px-4">
        <section className="w-full max-w-4xl p-12 rounded-3xl shadow-2xl bg-gradient-to-r from-slate-700 via-slate-800 to-slate-700 flex flex-col gap-8 transition transform hover:scale-105">
          <h2 className="text-4xl font-bold text-center mb-6">Practice Interview Questions</h2>

          {questions.length === 0 && (
            <div className="flex flex-col gap-6 items-center">
              <input
                type="text"
                placeholder="Enter role or topic..."
                className="p-4 rounded-xl text-black w-full focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
              <button
                onClick={generateQuestions}
                className="px-10 py-4 bg-emerald-600 rounded-xl hover:bg-emerald-700 text-lg font-semibold transition transform hover:scale-105"
              >
                Generate Questions
              </button>
            </div>
          )}

          {loading && <p className="text-lg text-center mt-4">Processing...</p>}

          {questions.length > 0 && !loading && (
            <div className="flex flex-col gap-6">
              <h3 className="text-2xl font-semibold">
                Question {questions[currentIndex].number}:
              </h3>
              <p className="text-lg">{questions[currentIndex].question}</p>
              <textarea
                placeholder="Type your answer..."
                className="w-full p-4 rounded-xl text-black mb-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
              />
              <button
                onClick={evaluateAnswer}
                className="px-8 py-3 bg-blue-600 rounded-xl hover:bg-blue-700 text-lg font-semibold transition transform hover:scale-105"
              >
                Get Feedback
              </button>

              {feedback && (
                <div className="p-6 mt-4 bg-slate-600 rounded-2xl shadow-inner transition transform hover:scale-105">
                  <p>{feedback}</p>
                  <button
                    onClick={nextQuestion}
                    className="mt-4 px-8 py-3 bg-emerald-600 rounded-xl hover:bg-emerald-700 text-lg font-semibold transition transform hover:scale-105"
                  >
                    {currentIndex + 1 < questions.length ? "Next Question" : "Finish Quiz"}
                  </button>
                </div>
              )}
            </div>
          )}
        </section>

        {/* About Section */}
        <section
          ref={aboutRef}
          className="w-full max-w-5xl p-12 rounded-3xl shadow-2xl bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 flex flex-col gap-12"
        >
          <h2 className="text-5xl font-bold text-center mb-6">About QuesAI</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                title: "Interactive Practice",
                text: "Generate interview questions for any domain and answer them to get instant AI feedback.",
                color: "bg-indigo-700",
              },
              {
                title: "AI Evaluation",
                text: "Receive constructive AI feedback on your answers, helping you improve quickly.",
                color: "bg-green-700",
              },
              {
                title: "Multiple Domains",
                text: "Practice questions across tech, AI, programming, and more with easy topic selection.",
                color: "bg-purple-700",
              },
              {
                title: "Progress Tracking",
                text: "Stay engaged and track your learning journey efficiently.",
                color: "bg-teal-700",
              },
            ].map((card, i) => (
              <motion.div
                key={i}
                className={`${card.color} p-6 rounded-xl shadow-lg`}
                variants={cardVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
              >
                <h3 className="text-2xl font-semibold mb-2">{card.title}</h3>
                <p>{card.text}</p>
              </motion.div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
