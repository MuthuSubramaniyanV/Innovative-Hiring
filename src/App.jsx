import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/navbar";
import Footer from "./components/footer";
import Homepage from "./components/Homepage";
import Loginpage from "./components/Loginpage";
import Candidateform from "./components/candidateform";
import AdminDashboard from "./components/AdminDashboard"; // Import Admin Dashboard

// Layout for pages with Navbar and Footer
const MainLayout = ({ children }) => (
  <>
    <Navbar />
    {children}
    <Footer />
  </>
);

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Routes with Navbar and Footer */}
        <Route
          path="/"
          element={
            <MainLayout>
              <Homepage />
            </MainLayout>
          }
        />
        <Route
          path="/candidateform"
          element={
            <MainLayout>
              <Candidateform />
            </MainLayout>
          }
        />

        {/* Routes without Navbar and Footer */}
        <Route path="/login" element={<Loginpage />} />
        <Route path="/admindashboard" element={<AdminDashboard />} />

        {/* 404 Route */}
        <Route
          path="*"
          element={<div className="text-center text-xl p-10">404 - Page Not Found</div>}
        />
      </Routes>
    </Router>
  );
};

export default App;
