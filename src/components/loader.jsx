import React from "react";

const Loader = () => {
  return (
    <div className="flex space-x-2 justify-center items-end h-16">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className={`w-3 bg-green-500 rounded-sm animate-bounce`}
          style={{ 
            animationDelay: `${i * 0.15}s`,
            animationDuration: "1.2s",
            animationIterationCount: "infinite",
            animationTimingFunction: "ease-in-out",
            height: `${10 + i * 10}px`,
          }}
        />
      ))}
    </div>
  );
};

export default Loader;
