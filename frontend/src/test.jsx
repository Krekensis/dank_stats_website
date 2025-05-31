import React from "react";
import Navcard from "./components/navcard.jsx"; // Adjust the path as necessary

const cardsData = [
  {
    heading: "Item value history",
    description: "Visualize change in item values over the years using graphs",
  },
  {
    heading: "Another card",
    description: "Description for the second card goes here.",
  },
  {
    heading: "Third card",
    description: "Some description for the third card.",
  },
];

const TestCards = () => (
  <div className="flex gap-6 p-10 bg-[#151f1c] min-h-[200px]">
    {cardsData.map((card, i) => (
      <Navcard
        key={i}
        heading={card.heading}
        description={card.description}
      />
    ))}
  </div>
);

export default TestCards;
