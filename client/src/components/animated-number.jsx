import React, { useEffect, useState } from "react";
import { animate } from "framer-motion";

const AnimatedNumber = ({ value, formatFn, duration = 0.7 }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const controls = animate(0, value, {
      duration,
      ease: "easeOut",
      onUpdate(val) {
        setDisplayValue(val);
      }
    });
    return () => controls.stop();
  }, [value, duration]);

  return <span>{formatFn ? formatFn(Math.round(displayValue)) : Math.round(displayValue).toLocaleString()}</span>;
};

export default AnimatedNumber;
