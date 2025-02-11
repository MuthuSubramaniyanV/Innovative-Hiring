import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom"; // Import useNavigate
import logo from "../assets/logo.png";
import { navItems } from "../constants";
import { MoreVertical, Menu, X } from "lucide-react";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate(); // Initialize navigate function

  return (
    <nav className="sticky top-0 z-50 py-3 backdrop-blur-lg border-b border-neutral-700/80 bg-white">
      <div className="container px-4 mx-auto relative text-sm flex justify-between items-center">
        
        {/* Logo and Title */}
        <div className="flex items-center flex-shrink-0">
          <img src={logo} alt="Logo" className="h-10 w-10 mr-2" />
          <span className="text-xl tracking-tight text-black">Innovative Hiring</span>
        </div>

        {/* Desktop Navigation */}
        <ul className="hidden lg:flex ml-14 space-x-12">
          {navItems.map((item, index) =>
            item.type === "kebab" ? null : (
              <li key={index}>
                <Link to={item.href} className="text-black hover:text-gray-500 transition">
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
            className="text-black p-2 rounded-lg hover:bg-gray-200"
          >
            <MoreVertical size={24} />
          </button>

          {/* Dropdown for Login */}
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-36 bg-gray-900 shadow-lg rounded-lg p-2">
              {navItems.find((item) => item.type === "kebab")?.items.map((subItem, subIndex) => (
                <button
                  key={subIndex}
                  onClick={() => navigate(subItem.href)} // Navigate without reloading
                  className="block w-full text-left px-4 py-2 text-white font-semibold rounded-lg
                  bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700
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
          className="lg:hidden text-black p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="absolute top-14 left-0 w-full bg-white shadow-lg p-4 flex flex-col items-center space-y-4">
            {navItems.map((item, index) =>
              item.type === "kebab" ? null : (
                <Link
                  key={index}
                  to={item.href}
                  className="text-black text-lg font-medium hover:text-gray-500"
                >
                  {item.label}
                </Link>
              )
            )}

            {/* Mobile Kebab Menu for Login */}
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="text-black p-2 rounded-lg hover:bg-gray-200"
              >
                <MoreVertical size={24} />
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-36 bg-gray-900 shadow-lg rounded-lg p-2">
                  {navItems.find((item) => item.type === "kebab")?.items.map((subItem, subIndex) => (
                    <button
                      key={subIndex}
                      onClick={() => navigate(subItem.href)} // Navigate without reloading
                      className="block w-full text-left px-4 py-2 text-white font-semibold rounded-lg
                      bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700
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
