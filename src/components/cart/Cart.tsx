import React, { useEffect, useState, useCallback } from 'react';
import ProjectCard from './ProjectCard';
import { getAuthCredentials } from '@/utils/auth-utils';
import { getCountryNamesAndIds } from '../projectOnboarding/SpecificationApis';
import { getBaseUrl } from '@/utils/axios-api';
import { useDispatch } from 'react-redux';
import { addcart } from '@/app/store/slices/addCartSlice';
import { Loader } from '@/components/ui/loader';

const Cart = () => {
    const [countryList, setCountryList] = useState([]);
    const [projectCartDetails, setProjectCartDetails] = useState([]);
    const [refresh, setRefresh] = useState(false);
    const [loading, setLoading] = useState(true); // Loading state
    const dispatch = useDispatch();

    const fetchProjectDetails = useCallback(async () => {
        const token = getAuthCredentials();
        setLoading(true); // Show loading before the API call

        try {
            const response = await fetch(`${getBaseUrl('project')}/fetch-cart`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token?.token}`
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch: ${response.statusText} (status: ${response.status})`);
            }

            const result = await response.json();
            console.log("Fetched Cart Details:", result);
            setProjectCartDetails(result.data.cart_list || []);
            dispatch(addcart(result.data.cart_list.length || 0));
        } catch (error: any) {
            console.error("Error fetching Cart details:", error.message || error);
        } finally {
            setLoading(false); // Hide loading after the API call
        }
    }, [dispatch]);

    const countryListHandler = useCallback(async () => {
        try {
            const list = await getCountryNamesAndIds();
            console.log("countryListHandler", list);
            setCountryList(list);
        } catch (e) {
            console.error(e);
        }
    }, []);

    useEffect(() => {
        setProjectCartDetails([]);
        fetchProjectDetails();
        countryListHandler();
    }, [fetchProjectDetails, countryListHandler, refresh]);

    const refreshHandler = () => {
        setRefresh((prev) => !prev);
    };

    return (
        <div className="pt-xl flex flex-col gap-4 px-10 sc-sm:px-6 max-w-screen-sc-2xl mx-auto w-full ">
            {loading ? (
                <Loader />
            ) : projectCartDetails.length === 0 ? (
                <div className="flex-1 flex flex-col text-neutral-600 text-f-5xl py-2xl mb-10xl items-center justify-center">
                    <div className="text-f-7xl font-semibold text-brand1-500">Your Cart is Empty!</div>
                    <div className="text-f-3xl">Start building a sustainable future by adding carbon credits to your cart.</div>
                    {/* <div className="text-f-6xl font-light pt-xl text-negativeBold">YOUR SHOPPING CART IS EMPTY</div> */}
                </div>
            ) : (
                <div className='w-full '>
                    <div className="flex justify-between items-center mx-auto w-full">
                        <div className="text-black font-light text-f-3xl">Shopping Cart</div>
                        <div className="text-neutral-1200 font-light text-f-3xl">{projectCartDetails.length} Items</div>
                    </div>
                    {projectCartDetails.map((projectDetail, index) => (
                        <ProjectCard
                            key={index}
                            breakdown={0}
                            carItem={0}
                            details={projectDetail}
                            countries={countryList}
                            refreshHandler={refreshHandler}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default Cart;
