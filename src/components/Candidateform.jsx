import React, { useState } from "react";
import { User, Mail, Phone, FileText } from "lucide-react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";

const CandidateForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    resume: null,
  });
  const [loading, setLoading] = useState(false);

  const allowedFileTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "image/png", "image/jpeg"];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && allowedFileTypes.includes(file.type)) {
      setFormData({ ...formData, resume: file });
    } else {
      toast.error("Invalid file type. Upload PDF, DOCX, PNG, or JPG.");
      e.target.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formDataObj = new FormData();
    formDataObj.append("name", formData.name);
    formDataObj.append("email", formData.email);
    formDataObj.append("phone", formData.phone);
    if (formData.resume) {
      formDataObj.append("resume", formData.resume);
    }

    try {
      const loadingToast = toast.loading("Submitting application...");

      const response = await axios.post("http://127.0.0.1:5001/submit", formDataObj, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 60000,
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          toast.loading(`Uploading: ${percentCompleted}%`, { id: loadingToast });
        },
      });

      toast.dismiss(loadingToast);
      toast.success(`Application submitted! Level: ${response.data.candidate_level}`);

      setFormData({ name: "", email: "", phone: "", resume: null });
      document.querySelector('input[type="file"]').value = "";
    } catch (error) {
      console.error("Submission error:", error);
      toast.dismiss();
      toast.error(error.response?.data?.error || "Error submitting application");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center px-6 py-12">
      <Toaster position="top-right" />
      <div className="text-center space-y-4">
        <h1 className="text-4xl sm:text-6xl font-extrabold text-cyan-400 neon-glow">
          Job Application Form
        </h1>
        <p className="text-lg sm:text-2xl text-gray-300">Fill in your details to apply</p>
      </div>

      <div className="w-full max-w-3xl mt-8 p-8 bg-gray-800 rounded-2xl shadow-xl neon-border">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="relative">
              <User className="absolute left-4 top-3 h-5 w-5 text-cyan-400" />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Full Name"
                required
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-700 rounded-xl bg-gray-900 text-white focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
              />
            </div>

            <div className="relative">
              <Mail className="absolute left-4 top-3 h-5 w-5 text-cyan-400" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email Address"
                required
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-700 rounded-xl bg-gray-900 text-white focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
              />
            </div>

            <div className="relative">
              <Phone className="absolute left-4 top-3 h-5 w-5 text-cyan-400" />
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Phone Number"
                required
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-700 rounded-xl bg-gray-900 text-white focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
              />
            </div>
          </div>

          <div className="relative">
            <FileText className="absolute left-4 top-3 h-5 w-5 text-cyan-400" />
            <input
              type="file"
              accept=".pdf, .docx, .png, .jpg"
              onChange={handleFileChange}
              required
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-700 rounded-xl bg-gray-900 text-white cursor-pointer"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-xl font-semibold text-lg transition-all ${
              loading
                ? "bg-gray-500 cursor-not-allowed"
                : "bg-gradient-to-r from-cyan-400 to-blue-500 text-gray-900 hover:from-blue-500 hover:to-cyan-400"
            }`}
          >
            {loading ? "Submitting..." : "Submit Application"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CandidateForm;
