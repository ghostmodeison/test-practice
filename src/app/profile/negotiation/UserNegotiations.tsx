"use client";
import {customToast} from '@/components/ui/customToast';
import {API_ENDPOINTS} from '@/config/api-endpoint';
import axiosApi from '@/utils/axios-api';
import {encryptString} from '@/utils/enc-utils';
import {usePathname} from 'next/navigation';
import React, {useEffect, useState} from 'react'
import {ChevronLeft} from '@carbon/icons-react';


const UserNegotiations = (props: any) => {
    const [negotiationDetail, setNegotiationDetail] = useState<any>();
    const [active, setActive] = useState(true);
    const [hasChanged, setHasChanged] = useState(false);

    const fetchCartDetails = async () => {
        try {
            // alert("fetchCartDetails")
            const requestBody = {cart_id: props.activeCart};
            let encryptedPayload = {};
            if (Object.keys(requestBody).length && process.env.EMAIL_CHECK && process.env.EMAIL_CHECK.length > 0) {
                encryptedPayload = encryptString(JSON.stringify(requestBody), process.env.EMAIL_CHECK);
            }
            const response = await axiosApi.project.post(API_ENDPOINTS.cart, {
                data: encryptedPayload
            });

            if (response.status === 200) {
                console.log("fetchCartDetails", response.data.data.negotiation_details)
                setNegotiationDetail(response.data.data.negotiation_details)

            } else {
                customToast.error(response.data.message || "Unable to fetch Negotiation detail");
            }
        } catch (error) {
            console.error('Error during password reset request:', error);
        }
    }

    useEffect(() => {
        props.activeCart != '' && fetchCartDetails()
    }, [props.activeCart, active])

    const backHandler = () => {
        props.setActiveCart('')
    }

    const updatePriceHandler = async () => {
        if (!negotiationDetail) return;

        let counterPriceChecker = negotiationDetail.negotiation_vintages.map((vintage: any, index: number) => {
            let value = Number(props.role != "buyer" ? vintage.status == 2 ? vintage.seller_offer_price : vintage.seller_counter_price : vintage.status == 2 ? vintage.buyer_offer_price : vintage.buyer_counter_price);
            return value <= 0;
        });

        if (counterPriceChecker[0]) {
            customToast.info("Kindly confirm if you accept the offer or propose a counteroffer.")
            return;
        }

        const updates = negotiationDetail.negotiation_vintages.map((vintage: any, index: number) => ({
            vintage_id: vintage.vintage_id, // Use appropriate key for vintage ID
            offer_price: Number(props.role != "buyer" ? vintage.seller_offer_price : vintage.buyer_offer_price),
            counter_price: Number(props.role != "buyer" ? vintage.status == 2 ? vintage.seller_offer_price : vintage.seller_counter_price : vintage.status == 2 ? vintage.buyer_offer_price : vintage.buyer_counter_price),
            status: vintage.status == 2 ? 2 : vintage.accepted ? 2 : 1, // Set status based on checkbox
        }));

        const allStatusTwo = updates.every((update: any) => update.status === 2); // Check if all statuses are 2

        const payload = {
            negotiation_id: negotiationDetail._id,
            status: allStatusTwo ? 3 : 2, // Add new status at negotiation level
            updates,
        };

        console.log("Payload to update:", payload);
        const endPointUrl = props.role != "buyer" ? API_ENDPOINTS.seller_update_negotiation : API_ENDPOINTS.buyer_update_negotiation;
        try {
            const requestBody = payload;
            let encryptedPayload = {};
            if (Object.keys(requestBody).length && process.env.EMAIL_CHECK && process.env.EMAIL_CHECK.length > 0) {
                encryptedPayload = encryptString(JSON.stringify(requestBody), process.env.EMAIL_CHECK);
            }
            const response = await axiosApi.project.post(endPointUrl, {
                data: encryptedPayload
            });

            if (response.status === 200) {
                console.log("updatePriceHandler", response)
                customToast.success("Price Updated Successfully.")
                setActive(false)
            } else {
                customToast.error(response.data.message || "Unable to fetch Negotiation detail");
            }
        } catch (error) {
            console.error('Error during password reset request:', error);
        }
    }

    const handleAccept = (index: number) => {
        setNegotiationDetail((prevDetail: any) => {
            const updatedVintages = prevDetail.negotiation_vintages.map((vintage: any, i: number) => {
                if (i !== index) return vintage;

                const isBuyer = props.role === "buyer";
                console.log("handleAccept", negotiationDetail, vintage, !vintage.accepted)
                return {
                    ...vintage,
                    accepted: vintage.status == 2 ? true : !vintage.accepted, // Toggle accepted state
                    [isBuyer ? "buyer_counter_price" : "seller_counter_price"]: !vintage.accepted
                        ? isBuyer ? vintage.buyer_offer_price : vintage.seller_offer_price
                        : '', // Reset counter price when unchecked
                };
            });

            const anyNonZero = updatedVintages.every((vintage: any) =>
                parseFloat(props.role != "buyer" ? vintage.status == 2 ? vintage.seller_offer_price : vintage.seller_counter_price : vintage.status == 2 ? vintage.buyer_offer_price : vintage.buyer_counter_price) > 0
            );
            setHasChanged(anyNonZero);

            return {...prevDetail, negotiation_vintages: updatedVintages};
        });
    };

    function isNotZero(input: any) {
        // Convert the input to a number
        const number = parseFloat(input);

        // Check if it's a valid number and not zero
        return !isNaN(number) && number !== 0;
    }

    const handleInputChange = (index: number, value: string) => {
        // Allow only valid decimal numbers or keep the value as is
        if (value.length > 10) {
            return;
        }
        const isValidDecimal = /^(\d+)?(\.\d*)?$/.test(value);

        setNegotiationDetail((prevDetail: any) => {
            const updatedVintages = prevDetail.negotiation_vintages.map((vintage: any, i: number) => {
                if (i === index && isValidDecimal) {
                    let newdata = {};
                    if (props.role != "buyer") {
                        newdata = {...vintage, seller_counter_price: value}
                    } else {
                        newdata = {...vintage, buyer_counter_price: value}
                    }
                    return newdata;
                }
                return vintage;
            });

            // Check if any `seller_counter_price` is not zero and is a valid number
            const anyNonZero = updatedVintages.every((vintage: any) =>
                parseFloat(props.role != "buyer" ? vintage.status == 2 ? vintage.seller_offer_price : isNotZero(vintage.seller_counter_price) ? vintage.seller_counter_price : 0 : vintage.status == 2 ? vintage.buyer_offer_price : isNotZero(vintage.buyer_counter_price) ? vintage.buyer_counter_price : 0) > 0
            );

            console.log("handleInputChange", anyNonZero, updatedVintages)
            setHasChanged(anyNonZero);

            return {...prevDetail, negotiation_vintages: updatedVintages};
        });
    };


    return (
        <div className="flex flex-col w-full justify-center mx-auto max-w-screen-sc-2xl ">
            <div className="flex flex-col gap-6 p-6">
                <div className='flex gap-4'>
                    <button className='flex gap-s pr-l border-r items-center text-tertiary' onClick={backHandler}>
                        <ChevronLeft className="w-4 h-4 "/>
                        <div className='text-f-xl '>Back</div>
                    </button>
                    <div className='text-f-5xl  text-neutral-1400 font-light '>Negotiations</div>
                </div>
                <div className='flex bg-white p-6 w-full '>
                    <div className="w-full border rounded-lg p-6 gap-y-3">
                        <div className='flex flex-col sc-xs:flex-row gap-l justify-start sc-xs:justify-between mb-4'>
                            <h2 className="text-f-2xl font-semibold text-black">{negotiationDetail?.project_name.toUpperCase()} ({props.role.toUpperCase()})</h2>
                            {negotiationDetail && negotiationDetail.status != 1 && <button className={`rounded-lg text-f-m px-3 py-2 w-fit ${
                                negotiationDetail.status == 2
                                    ? "bg-btnWarning text-notice" // In progress
                                    : negotiationDetail.status == 3
                                        ? "bg-btnSuccess text-neutral-1400" // Completed
                                        : negotiationDetail.status == 4
                                            ? "bg-btnDanger text-neutral-1400" // Limit Crossed
                                            : ""
                            }`}>{negotiationDetail.status == 2 ? "In progress" : negotiationDetail.status == 3 ? "Completed" : negotiationDetail.status == 4 ? "Limit Crossed" : ""}</button>}
                        </div>
                        <div className='overflow-x-auto'>
                            <table className="w-full border border-collapse [&_td]:whitespace-nowrap [&_th]:whitespace-nowrap">
                                <thead className="text-sm font-semibold text-neutral-1400">
                                <tr className="bg-[#f3f3f3] border-b border-[#d9d9d9]">
                                    <th className=" px-s text-start py-m text-f-m">Vintage</th>
                                    <th className="text-f-m px-s text-start py-m">No. of Credit (tCO₂e)</th>
                                    {props.role != "buyer" &&
                                        <th className="text-f-m px-s text-start py-m">Actual Price ($)</th>}
                                        <th className="text-f-m px-s text-start py-m">Price per Credit ($)</th>
                                    {negotiationDetail && negotiationDetail.status != 3 &&
                                        <th className="text-f-m px-s text-start py-m ">Counter Price ($)</th>}
                                    {active && negotiationDetail && (props.role != negotiationDetail.updated_by) && negotiationDetail.status != 3 && (negotiationDetail.nagotiation_count != 3) && negotiationDetail.nagotiation_count <= 3 &&
                                        <th className="text-f-m px-s text-start py-m">Offer Price ($)</th>}
                                    {negotiationDetail && (props.role != negotiationDetail.updated_by) && (negotiationDetail.status != 1 && negotiationDetail.status != 3) &&
                                        <th className="text-f-m px-s text-start py-m">Status</th>}
                                </tr>
                                </thead>
                                {negotiationDetail && <tbody>
                                {negotiationDetail.negotiation_vintages.map((vintage: any, index: any) => (
                                    <tr key={index} className="border-b border-[#d9d9d9]">
                                        <td className="px-s text-f-m text-start py-m">{vintage.year}</td>
                                        <td className="px-s text-f-m text-start py-m">{vintage.total_credit}</td>
                                        {props.role != "buyer" &&
                                            <td className="px-s text-f-m text-start py-m">{vintage.actual_price}</td>}
                                        <td className={`px-s text-f-m text-start py-m ${negotiationDetail.status == 3 && "bg-brand1-100"}`}>{props.role != "buyer" ? vintage.seller_offer_price : vintage.buyer_offer_price}</td>
                                        {negotiationDetail && negotiationDetail.status != 3 &&
                                            <td className="px-s text-f-m text-start py-m ">{props.role != "buyer" ? vintage.status == 2 ? vintage.seller_offer_price : vintage.seller_counter_price : vintage.status == 2 ? vintage.buyer_offer_price : vintage.buyer_counter_price}</td>}
                                        {active && negotiationDetail && (props.role != negotiationDetail.updated_by) && (negotiationDetail.nagotiation_count != 3) && negotiationDetail.status != 3 && negotiationDetail.nagotiation_count <= 3 &&
                                            <td className="px-s text-f-m text-start py-m">
                                                {vintage.status != 2 ? <input
                                                    type="text"
                                                    className="w-full rounded px-s focus:outline-none focus:border-brand1-500 hover:border-brand1-600 h-[36px]"
                                                    placeholder="Enter Offer Price"
                                                    value={props.role != "buyer" ? vintage.seller_counter_price : vintage.buyer_counter_price}
                                                    onChange={(e) => handleInputChange(index, e.target.value)}
                                                    disabled={vintage.accepted}
                                                /> : props.role != "buyer" ? vintage.seller_offer_price : vintage.buyer_offer_price}
                                            </td>}
                                        {active && negotiationDetail && (props.role != negotiationDetail.updated_by) && (negotiationDetail.status != 1 && negotiationDetail.status != 3) && negotiationDetail.nagotiation_count <= 3 &&
                                            <td className="px-s text-f-m text-start py-m">
                                                {vintage.status != 2 ? <div className="flex items-center space-x-2  h-[36px]">
                                                    <input
                                                        type="checkbox"
                                                        className="h-4 w-4 checked"
                                                        checked={vintage.accepted}
                                                        onChange={() => handleAccept(index)}
                                                    />
                                                    <span>{vintage.accepted ? 'Accepted' : 'Accept'}</span>
                                                </div> : "Accepted"}
                                            </td>}
                                    </tr>
                                ))}
                                </tbody>}
                            </table>
                        </div>
                        {active && negotiationDetail && (props.role != negotiationDetail.updated_by) && negotiationDetail.status != 3 && negotiationDetail.nagotiation_count <= 3 &&
                            <div className="mt-4 flex justify-end space-x-4">
                                {/* <button className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
                                Submit Offer
                            </button> */}
                                <button
                                    className={` text-white px-4 py-2 rounded ${hasChanged ? "bg-brand1-500 hover:bg-brand1-600" : "bg-gray-300"} `}
                                    onClick={(!hasChanged) ? undefined : updatePriceHandler}>
                                    Update Price
                                </button>
                            </div>}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default UserNegotiations