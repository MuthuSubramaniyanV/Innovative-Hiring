import React, { useState, useEffect, useRef } from "react";
import {
  Menu,
  ChevronLeft,
  LogOut,
  FileText,
  Edit,
  BarChart,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import axios from "axios";
import MCQPanelInterface from "./McqQuestion";
import InterviewPanelInterface from './InterviewQuestions';

const FormField = ({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  disabled,
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      {label}
    </label>
    <input
      type={type}
      className={`w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all ${
        disabled ? "bg-gray-100 cursor-not-allowed" : ""
      }`}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
    />
  </div>
);

const StatsCard = ({ title, value, colorClass }) => (
  <div className="bg-gray-50 p-6 rounded-lg">
    <h3 className="text-lg font-medium mb-2">{title}</h3>
    <p className={`text-3xl font-bold ${colorClass}`}>{value}</p>
  </div>
);

const PanelDashboard = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("generate");
  const [prompt, setPrompt] = useState("");
  const [showMCQ, setShowMCQ] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generatedQuestion, setGeneratedQuestion] = useState("");
  const [generatedQuestions, setGeneratedQuestions] = useState([]);

  // Rate limiting states
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [cooldownTime, setCooldownTime] = useState(0);
  const cooldownTimerRef = useRef(null);
  const COOLDOWN_PERIOD = 30; // in seconds

  // Candidates state
  const [candidates, setCandidates] = useState([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);

  const menuItems = [
    { id: "generate", icon: <Edit />, label: "Generate Questions" },
    { id: "manage", icon: <FileText />, label: "Manage Questions" },
    { id: "candidates", icon: <Users />, label: "Candidates" },
    { id: "stats", icon: <BarChart />, label: "Statistics" },
  ];

  // Clean up the cooldown timer on component unmount
  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) {
        clearInterval(cooldownTimerRef.current);
      }
    };
  }, []);

  const startCooldown = () => {
    setIsButtonDisabled(true);
    setCooldownTime(COOLDOWN_PERIOD);
    cooldownTimerRef.current = setInterval(() => {
      setCooldownTime((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(cooldownTimerRef.current);
          setIsButtonDisabled(false);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    sessionStorage.clear();
    navigate("/login");
  };

  const generateQuestion = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    // Extract number of questions from the prompt
    const numMatch = prompt.match(/\d+/);
    const numQuestions = numMatch ? parseInt(numMatch[0]) : 10; // Default to 10 if no number specified
    
    // Validate the number of questions
    if (numQuestions < 10) {
      toast.error("Minimum 10 questions required. Please modify your prompt.");
      return;
    }
    
    if (numQuestions > 15) {
      toast.error("Maximum 15 questions allowed. Please modify your prompt.");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      
      // Detect if this is an interview question request
      const isInterview = prompt.toLowerCase().includes('interview');
      
      // Clean the prompt
      const cleanPrompt = prompt
        .replace(/generate|create|\d+|questions|interview|mcq|about/gi, '')
        .trim();

      if (!cleanPrompt) {
        toast.error("Please specify a subject or topic");
        setLoading(false);
        return;
      }

      console.log("Generating", isInterview ? "interview" : "MCQ", "questions:", {
        prompt: cleanPrompt,
        count: numQuestions
      });

      // Use the appropriate endpoint based on question type
      const endpoint = isInterview 
        ? '/api/panel/generate-interview-questions'
        : '/api/panel/generate-question';

      const response = await axios.post(
        `http://localhost:5002${endpoint}`,
        {
          prompt: cleanPrompt,
          num_questions: numQuestions
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );

      if (response.data?.success && response.data?.questions) {
        setGeneratedQuestions(response.data.questions);
        // Set showMCQ based on question type
        setShowMCQ(!isInterview);
        toast.success(`Generated ${response.data.questions.length} questions!`);
      } else {
        throw new Error("Invalid response format from server");
      }
    } catch (error) {
      console.error("Error generating questions:", error);
      toast.error(error.response?.data?.error || "Failed to generate questions");
    } finally {
      setLoading(false);
    }
  };

  // Fetch assigned candidates whenever "candidates" tab is active
  useEffect(() => {
    const fetchCandidates = async () => {
      setLoadingCandidates(true);
      try {
        const token = localStorage.getItem("authToken");
        // Assume the panel member's ID is stored in localStorage as "panelMemberId"
        const panelMemberId = 17;

        if (!panelMemberId) {
          toast.error("Panel member ID not found.");
          setLoadingCandidates(false);
          return;
        }

        const response = await axios.get(
          `http://localhost:5000/panel/assigned-candidates?id=${panelMemberId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        
        // Expected response: { candidates: [...] }
        setCandidates(response.data.candidates || []);
      } catch (error) {
        console.error("Error fetching candidates:", error);
        const errorMessage =
          error.response?.data?.error ||
          error.message ||
          "Failed to fetch assigned candidates.";
        toast.error(errorMessage);
      } finally {
        setLoadingCandidates(false);
      }
    };

    if (activeTab === "candidates") {
      fetchCandidates();
    }
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-gray-100">
      <button
        onClick={() => setSidebarOpen(!isSidebarOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-slate-800 text-white rounded-lg"
      >
        <Menu />
      </button>

      <aside
        className={`fixed top-0 left-0 h-full bg-slate-800 text-white transition-all duration-300 ease-in-out z-40 ${
          isSidebarOpen ? "w-64" : "w-0 md:w-20"
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          {isSidebarOpen && (
            <h2 className="text-xl font-bold">Panel Dashboard</h2>
          )}
          <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="hidden md:block">
            <ChevronLeft />
          </button>
        </div>
        <nav className="mt-6 space-y-2 px-2 flex flex-col h-[calc(100%-5rem)]">
          {menuItems.map(({ id, icon, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`w-full flex items-center p-3 rounded-lg transition-colors ${
                activeTab === id ? "bg-blue-600" : "hover:bg-slate-700"
              }`}
            >
              {icon}
              {isSidebarOpen && <span className="ml-3">{label}</span>}
            </button>
          ))}
          <button
            onClick={handleLogout}
            className="w-full flex items-center p-3 rounded-lg transition-colors hover:bg-red-600 mt-auto"
          >
            <LogOut />
            {isSidebarOpen && <span className="ml-3">Logout</span>}
          </button>
        </nav>
      </aside>

      <main
        className={`transition-all duration-300 p-4 md:p-8 ${
          isSidebarOpen ? "md:ml-64" : "md:ml-20"
        }`}
      >
        <div className="bg-white rounded-2xl shadow-sm mt-12 md:mt-0">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-2xl font-semibold text-gray-800">
              {activeTab === "generate"
                ? "Generate Questions"
                : activeTab === "manage"
                ? "Manage Questions"
                : activeTab === "candidates"
                ? "Assigned Candidates"
                : "Question Statistics"}
            </h2>
          </div>
          <div className="p-6">
            {activeTab === "generate" && (
              <div className="space-y-6">
                {generatedQuestions.length > 0 ? (
                  <>
                    <button
                      onClick={() => {
                        setGeneratedQuestions([]);
                        setShowMCQ(false);
                      }}
                      className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      ← Back to Question Generator
                    </button>
                    {showMCQ ? (
                      <MCQPanelInterface 
                        questions={generatedQuestions}
                        prompt={prompt}
                      />
                    ) : (
                      <InterviewPanelInterface
                        questions={generatedQuestions}
                        prompt={prompt}
                      />
                    )}
                  </>
                ) : (
                  <>
                    <FormField
                      label="Enter Prompt"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      disabled={isButtonDisabled || loading}
                    />
                    <button
                      onClick={generateQuestion}
                      className={`px-4 py-2 ${
                        isButtonDisabled
                          ? "bg-gray-400"
                          : "bg-blue-600 hover:bg-blue-700"
                      } text-white rounded-lg transition-colors`}
                      disabled={isButtonDisabled || loading}
                    >
                      {loading ? "Generating..." : "Generate Questions"}
                    </button>

                    {/* Prompt guide with updated instructions */}
                    <div className="mt-8 p-6 bg-gray-50 rounded-lg">
                      <h3 className="text-xl font-bold text-gray-800 mb-4">How to Generate Questions:</h3>
                      <div className="space-y-4">
                        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                          <h4 className="font-semibold text-yellow-800">Important Note:</h4>
                          <p className="text-yellow-700">You must generate between 10-15 questions at a time.</p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-blue-600">For MCQ Questions:</h4>
                          <p className="text-gray-600">Type: "Generate [number] MCQ about [topic]"</p>
                          <p className="text-gray-500 text-sm">Example: "Generate 12 MCQ about Java basics"</p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-green-600">For Interview Questions:</h4>
                          <p className="text-gray-600">Type: "Generate [number] interview questions about [topic]"</p>
                          <p className="text-gray-500 text-sm">Example: "Generate 10 interview questions about Python"</p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === "candidates" && (
              <div>
                {loadingCandidates ? (
                  <p>Loading candidates...</p>
                ) : candidates.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
              
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Phone
                          </th>
                          
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Interview Performance
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Interview Feedback
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Conversation
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Progress
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Selected
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Candidate Level
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                      {candidates.map((candidate, index) => (
                        <tr key={candidate.candidate_id || `candidate-${index}`}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {candidate.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {candidate.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {candidate.phone}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {candidate.interview_performance}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {candidate.interview_feedback}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {candidate.interview_conversation}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {candidate.progress}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {candidate.selected}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {candidate.candidate_level}
                          </td>
                        </tr>
                      ))}
                    </tbody>

                    </table>
                  </div>
                ) : (
                  <p className="text-gray-600">
                    No assigned candidates found.
                  </p>
                )}
              </div>
            )}

            {activeTab === "stats" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatsCard title="Total Questions" value="" colorClass="text-blue-600" />
                <StatsCard title="Candidates" value="" colorClass="text-green-600" />
                <StatsCard title="Avg. Score" value="" colorClass="text-purple-600" />
                {/* Additional statistics can be added here */}
              </div>
            )}
          </div>
        </div>
      </main>

      <Toaster />
    </div>
  );
};

export default PanelDashboard;

