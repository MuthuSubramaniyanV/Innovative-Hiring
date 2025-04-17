import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

const InterviewQuestions = ({ questions, prompt }) => {
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem('selectedInterviewQuestions');
    if (saved) {
      try {
        setSelectedQuestions(JSON.parse(saved));
      } catch (err) {
        console.error('Error parsing saved questions:', err);
        localStorage.removeItem('selectedInterviewQuestions');
      }
    }
  }, []);

  const handleSelect = (question) => {
    if (!selectedQuestions.find((q) => q.id === question.id)) {
      const updated = [...selectedQuestions, question];
      setSelectedQuestions(updated);
      localStorage.setItem('selectedInterviewQuestions', JSON.stringify(updated));
      toast.success('Question added to selection');
    }
  };

  const handleRemove = (questionId) => {
    const updated = selectedQuestions.filter((q) => q.id !== questionId);
    setSelectedQuestions(updated);
    localStorage.setItem('selectedInterviewQuestions', JSON.stringify(updated));
    toast.success('Question removed from selection');
  };

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(prev + 1, questions.length - 1));
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    // Trigger the prompt to get the file name
    const fileName = window.prompt("Enter the file name to save the selected questions:");

    // If no file name is provided, show an error
    if (!fileName) {
      toast.error("File name is required!");
      return;
    }

    if (selectedQuestions.length === 0) {
      toast.error("No questions selected to save");
      return;
    }

    try {
      const response = await fetch('http://localhost:5005/api/save_questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_title: fileName,
          questions: selectedQuestions,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        toast.success(data.message);
        setSelectedQuestions([]);
        localStorage.removeItem('selectedInterviewQuestions');
      } else {
        toast.error(data.error || 'Failed to save questions');
      }
    } catch (error) {
      console.error('Error saving questions:', error);
      toast.error('Server error while saving questions');
    }
  };

  // Custom components for ReactMarkdown
  const components = {
    code({ node, inline, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <SyntaxHighlighter style={vscDarkPlus} language={match[1]} PreTag="div" {...props}>
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      ) : (
        <code className={className} {...props}>
          {children}
        </code>
      );
    },
  };

  if (!questions || questions.length === 0) {
    return <div>No questions available</div>;
  }

  const currentQuestion = questions[currentIndex];

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      {/* Question Navigation */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Interview Questions: {prompt}</h2>
        <div className="flex gap-2">
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="px-4 py-2 bg-gray-100 rounded disabled:opacity-50"
          >
            ← Previous
          </button>
          <span className="px-4 py-2">
            Question {currentIndex + 1} of {questions.length}
          </span>
          <button
            onClick={handleNext}
            disabled={currentIndex === questions.length - 1}
            className="px-4 py-2 bg-gray-100 rounded disabled:opacity-50"
          >
            Next →
          </button>
        </div>
      </div>

      {/* Current Question with Answer */}
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <div className="space-y-6">
          <div className="border-b pb-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800">{currentQuestion.question}</h3>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                {currentQuestion.type || 'conceptual'}
              </span>
            </div>
          </div>

          {/* Answer Section with Enhanced Markdown */}
          <div className="mt-4">
            <h4 className="text-lg font-semibold mb-3 text-gray-700">Answer:</h4>
            <div className="prose prose-slate max-w-none bg-gray-50 p-4 rounded-lg">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
                {currentQuestion.answer || currentQuestion.expectedAnswer || 'No answer provided'}
              </ReactMarkdown>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={() => handleSelect(currentQuestion)}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Save Question
            </button>
          </div>
        </div>
      </div>

      {/* Selected Questions with Enhanced Markdown */}
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h3 className="text-xl font-bold mb-4">Saved Questions ({selectedQuestions.length})</h3>
        <div className="space-y-4">
          {selectedQuestions.map((q) => (
            <div key={q.id} className="p-4 border rounded hover:bg-gray-50">
              <div className="mb-3">
                <p className="font-medium text-gray-800">{q.question}</p>
              </div>
              <div className="pl-4 border-l-2 border-gray-200 mb-3">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
                  {q.answer || ''}
                </ReactMarkdown>
              </div>
              <button
                onClick={() => handleRemove(q.id)}
                className="text-red-600 text-sm hover:text-red-800"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Submit Button Below the Container */}
      <div className="mt-6 flex justify-center">
        <button
          onClick={handleSubmit}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Submit
        </button>
      </div>
    </div>
  );
};

export default InterviewQuestions;
