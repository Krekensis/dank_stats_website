import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/HomePage";
import ItemValueHistory from "./pages/ItemValueHistory2";

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/item-value-history" element={<ItemValueHistory />} />
    </Routes>
  );
};

export default App;
