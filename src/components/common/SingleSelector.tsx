import React, { useEffect, useRef, useState } from "react";

const SingleSelector = ({ data, placeholder, selectedValue, onChange, error, allfieldsValue }: any) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const value = event.target.value;
        const selectedOption = data.find((item: any) => item._id == value) || null;
        const newData = { id: value, name: selectedOption?.name };
        onChange(newData);
        setIsOpen(false); // Close dropdown when selection is made
    };

    const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
            setIsOpen(false); // Close dropdown when clicking outside
        }
    };

    useEffect(() => {
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    useEffect(() => {
        console.log("Selected value:", selectedValue, "Data:", data);
    }, [selectedValue, data]);

    return (
        <div ref={dropdownRef} className="relative">
            <select
                value={selectedValue || ''}
                onChange={handleChange}
                onClick={() => setIsOpen(true)} // Open dropdown on click
                className={`block my-s w-full px-l py-s text-f-m border border-gray-300 rounded-lg focus:outline-none ${!error && ' hover:ring-brand1-500 hover:border-brand1-500 focus:border-brand1-500 focus:ring-brand1-500'} ${error ? 'border-red-500' : 'border-neutral-300'} ${!selectedValue && 'text-gray-400'}`}
            >
                <option value="" disabled hidden>
                    {placeholder}
                </option>
                {data && data.length > 0 && data.map((value: any) => (
                    <option key={value._id} value={value._id}>
                        {value.name}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default SingleSelector;
