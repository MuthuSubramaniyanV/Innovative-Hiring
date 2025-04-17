import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom"; 
import logo from "../assets/logo.png";
import { navItems } from "../constants";
import { MoreVertical, Menu, X } from "lucide-react";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <nav className="sticky top-0 z-50 py-4 bg-gradient-to-r from-gray-900 via-black to-gray-900 shadow-lg">
      <div className="container px-6 mx-auto flex justify-between items-center relative">
        
        {/* Logo and Brand Name */}
        <div className="flex items-center space-x-3">
          <img src={logo} alt="Logo" className="h-10 w-10" />
          <span className="text-xl font-semibold text-white tracking-wider">Innovative Hiring</span>
        </div>

        {/* Desktop Navigation */}
        <ul className="hidden lg:flex space-x-10">
          {navItems.map((item, index) =>
            item.type !== "kebab" && (
              <li key={index}>
                <Link
                  to={item.href}
                  className="text-gray-300 hover:text-white transition-all duration-300 text-sm font-medium"
                >
                  {item.label}
                </Link>
              </li>
            )
          )}
        </ul>

        {/* Kebab Menu (For Login) */}
        <div className="relative hidden lg:block">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="text-white p-2 rounded-lg hover:bg-gray-700/40 transition-all duration-300"
          >
            <MoreVertical size={24} />
          </button>

          {/* Dropdown for Login */}
          {menuOpen && (
            <div className="absolute right-0 mt-3 w-40 bg-gray-900 shadow-xl rounded-lg p-2">
              {navItems.find((item) => item.type === "kebab")?.items.map((subItem, subIndex) => (
                <button
                  key={subIndex}
                  onClick={() => navigate(subItem.href)}
                  className="block w-full text-left px-4 py-2 text-white font-semibold rounded-lg
                  bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800
                  transition-all duration-300 text-center"
                >
                  {subItem.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="lg:hidden text-white p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="absolute top-16 left-0 w-full bg-gray-900/90 backdrop-blur-lg shadow-lg p-6 flex flex-col items-center space-y-6 transition-all duration-300">
            {navItems.map((item, index) =>
              item.type !== "kebab" && (
                <Link
                  key={index}
                  to={item.href}
                  className="text-white text-lg font-medium hover:text-gray-400 transition"
                >
                  {item.label}
                </Link>
              )
            )}

            {/* Mobile Kebab Menu for Login */}
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="text-white p-2 rounded-lg hover:bg-gray-700/50"
              >
                <MoreVertical size={24} />
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-gray-900 shadow-lg rounded-lg p-2">
                  {navItems.find((item) => item.type === "kebab")?.items.map((subItem, subIndex) => (
                    <button
                      key={subIndex}
                      onClick={() => navigate(subItem.href)}
                      className="block w-full text-left px-4 py-2 text-white font-semibold rounded-lg
                      bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800
                      transition-all duration-300 text-center"
                    >
                      {subItem.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
