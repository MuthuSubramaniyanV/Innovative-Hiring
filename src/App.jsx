import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/navbar";
import Footer from "./components/footer";
import Homepage from "./components/Homepage";
import Loginpage from "./components/Loginpage"; 
import Candidateform from "./components/candidateform";
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
        {/* Routes that include Navbar and Footer */}
        <Route
          path="/"
          element={
            <MainLayout>
              <Homepage />
            </MainLayout>
          }
        />

        {/* Add other routes that should have Navbar and Footer here */}

        {/* Route for Login (No Navbar or Footer) */}
        <Route path="/login" element={<Loginpage />} />
        <Route path="/candidateform" element={<Candidateform/>}/>
        <Route path="*" element={<div className="text-center text-xl p-10">404 - Page Not Found</div>} />
      </Routes>
    </Router>
  );
};

export default App;
