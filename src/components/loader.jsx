import React from 'react';

const Loader = ({ size = 100 }) => {
  const scale = size / 100; // Scale factor based on original 75px width, 100px height

  return (
    <div
      className="relative"
      style={{
        width: `${75 * scale}px`,
        height: `${100 * scale}px`
      }}
    >
      {/* Animated bars */}
      <div
        className="absolute bottom-0 rounded-t-sm shadow-sm"
        style={{
          left: `${0 * scale}px`,
          width: `${10 * scale}px`,
          height: `${50 * scale}px`,
          backgroundColor: '#182521',
          transformOrigin: 'center bottom',
          animation: 'barUp1 4s infinite',
          boxShadow: `${1 * scale}px ${1 * scale}px 0 rgba(27, 54, 42, 0.3)`
        }}
      />

      <div
        className="absolute bottom-0 rounded-t-sm shadow-sm"
        style={{
          left: `${15 * scale}px`,
          width: `${10 * scale}px`,
          height: `${50 * scale}px`,
          backgroundColor: '#182521',
          transformOrigin: 'center bottom',
          animation: 'barUp2 4s infinite',
          boxShadow: `${1 * scale}px ${1 * scale}px 0 rgba(27, 54, 42, 0.3)`
        }}
      />

      <div
        className="absolute bottom-0 rounded-t-sm shadow-sm"
        style={{
          left: `${30 * scale}px`,
          width: `${10 * scale}px`,
          height: `${50 * scale}px`,
          backgroundColor: '#182521',
          transformOrigin: 'center bottom',
          animation: 'barUp3 4s infinite',
          boxShadow: `${1 * scale}px ${1 * scale}px 0 rgba(27, 54, 42, 0.3)`
        }}
      />

      <div
        className="absolute bottom-0 rounded-t-sm shadow-sm"
        style={{
          left: `${45 * scale}px`,
          width: `${10 * scale}px`,
          height: `${50 * scale}px`,
          backgroundColor: '#182521',
          transformOrigin: 'center bottom',
          animation: 'barUp4 4s infinite',
          boxShadow: `${1 * scale}px ${1 * scale}px 0 rgba(27, 54, 42, 0.3)`
        }}
      />

      <div
        className="absolute bottom-0 rounded-t-sm shadow-sm"
        style={{
          left: `${60 * scale}px`,
          width: `${10 * scale}px`,
          height: `${50 * scale}px`,
          backgroundColor: '#182521',
          transformOrigin: 'center bottom',
          animation: 'barUp5 4s infinite',
          boxShadow: `${1 * scale}px ${1 * scale}px 0 rgba(27, 54, 42, 0.3)`
        }}
      />

      {/* Bouncing ball - using a lighter shade for contrast */}
      <div
        className="absolute rounded-full shadow-sm"
        style={{
          bottom: `${10 * scale}px`,
          left: `${0 * scale}px`,
          width: `${10 * scale}px`,
          height: `${10 * scale}px`,
          backgroundColor: '#2d5a47',
          animation: 'ball624 4s infinite',
          boxShadow: `0 ${2 * scale}px ${4 * scale}px rgba(27, 54, 42, 0.3)`,
          transform: `scale(${scale})`,
          transformOrigin: 'bottom left',
        }}
      />


      <style jsx>{`
        @keyframes ball624 {
          0% { transform: translate(0, 0); }
          5% { transform: translate(${8 * scale}px, ${-14 * scale}px); }
          10% { transform: translate(${15 * scale}px, ${-10 * scale}px); }
          17% { transform: translate(${23 * scale}px, ${-24 * scale}px); }
          20% { transform: translate(${30 * scale}px, ${-20 * scale}px); }
          27% { transform: translate(${38 * scale}px, ${-34 * scale}px); }
          30% { transform: translate(${45 * scale}px, ${-30 * scale}px); }
          37% { transform: translate(${53 * scale}px, ${-44 * scale}px); }
          40% { transform: translate(${60 * scale}px, ${-40 * scale}px); }
          50% { transform: translate(${60 * scale}px, 0); }
          57% { transform: translate(${53 * scale}px, ${-14 * scale}px); }
          60% { transform: translate(${45 * scale}px, ${-10 * scale}px); }
          67% { transform: translate(${37 * scale}px, ${-24 * scale}px); }
          70% { transform: translate(${30 * scale}px, ${-20 * scale}px); }
          77% { transform: translate(${22 * scale}px, ${-34 * scale}px); }
          80% { transform: translate(${15 * scale}px, ${-30 * scale}px); }
          87% { transform: translate(${7 * scale}px, ${-44 * scale}px); }
          90% { transform: translate(0, ${-40 * scale}px); }
          100% { transform: translate(0, 0); }
        }


        @keyframes barUp1 {
          0% { transform: scale(1, 0.2); }
          40% { transform: scale(1, 0.2); }
          50% { transform: scale(1, 1); }
          90% { transform: scale(1, 1); }
          100% { transform: scale(1, 0.2); }
        }

        @keyframes barUp2 {
          0% { transform: scale(1, 0.4); }
          40% { transform: scale(1, 0.4); }
          50% { transform: scale(1, 0.8); }
          90% { transform: scale(1, 0.8); }
          100% { transform: scale(1, 0.4); }
        }

        @keyframes barUp3 {
          0% { transform: scale(1, 0.6); }
          100% { transform: scale(1, 0.6); }
        }

        @keyframes barUp4 {
          0% { transform: scale(1, 0.8); }
          40% { transform: scale(1, 0.8); }
          50% { transform: scale(1, 0.4); }
          90% { transform: scale(1, 0.4); }
          100% { transform: scale(1, 0.8); }
        }

        @keyframes barUp5 {
          0% { transform: scale(1, 1); }
          40% { transform: scale(1, 1); }
          50% { transform: scale(1, 0.2); }
          90% { transform: scale(1, 0.2); }
          100% { transform: scale(1, 1); }
        }
      `}</style>
    </div>
  );
};

export default Loader;