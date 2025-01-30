import SingleSelector from '@/components/common/SingleSelector';
import React, { useEffect, useState } from 'react';
import { getCountryNamesAndIds, getStateNamesAndIds } from '../SpecificationApis';

interface AddLocationProps {
    onClose: () => void;
    onSubmit: (data: any) => void;
    // setSelectedState: any
}

const AddLocation: React.FC<AddLocationProps> = ({ onClose, onSubmit }) => {
    const [countryList, setCountryList] = useState([]);
    const [stateList, setStateList] = useState([]);

    const [formData, setFormData] = useState({
        address: '',
        pincode: '',
        state_id: '',
        country_id: '',
        latitude: '',
        longitude: '',
        country_name: '',
        state_name: '',
    });

    const [errors, setErrors] = useState({
        address: '',
        pincode: '',
        state_id: '',
        country_id: '',
        latitude: '',
        longitude: '',
    });

    const countryListHandler = async () => {
        try {
            const list = await getCountryNamesAndIds()
            setCountryList(list);
        } catch (e: any) {
            console.log(e)
        } finally {
            console.log("finally")
        }
    }
    const stateListHandler = async (id: string) => {
        try {
            const list = await getStateNamesAndIds(id)
            setStateList(list);
        } catch (e: any) {
            console.log(e)
        } finally {
            console.log("finally")
        }
    }

    useEffect(() => {
        countryListHandler()
    }, [])

    const handleChange = (e: any) => {
        const { name, value } = e.target;
        if (name === "country_id") {
            stateListHandler(value.id);
        }

        let parsedValue: any = value;
        if (name == "address") {
            parsedValue = value.trimStart().slice(0, 100)
        }
        if (name == "pincode") {
            parsedValue = value.trimStart().slice(0, 100)
        }
        else if (name === 'latitude' || name === 'longitude') {
            if (value !== "") {
                if (value.length > 10) {
                    setErrors((prevErrors) => ({
                        ...prevErrors,
                        [name]: "Maximum 10 characters allowed.",
                    }));
                    return;  // Exit early if value exceeds max length
                }

                if (!isNaN(parseFloat(value))) {
                    parsedValue = parseFloat(value);
                } else {
                    setErrors((prevErrors) => ({
                        ...prevErrors,
                        [name]: "This field should be a number.",
                    }));
                    return;
                }
            }

        }


        setErrors((prevErrors) => ({
            ...prevErrors,
            [name]: parsedValue ? '' : 'This field is required',
        }));
        let newdata: any;
        if (name === "country_id") {
            newdata = {
                [name]: parsedValue.id,
                "country_name": parsedValue.name,
                "state_id": '',
                "state_name": ''
            }
        }
        else if (name === "state_id") {
            newdata = {
                [name]: parsedValue.id,
                "state_name": parsedValue.name
            }
        }
        else {
            newdata = {
                [name]: parsedValue
            }
        }

        console.log("longitude  ####==", newdata)
        setFormData({
            ...formData,
            ...newdata
        });
        console.log("=========----------=========", formData)
    };

    const validateForm = () => {
        const newErrors: any = {};
        Object.entries(formData).forEach(([key, value]) => {
            console.log("validateForm", key)
            if (!value && key !== 'state_id' && key !== 'state_name') {
                newErrors[key] = 'This field is required';
            }
        });
        console.log("validateForm newErrors", newErrors)
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (validateForm()) {
            console.log(formData)
            onSubmit(formData);
        }
    };

    return (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[95%] overflow-scroll">
                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold">Add Location</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        &#x2715;
                    </button>
                </div>
                <div className="mt-4 space-y-4 ">
                    <div>
                        <label className="block text-f-m font-medium text-gray-700">Address  <span className="text-negativeBold">*</span></label>
                        <input
                            type="text"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            placeholder="Add Address"
                            className="mt-1 px-l py-s block w-full border border-gray-300 rounded-md shadow-sm hover:ring-brand1-500 hover:border-brand1-500 focus:outline-none focus:border-brand1-500 focus:ring-brand1-500 sm:text-sm"
                        />
                        {errors.address && (
                            <p className="text-negativeBold text-sm mt-1">{errors.address}</p>
                        )}
                    </div>

                    <div>
                        <label className="block  text-f-m font-medium text-gray-700">Pincode  <span className="text-negativeBold">*</span></label>
                        <input
                            type="text"
                            name="pincode"
                            value={formData.pincode}
                            onChange={handleChange}
                            placeholder="Add Pincode"
                            className="mt-1 px-l py-s block w-full border border-gray-300 rounded-md shadow-sm hover:ring-brand1-500 hover:border-brand1-500 focus:outline-none focus:border-brand1-500 focus:ring-brand1-500 sm:text-sm"
                        />
                        {errors.pincode && (
                            <p className="text-negativeBold text-sm mt-1">{errors.pincode}</p>
                        )}
                    </div>

                    <div>
                        <label className="block  text-f-m font-medium text-gray-700">Country  <span className="text-negativeBold">*</span></label>
                        <SingleSelector
                            data={countryList}
                            placeholder="Select the Country"
                            name="country_id"
                            selectedValue={formData.country_id}
                            onChange={(selected: any) =>
                                handleChange({ target: { name: 'country_id', value: selected } })
                            }
                        />
                        {errors.country_id && (
                            <p className="text-negativeBold text-sm mt-1">{errors.country_id}</p>
                        )}
                    </div>
                    <div className={`${formData.country_id != '' ? '' : 'pointer-events-none'}`}>
                        <label className="block  text-f-m font-medium text-gray-700">State</label>
                        <SingleSelector
                            data={stateList}
                            placeholder="Select the State"
                            name="state_id"
                            selectedValue={formData.state_id}
                            onChange={(selected: any) =>
                                handleChange({ target: { name: 'state_id', value: selected } })
                            }
                        />
                        {errors.state_id && (
                            <p className="text-negativeBold text-sm mt-1">{errors.state_id}</p>
                        )}
                    </div>
                    <div>
                        <label className="block  text-f-m font-medium text-gray-700">Latitude  <span className="text-negativeBold">*</span></label>
                        <input
                            type="text"
                            name="latitude"
                            value={formData.latitude}
                            onChange={handleChange}
                            placeholder="Add Latitude"
                            className="mt-1 px-l py-s block w-full border border-gray-300 rounded-md shadow-sm hover:ring-brand1-500 hover:border-brand1-500 focus:outline-none focus:border-brand1-500 focus:ring-brand1-500 sm:text-sm"
                        />
                        {errors.latitude && (
                            <p className="text-negativeBold text-sm mt-1">{errors.latitude}</p>
                        )}
                    </div>

                    <div>
                        <label className="block  text-f-m font-medium text-gray-700">Longitude  <span className="text-negativeBold">*</span></label>
                        <input
                            type="text"
                            name="longitude"
                            value={formData.longitude}
                            onChange={handleChange}
                            placeholder="Add Longitude"
                            className="mt-1 px-l py-s block w-full border border-gray-300 rounded-md shadow-sm hover:ring-brand1-500 hover:border-brand1-500 focus:outline-none focus:border-brand1-500 focus:ring-brand1-500 sm:text-sm"
                        />
                        {errors.longitude && (
                            <p className="text-negativeBold text-sm mt-1">{errors.longitude}</p>
                        )}
                    </div>

                    <div className="mt-6 flex justify-end space-x-4">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                        >
                            Submit
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddLocation;
