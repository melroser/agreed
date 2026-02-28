"use client";

import { useState, useEffect } from "react";

interface Employee {
  id: string;
  name: string;
  departmentName: string;
  roleTitle: string;
  roleFunction: string;
}

interface Question {
  id: string;
  skillId: string;
  prompt: string;
}

const LEVELS = [
  { value: 1, label: "Curious Explorer", emoji: "🌱", color: "border-emerald-300 bg-emerald-50 text-emerald-800" },
  { value: 2, label: "Engaged Learner", emoji: "📗", color: "border-teal-300 bg-teal-50 text-teal-800" },
  { value: 3, label: "Practical Implementer", emoji: "⚡", color: "border-green-400 bg-green-50 text-green-800" },
  { value: 4, label: "Conscious Changemaker", emoji: "🌍", color: "border-green-600 bg-green-100 text-green-900" },
];

export default function AssessmentPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [roleFunction, setRoleFunction] = useState("");
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<"select" | "assess" | "submitting" | "done">("select");
  const [xpEarned, setXpEarned] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/employees")
      .then((r) => r.json())
      .then((d) => setEmployees(d.employees || []))
      .finally(() => setLoading(false));
  }, []);

  const startAssessment = async () => {
    if (!selectedEmployeeId) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/assessment/questions?employeeId=${selectedEmployeeId}`);
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "Failed to load questions");
        return;
      }
      const data = await res.json();
      setQuestions(data.questions);
      setRoleFunction(data.roleFunction);
      setAnswers({});
      setCurrentIndex(0);
      setPhase("assess");
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  const setAnswer = (questionId: string, level: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: level }));
  };

  const handleSubmit = async () => {
    setPhase("submitting");
    setError("");
    try {
      const responses = questions.map((q) => ({
        questionId: q.id,
        skillId: q.skillId,
        level: answers[q.id] || 1,
      }));
      const res = await fetch("/api/assessment/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: selectedEmployeeId, responses }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "Submission failed");
        setPhase("assess");
        return;
      }
      const data = await res.json();
      setXpEarned(data.xpEarned || 0);
      setPhase("done");
    } catch {
      setError("Network error");
      setPhase("assess");
    }
  };

  const answeredCount = Object.keys(answers).length;
  const progress = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;
  const allAnswered = answeredCount === questions.length;
  const currentQ = questions[currentIndex];
  const selectedEmployee = employees.find((e) => e.id === selectedEmployeeId);

  // --- DONE SCREEN ---
  if (phase === "done") {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <div className="text-6xl mb-4">🎉</div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Assessment Complete!</h1>
        <p className="text-gray-500 mb-6">
          {selectedEmployee?.name}&apos;s skills have been recorded.
        </p>
        {xpEarned > 0 && (
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-50 border border-yellow-200 rounded-xl mb-6">
            <span className="text-2xl">⭐</span>
            <span className="text-lg font-bold text-yellow-700">+{xpEarned} XP earned!</span>
          </div>
        )}
        {xpEarned === 0 && (
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-green-50 border border-green-200 rounded-xl mb-6">
            <span className="text-2xl">✅</span>
            <span className="text-lg font-semibold text-green-700">Baseline assessment recorded</span>
          </div>
        )}
        <div>
          <button
            onClick={() => { setPhase("select"); setSelectedEmployeeId(""); setQuestions([]); setAnswers({}); }}
            className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            Assess Another Employee
          </button>
        </div>
      </div>
    );
  }

  // --- SUBMITTING SCREEN ---
  if (phase === "submitting") {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <div className="text-4xl mb-4 animate-bounce">📊</div>
        <p className="text-gray-500">Submitting assessment and calculating XP...</p>
      </div>
    );
  }

  // --- ASSESSMENT SCREEN ---
  if (phase === "assess" && currentQ) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-800">📝 Skill Assessment</h1>
            <p className="text-sm text-gray-500">
              {selectedEmployee?.name} &middot; {roleFunction}
            </p>
          </div>
          <span className="text-sm text-gray-400">
            {answeredCount}/{questions.length} answered
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-8">
          <div
            className="bg-green-500 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Question navigation dots */}
        <div className="flex flex-wrap gap-1.5 mb-6">
          {questions.map((q, i) => (
            <button
              key={q.id}
              onClick={() => setCurrentIndex(i)}
              className={`w-7 h-7 rounded-full text-xs font-medium transition-colors ${
                i === currentIndex
                  ? "bg-green-600 text-white"
                  : answers[q.id]
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-400"
              }`}
              aria-label={`Go to question ${i + 1}`}
            >
              {i + 1}
            </button>
          ))}
        </div>

        {/* Current question */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <p className="text-sm text-gray-400 mb-2">Question {currentIndex + 1} of {questions.length}</p>
          <p className="text-lg font-medium text-gray-800 mb-6">{currentQ.prompt}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {LEVELS.map((lvl) => (
              <button
                key={lvl.value}
                onClick={() => setAnswer(currentQ.id, lvl.value)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all text-left ${
                  answers[currentQ.id] === lvl.value
                    ? lvl.color + " ring-2 ring-offset-1 ring-green-400"
                    : "border-gray-200 hover:border-gray-300 bg-white"
                }`}
                aria-pressed={answers[currentQ.id] === lvl.value}
              >
                <span className="text-xl">{lvl.emoji}</span>
                <div>
                  <div className="text-sm font-semibold">{lvl.value}. {lvl.label}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            disabled={currentIndex === 0}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 disabled:opacity-30 transition-colors"
          >
            ← Previous
          </button>

          {currentIndex < questions.length - 1 ? (
            <button
              onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
              className="px-6 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!allAnswered}
              className="px-6 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {allAnswered ? "Submit Assessment ✨" : `Answer all questions (${answeredCount}/${questions.length})`}
            </button>
          )}
        </div>

        {error && <p className="text-red-600 text-sm mt-4 text-center">{error}</p>}
      </div>
    );
  }

  // --- EMPLOYEE SELECT SCREEN ---
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">📝 Skill Assessment</h1>
      <p className="text-gray-500 mb-8">Select an employee to begin their green skills assessment.</p>

      {loading ? (
        <p className="text-gray-400">Loading employees...</p>
      ) : employees.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <p className="text-gray-400">No employees found. Add employees in the Admin view first.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {employees.map((emp) => (
            <button
              key={emp.id}
              onClick={() => setSelectedEmployeeId(emp.id)}
              className={`w-full flex items-center justify-between px-5 py-4 rounded-xl border-2 transition-all text-left ${
                selectedEmployeeId === emp.id
                  ? "border-green-500 bg-green-50"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <div>
                <div className="font-semibold text-gray-800">{emp.name}</div>
                <div className="text-sm text-gray-500">
                  {emp.departmentName} &middot; {emp.roleTitle}
                </div>
              </div>
              <div className="text-xs text-gray-400">{emp.roleFunction}</div>
            </button>
          ))}

          <button
            onClick={startAssessment}
            disabled={!selectedEmployeeId || loading}
            className="w-full mt-4 px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 text-lg"
          >
            Start Assessment →
          </button>

          {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
        </div>
      )}
    </div>
  );
}
