"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
  error?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  options,
  error,
  className = "",
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState(() => {
    const selected = options.find((opt) => opt.value === props.value);
    return selected?.label || props.placeholder || "Select";
  });
  const selectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const selected = options.find((opt) => opt.value === props.value);
    if (selected) {
      setSelectedLabel(selected.label);
    }
  }, [props.value, options]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (value: string) => {
    if (props.onChange) {
      const event = {
        target: { value, name: props.name },
      } as React.ChangeEvent<HTMLSelectElement>;
      props.onChange(event);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {label && (
        <label className="block text-xs font-medium text-gray-700 mb-1 cursor-default">
          {label}
        </label>
      )}
      <div ref={selectRef} className="relative">
        {/* Hidden native select for form submission */}
        <select
          {...props}
          className="hidden"
          onChange={props.onChange}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* Custom dropdown button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full px-3 py-2 border ${
            error ? "border-red-400" : "border-gray-200"
          } rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4780C6] focus:border-transparent transition-all text-gray-900 text-sm cursor-pointer bg-white flex items-center justify-between ${
            isOpen ? "ring-2 ring-[#4780C6] border-transparent" : ""
          } ${className}`}
        >
          <span className={props.value ? "text-gray-900" : "text-gray-400"}>
            {selectedLabel}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* Dropdown menu */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="py-1 max-h-48 overflow-auto">
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`w-full px-3 py-2 text-left text-sm transition-colors cursor-pointer ${
                    props.value === option.value
                      ? "bg-[#4780C6]/10 text-[#4780C6] font-medium"
                      : "text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
};

