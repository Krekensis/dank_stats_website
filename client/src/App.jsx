import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/HomePage";
import ItemValueVisualizer from "./pages/ItemValueVisualizer";
import AllItemsOverview from "./pages/AllItemsOverview";
import ItemMarketVisualizer from "./pages/ItemMarketVisualizer";
import { Analytics } from "@vercel/analytics/react"

const App = () => {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/item-value-visualizer" element={<ItemValueVisualizer />} />
        <Route path="/all-items-overview" element={<AllItemsOverview />} />
        <Route path="/item-market-visualizer" element={<ItemMarketVisualizer />} />
      </Routes>
      <Analytics />
    </>
  );
};

export default App;
