import React, { useState } from 'react';
import { X, Send } from 'lucide-react';

export default function ApplyModal({ project, onClose, onSubmit }) {
  const [message, setMessage] = useState('');
  const [answers, setAnswers] = useState(
    project.screeningQuestions?.map((q) => ({
      // eslint-disable-next-line react-hooks/purity
      questionId: q._id || String(Math.random()),
      question: q.question,
      answer: '',
    })) || []
  );

  const handleAnswerChange = (index, value) => {
    setAnswers((prev) =>
      prev.map((ans, i) => (i === index ? { ...ans, answer: value } : ans))
    );
  };

  const isFormValid =
    message.trim().length > 0 &&
    answers.every((ans, idx) => {
      const q = project.screeningQuestions[idx];
      if (q.required) return ans.answer.trim().length > 0;
      return true;
    });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isFormValid) return;
    onSubmit(answers, message);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl border border-slate-200 overflow-hidden max-h-[85vh] flex flex-col font-sans">
        <div className="mb-4 flex items-start justify-between shrink-0">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Apply to Collaborate</h3>
            <p className="mt-0.5 text-xs text-slate-400 font-semibold truncate max-w-sm">{project.title}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-1 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700">
              Introduction / Cover Message
            </label>
            <textarea
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              placeholder="Briefly introduce yourself and outline why you would like to join this research team..."
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none transition"
            />
          </div>

          {/* Screening Questions */}
          {answers.length > 0 && (
            <div className="space-y-4 border-t border-slate-100 pt-4">
              <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wide">Screening Questions</h4>
              {answers.map((ans, idx) => {
                const q = project.screeningQuestions[idx];
                return (
                  <div key={ans.questionId} className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      {q.question} {q.required && <span className="text-red-500">*</span>}
                    </label>
                    {q.type === 'textarea' ? (
                      <textarea
                        required={q.required}
                        value={ans.answer}
                        onChange={(e) => handleAnswerChange(idx, e.target.value)}
                        rows={2}
                        className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none transition"
                      />
                    ) : q.type === 'yesno' ? (
                      <select
                        required={q.required}
                        value={ans.answer}
                        onChange={(e) => handleAnswerChange(idx, e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-650 focus:bg-white focus:border-blue-500 focus:outline-none transition"
                      >
                        <option value="">Select option</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    ) : (
                      <input
                        required={q.required}
                        value={ans.answer}
                        onChange={(e) => handleAnswerChange(idx, e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none transition"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-655 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isFormValid}
              className="flex items-center gap-1.5 rounded-xl bg-blue-650 px-4 py-2.5 text-xs font-black text-white hover:bg-blue-700 transition disabled:opacity-40"
            >
              <Send size={13} /> Submit Application
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}