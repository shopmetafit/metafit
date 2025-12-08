import React from "react";

const ColorOptions = ({ product, selectedColor, handleColorClick }) => {
  return (
    <div className="mb-4">
      <p className="font-medium text-gray-700">Color:</p>
      <div className="flex gap-3 mt-2 flex-wrap">
        {product.colors.map((color, index) => {
          const colorName = product.colorsName?.[index] || color;
          return (
            <button
              key={index}
              onClick={() => handleColorClick(color, index)}
              className={`w-8 h-8 rounded-full border-2 transition-transform ${
                selectedColor === color
                  ? "ring-2 ring-black scale-110"
                  : "border-gray-300 hover:scale-105"
              }`}
              style={{ backgroundColor: color }}
              title={colorName}
            />
          );
        })}
      </div>
    </div>
  );
};

export default ColorOptions;
