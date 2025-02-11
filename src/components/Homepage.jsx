import React from "react";
import { homeDetails } from "../constants"; // Adjust the import path based on your project structure
import { Link } from "react-router-dom"; // For navigation

const Homepage = () => {
    return (
        <div className="flex flex-col items-center mt-6 lg:mt-16">
            {homeDetails.map((item, index) => 
                item.text ? (
                    <h1 
                        key={index} 
                        className={`text-center tracking-wide mb-2 ${index === 0 ? "text-2xl sm:text-4xl lg:text-5xl font-bold" : "text-lg sm:text-xl lg:text-2xl text-gray-600"}`}
                    >
                        {item.text}
                    </h1>
                ) : null
            )}

            {/* Render button if label and href exist */}
            {homeDetails.map((item, index) =>
                item.label && item.href ? (
                    <Link 
                        key={index} 
                        to={item.href}
                        className="mt-4 px-5 py-2 text-md font-medium text-white bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 transition-all"
                    >
                        {item.label}
                    </Link>
                ) : null
            )}
        </div>
    );
};

export default Homepage;
