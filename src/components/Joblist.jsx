  import React, { useEffect, useState } from "react";
  import { useNavigate } from "react-router-dom";

  const JobList = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
      const fetchJobs = async () => {
        try {
          setLoading(true);
          const response = await fetch("http://localhost:5000/jobs", {
            headers: {
              'Accept': 'application/json'
            }
          });
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          setJobs(data);
        } catch (error) {
          console.error("Error fetching jobs:", error);
          setError("Failed to load jobs. Please try again later.");
        } finally {
          setLoading(false);
        }
      };

      fetchJobs();
    }, []);

    if (error) {
      return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center px-6 py-12">
          <div className="text-red-400">{error}</div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center px-6 py-12">
        <h1 className="text-4xl font-bold text-cyan-400 neon-glow mb-8">Job Listings</h1>

        <div className="w-full max-w-4xl space-y-6">
          {loading ? (
            <p className="text-gray-400">Loading job listings...</p>
          ) : jobs.length > 0 ? (
            jobs.map((job) => (
              <div
                key={job.job_id}
                className="p-6 bg-gray-800 rounded-xl shadow-lg neon-border transition-transform hover:scale-105 cursor-pointer"
                onClick={() => navigate(`/apply/${job.job_id}`)}
              >
                <h2 className="text-2xl font-semibold text-cyan-300">{job.job_title}</h2>
                <p className="text-gray-400 mt-2">{job.description}</p>
                <p className="text-gray-300 mt-2">
                  <span className="font-semibold">Experience Required:</span> {job.minimum_experience} years
                </p>
                <p className="text-gray-300 mt-2">
                  <span className="font-semibold">Exam Type:</span> {job.exam_type}
                </p>
              </div>
            ))
          ) : (
            <p className="text-gray-400">No jobs available at the moment.</p>
          )}
        </div>
      </div>
    );
  };

  export default JobList;
