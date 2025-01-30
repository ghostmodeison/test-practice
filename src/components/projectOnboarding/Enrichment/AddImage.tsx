import React, { useState } from 'react';

interface AddLocationProps {
    onClose: () => void;
    onSubmit: (data: any) => void;
}

const AddImage: React.FC<AddLocationProps> = ({ onClose, onSubmit }) => {

    const [formData, setFormData] = useState({
        description: '',
        tag: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        let parseValue = value;
        if (name == "tag") {
            parseValue = value.slice(0, 60)
        }
        setFormData({
            ...formData,
            [name]: parseValue,
        });


    };

    const handleSubmit = () => {
        onSubmit(formData);
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-20">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold">Add Details</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        &#x2715;
                    </button>
                </div>
                <div className="mt-4">
                    {/** Form fields */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Title</label>
                            <input
                                type="text"
                                name="tag"
                                value={formData.tag}
                                onChange={handleChange}
                                placeholder="Enter the title"
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand1-500 focus:border-brand1-500 sm:text-sm border py-xs px-xs"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Description</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={(e: any) => handleChange(e)}
                                placeholder="Enter the description"
                                maxLength={200}
                                className="mt-1 block w-full h-[200px] border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand1-500 focus:border-brand1-500 sm:text-sm border py-xs px-xs resize-none"
                            />
                        </div>


                    </div>

                    {/** Action buttons */}
                    <div className="mt-6 flex justify-end space-x-4">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                        >
                            Cancel
                        </button>
                        {(formData.tag.trim() != '' && formData.description.trim() != '') ? <button
                            onClick={handleSubmit}
                            className={`px-4 py-2 bg-brand1-500 text-white rounded-md hover:bg-brand1-600`}
                        >
                            Submit
                        </button> : <div
                            className={`px-4 py-2 bg-gray-400 text-white rounded-md`}
                        >
                            Submit
                        </div>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddImage;
