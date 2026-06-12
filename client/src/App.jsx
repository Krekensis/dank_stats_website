import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/HomePage";
import ItemValueVisualizer from "./pages/ItemValueVisualizer";
import AllItemsOverview from "./pages/AllItemsOverview";
import ItemMarketVisualizer from "./pages/ItemMarketVisualizer";
import AllPetsOverview from "./pages/AllPetsOverview";
import PetMarketVisualizer from "./pages/PetMarketVisualizer";
import ApiPage from "./pages/ApiPage";

import { Analytics } from "@vercel/analytics/react"

const App = () => {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/item-value-visualizer" element={<ItemValueVisualizer />} />
        <Route path="/all-items-overview" element={<AllItemsOverview />} />
        <Route path="/item-market-visualizer" element={<ItemMarketVisualizer />} />
        <Route path="/all-pets-overview" element={<AllPetsOverview />} />
        <Route path="/pet-market-visualizer" element={<PetMarketVisualizer />} />
        <Route path="/api-docs" element={<ApiPage />} />
      </Routes>
      <Analytics />
    </>
  );
};

export default App;
