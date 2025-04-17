import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const MCQPanelInterface = ({ questions = [], prompt }) => {
  // Remove the loading, error, and questions state since they're now passed as props
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  useEffect(() => {
    // Load selected questions from localStorage
    const savedQuestions = JSON.parse(localStorage.getItem("selectedQuestions")) || [];
    setSelectedQuestions(savedQuestions);
  }, []);

  // Don't need to fetch questions again - they're already passed from the parent

  const handleSelectQuestion = (question) => {
    if (!selectedQuestions.some(q => q.question === question.question)) {
      const updatedSelections = [...selectedQuestions, question];
      setSelectedQuestions(updatedSelections);
      localStorage.setItem("selectedQuestions", JSON.stringify(updatedSelections));
    }
  };

  const handleRemoveQuestion = (index) => {
    const updatedSelections = selectedQuestions.filter((_, i) => i !== index);
    setSelectedQuestions(updatedSelections);
    localStorage.setItem("selectedQuestions", JSON.stringify(updatedSelections));
  };

  const handleCompleteSelection = () => {
    toast.success('Selection completed!');
    localStorage.removeItem("selectedQuestions");
    setSelectedQuestions([]);
  };

  if (!questions || questions.length === 0) {
    return <div>No questions available</div>;
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="flex space-x-6 p-4 bg-white rounded shadow">
      {/* Left Panel - Questions */}
      <div className="w-2/3">
        <h2 className="text-xl font-bold mb-4">
          Question {currentQuestionIndex + 1} of {questions.length}
        </h2>
        
        <div className="mb-4">
          <p className="text-lg font-medium">{currentQuestion.question}</p>
        </div>
        
        <div className="space-y-2 mb-6">
          {currentQuestion.options.map((option, idx) => (
            <div 
              key={idx}
              className={`p-2 border rounded ${idx === currentQuestion.correctAnswer ? 'bg-green-100 border-green-500' : 'hover:bg-gray-50'}`}
            >
              <span className="mr-2">{String.fromCharCode(65 + idx)}.</span>
              {option}
            </div>
          ))}
        </div>
        
        <div className="mb-6 p-3 bg-blue-50 rounded">
          <h3 className="font-bold text-blue-800">Explanation:</h3>
          <p>{currentQuestion.explanation}</p>
        </div>

        <button
          onClick={() => handleSelectQuestion(currentQuestion)}
          className="mb-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Select Question
        </button>
        
        <div className="flex justify-between">
          <button
            onClick={() => setCurrentQuestionIndex(i => Math.max(0, i - 1))}
            disabled={currentQuestionIndex === 0}
            className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
          >
            Previous
          </button>
          
          <button
            onClick={() => setCurrentQuestionIndex(i => Math.min(questions.length - 1, i + 1))}
            disabled={currentQuestionIndex === questions.length - 1}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      {/* Right Panel - Selected Questions */}
      <div className="w-1/3 bg-gray-50 p-4 rounded shadow">
        <h2 className="text-xl font-bold mb-4">Selected Questions</h2>
        {selectedQuestions.length === 0 ? (
          <p className="text-gray-500">No questions selected</p>
        ) : (
          <div className="space-y-4">
            {selectedQuestions.map((q, idx) => (
              <div key={idx} className="p-3 border rounded bg-white shadow">
                <p className="font-medium">{q.question}</p>
                <button
                  onClick={() => handleRemoveQuestion(idx)}
                  className="mt-2 px-2 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        {selectedQuestions.length > 0 && (
          <button
            onClick={handleCompleteSelection}
            className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Complete Selection
          </button>
        )}
      </div>
    </div>
  );
};

export default MCQPanelInterface;