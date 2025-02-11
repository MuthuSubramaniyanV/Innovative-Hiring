import React from "react";
import { footer } from "../constants"; 

const Footer = () => {
  const currentYear = new Date().getFullYear(); // Get dynamic year

  return (
    <footer className="bg-gray-900 text-white text-center py-6 mt-64"> {/* Added mt-10 for spacing */}
      <div className="container mx-auto">
        {footer.map((item, index) => (
          <p key={index} className="text-sm mb-2">
            {item.text.replace("${currentYear}", currentYear)} {/* Dynamic Year */}
          </p>
        ))}
      </div>
    </footer>
  );
};

export default Footer;
