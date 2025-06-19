import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/HomePage";
import ItemValueVisualizer from "./pages/ItemValueVisualizer";
import AllItemsOverview from "./pages/AllItemsOverview";

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/item-value-visualizer" element={<ItemValueVisualizer />} />
      <Route path="/all-items-overview" element={<AllItemsOverview/>} />
    </Routes>
  );
};

export default App;
