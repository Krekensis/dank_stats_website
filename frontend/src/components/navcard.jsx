import React from "react";
import { useNavigate } from "react-router-dom";

const NavCard = ({ heading, description, redirect }) => {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => redirect && navigate(redirect)}
      className="relative bg-[#1d2a24] text-[#c6ffcc] rounded-md cursor-pointer
                 max-w-xs min-w-[200px] max-h-[180px]
                 flex flex-col justify-start
                 border-2 border-transparent
                 hover:border-[#6bff7a] hover:bg-[#213024] hover:text-[#6bff7a]
                 transition-colors duration-300
                 p-3 overflow-hidden">
      <h3
        className="font-medium font-mono mb-2 truncate"
        style={{ fontSize: "clamp(0.9rem, 1.5vw, 1.1rem)" }}
      >
        {heading}
      </h3>

      <p
        className="font-mono text-[#8ab898] text-ellipsis overflow-hidden"
        style={{
          fontSize: "clamp(0.75rem, 1.3vw, 0.9rem)",
          lineHeight: "1.3",
          maxHeight: "5rem", // to avoid overflow on multiple lines
        }}
      >
        {description}
      </p>
    </div>
  );
};

export default NavCard;

