export const navItems = [
    { label: "Home", href: "/" }, // Changed "#" to "/"
    { label: "Contact", href: "/contact" },
    { label: "Candidates", href: "/candidateform" },
    { 
      type: "kebab",
      items: [ 
        { label: "LOGIN", href: "/login" } // Updated link
      ]
    }
];

export const homeDetails = [
    { text: "Revolutionizing Recruitment with AI-Powered Hiring" },
    { text: "A Smart, Data-Driven Platform for Faster, Fairer, and More Efficient Hiring." },
    { label: "Get Started", href: "#" } // Make sure this follows the correct structure
];

export const footer = [
    { text: "© ${currentYear} Innovative Hiring. All rights reserved." },
    { text: "Powered by IMMCO Soft Solutions Private Limited" },
    { text: "Certified by IMMCO Software Solutions Private Limited" },
    { text: " Email: innovativehiring032@gmail.com" }
  ];
  