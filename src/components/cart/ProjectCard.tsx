import { FC, useEffect, useState } from 'react';
import OrderStatusPopup from './OrderStatusPopup';
import { useRouter } from 'next/navigation';
import axiosApi from '@/utils/axios-api';
import { API_ENDPOINTS } from '@/config/api-endpoint';
import { encryptString } from '@/utils/enc-utils';
import { Close } from '@carbon/icons-react';



interface ProjectCardProps {
    breakdown: any;
    carItem: any;
    details: any;
    countries: any
    refreshHandler: any
}

const ProjectCard: FC<ProjectCardProps> = ({ breakdown, carItem, details, countries, refreshHandler }) => {

    const [countryName, setCountryName] = useState()
    const [activeBuyButton, setActiveBuyButton] = useState(false);
    const [activeNegotiationButton, setActiveNegotiationButton] = useState();
    const [cartStatus, setCartStatus] = useState();
    const [isOpen, setIsOpen] = useState(false);
    const [orderCreated, setOrderCreated] = useState(false)
    const [stockAvaliable, setStockAvaliable] = useState(true)
    const router = useRouter();

    useEffect(() => {
        setActiveBuyButton((details.cart_status == 1 || details.cart_status == 4) && details.stocks_available);
        setActiveNegotiationButton((details.cart_status == 1 || details.cart_status == 2 || details.cart_status == 3 || details.cart_status == 5) && details.stocks_available);
        setCartStatus(details.cart_status)
        setStockAvaliable(areStocksAvailable(details.vintages))
        getCountryNameById()
    }, [])

    function areStocksAvailable(vintages: any) {
        return vintages.every((vintage: any) => vintage.stocks_available !== false);
    }

    function getCountryNameById() {
        console.log("countries", countries)
        const country = countries.find((country: any) => country._id === details?.country_id);
        setCountryName(country ? country.name : 'Country not found')
    }

    function negotiationHandler(id: any) {
        router.push(`/negotiation/${id}`);
    }

    function initiateBuyingHandler() {
        setIsOpen(true)
    }

    const deleteHandler = async (id: any) => {
        try {
            const requestBody = { cart_id: id };
            let encryptedPayload = {};
            if(Object.keys(requestBody).length && process.env.EMAIL_CHECK && process.env.EMAIL_CHECK.length > 0){
                encryptedPayload = encryptString(JSON.stringify(requestBody), process.env.EMAIL_CHECK);
            }
            const response = await axiosApi.project.post(API_ENDPOINTS.deleteCart, {
                data: encryptedPayload
            });

            if (response.status === 200) {
                refreshHandler()
            }
        } catch (error) {
            console.error(`Error : Unable to delete cart ${id}:`, error);
        }

    }

    return (
        <div className="fles sm:flex-col w-full bg-white shadow-lg rounded-lg border border-gray-200 mt-xl mb-xl">
            {/* Header Section */}
            <OrderStatusPopup setIsOpen={setIsOpen} isOpen={isOpen} details={details} setOrderCreated={setOrderCreated} />
            <div className="flex flex-col sc-sm:flex-row items-center m-xl h-full gap-l">
                <div className="w-full sc-sm:w-[230px] h-[160px] bg-blue-900 rounded-xl">
                    <img src="/bg.png" alt="Project" className='w-full h-full bg-cover rounded-xl' />
                </div>
                <div className='flex w-full flex-1 flex-col gap-s '>
                    <div className='flex items-start justify-between'>
                        <div className="text-f-2xl text-black font-semibold">{details?.project_name}</div>
                        {(cartStatus == 1 || cartStatus == 4 || !stockAvaliable) && !orderCreated && <div className='flex gap-l items-center'>
                            {/* <div className='flex gap-s items-center bg-white px-m py-s rounded-lg border border-brand1-500'>
                                <div className='text-black font-semibold text-f-m '>Download Estimation</div>
                                <div>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                        <path d="M6.5 10.5H13.085L11.795 11.795L12.5 12.5L15 10L12.5 7.50001L11.795 8.20501L13.085 9.50001H6.5V10.5Z" fill="black" />
                                        <path d="M11 7.00001V5.00001C11.0004 4.93421 10.9878 4.86897 10.9629 4.80806C10.938 4.74714 10.9013 4.69173 10.855 4.64501L7.355 1.14501C7.30828 1.09867 7.25287 1.06201 7.19195 1.03712C7.13103 1.01224 7.0658 0.999628 7 1.00001H2C1.73478 1.00001 1.48043 1.10537 1.29289 1.2929C1.10536 1.48044 1 1.73479 1 2.00001V14C1 14.2652 1.10536 14.5196 1.29289 14.7071C1.48043 14.8947 1.73478 15 2 15H10C10.2652 15 10.5196 14.8947 10.7071 14.7071C10.8946 14.5196 11 14.2652 11 14V13H10V14H2V2.00001H6V5.00001C6 5.26523 6.10536 5.51958 6.29289 5.70712C6.48043 5.89465 6.73478 6.00001 7 6.00001H10V7.00001H11ZM7 5.00001V2.20501L9.795 5.00001H7Z" fill="black" />
                                    </svg>
                                </div>
                            </div> */}
                             <button className='flex gap-s items-center bg-neutral-100 px-l py-m rounded-lg hover:bg-red-600' onClick={() => deleteHandler(details._id)}>
                                <div className='text-neutral-1400 font-semibold text-f-xs '>Remove</div>
                                <Close className='w-4 h-4 text-neutral-1000' />
                            </button>
                        </div>}
                    </div>

                    <div className="text-f-m text-black">{details?.country_name}</div>
                    <div className="text-gray-600 text-sm mt-2">
                        {details?.project_description ? details.project_description.length > 400 ? details.project_description.slice(0, 400) + "..." : details.project_description : "No Detail found"}
                    </div>
                    <div className="flex gap-[2px]">
                        {details && details?.sdg_goal && details?.sdg_goal.map((goal: any, index: any) => (
                            <span key={index} className="bg-red-200 text-red-600  text-xs font-semibold w-xl h-xl">
                                <img src={`${process.env.NEXT_PUBLIC_ESG_GOAL_ENDPOINT}/${goal.hero_image.name}`} />
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Table Section */}
            {details.vintages && <table className="w-full text-left border-t border-b border-gray-200">
                <thead className="bg-[#F8FAFC] ">
                    <tr className="font-semibold text-sm text-gray-700">
                        <th className=" px-4 py-3 border border-l-0">Vintage</th>
                        <th className=" px-4 py-3 border">Number of Credits (tCO₂e)</th>
                        <th className=" px-4 py-3 border">Rate ($)</th>
                        <th className=" px-4 py-3 border  border-r-0">Amount ($)</th>
                    </tr>
                </thead>
                <tbody>
                    {details.vintages.map((vintage: any, index: any) => (
                        <tr key={index} className="border-t border-gray-200 ">
                            <td className={`px-4 py-3 text-start font-semibold text-gray-600 ${index % 2 == 0 ? 'bg-white' : 'bg-neutral-50'}`}>{vintage.year}</td>
                            <td className={`px-4 py-3 text-start text-gray-600 ${index % 2 == 0 ? 'bg-white' : 'bg-neutral-50'}`}>{vintage.no_of_credits}</td>
                            <td className={`px-4 py-3 text-start text-gray-600 ${index % 2 == 0 ? 'bg-white' : 'bg-neutral-50'}`}>{vintage.negotiation_price == 0 ? parseFloat(vintage.per_credit_price.toFixed(3)) : parseFloat(vintage.negotiation_price.toFixed(3))}</td>
                            <td className={`px-4 py-3 text-start text-gray-600 ${index % 2 == 0 ? 'bg-white' : 'bg-neutral-50'}`}>{parseFloat(vintage.total_price.toFixed(3))}</td>
                        </tr>
                    ))}
                </tbody>
            </table>}

            {/* Summary Section */}
            <div className="flex flex-col sc-sm:flex-row py-l  border-t border-neutral-300 flex items-start sc-sm:items-center text-gray-700 bg-neutral-100 ">
                <div className="flex w-full sc-sm:flex-1 flex-col px-4 py-2 sc-sm:pl-l gap-2 border sc-sm:border-0 border-neutral-300">
                    <p className='text-f-xl font-normal'>{details.total_credits}</p>
                    <p className="text-f-m">Total Credits</p>
                </div>
                <div className="flex w-full sc-sm:flex-1 flex-col sc-sm:border-0 sc-sm:border-x px-4 py-2 sc-sm:pl-l gap-2 border border-neutral-300">
                    <p className='text-f-xl font-normal'>${parseFloat(details.total_price_exclusive.toFixed(3))}</p>
                    <p className="text-f-m ">Buying Amount</p>
                </div>
                <div className="flex w-full sc-sm:flex-1 flex-col px-4 py-2 sc-sm:pl-l gap-2 border sc-sm:border-0 border-neutral-300">
                    <p className='text-f-xl font-normal'>${details.discount}</p>
                    <p className="text-f-m">Discount</p>
                </div>
                {details.tax != 0 && <div className="flex w-full sc-sm:flex-1 flex-col px-4 py-2 sc-sm:pl-l gap-2 border sc-sm:border-0 sc-sm:border-x border-neutral-300">
                    <p className='text-f-xl font-normal'>${details.tax}</p>
                    <p className=" text-f-m">GST</p>
                </div>}
                <div className="flex w-full sc-sm:flex-1 flex-col px-4 py-2 sc-sm:pl-l gap-2 border sc-sm:border-0 border-neutral-300">
                    <p className='text-f-xl font-normal'>${details.platform_fees.toFixed(3)}</p>
                    <p className=" text-f-m">Platform Fee</p>
                </div>
                <div className="flex w-full sc-sm:flex-1 flex-col px-4 py-2 sc-sm:pl-l gap-2 border sc-sm:border-0 sc-sm:border-l border-neutral-300">
                    <p className='text-f-xl font-normal'>${parseFloat(details.total_price_inclusive.toFixed(3))}</p>
                    <p className="text-f-m">Net Total Amount</p>
                </div>
                {(Number(cartStatus) >= 6 || stockAvaliable) ? <div className="flex sc-sm:flex-[2] sc-sm:border-l border-neutral-500  justify-center text-center gap-xl sc-xl:py-4 p-4">
                    <div className={`flex gap-s items-center bg-white px-xl py-s rounded-lg border whitespace-nowrap ${activeNegotiationButton ? 'border-brand1-500 cursor-pointer hover:border-brand1-600' : 'border-neutral-300'}`} onClick={() => activeNegotiationButton ? negotiationHandler(details._id) : undefined}>
                        <div>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M4 4.5C3.60444 4.5 3.21776 4.3827 2.88886 4.16294C2.55996 3.94318 2.30362 3.63082 2.15224 3.26537C2.00087 2.89992 1.96126 2.49778 2.03843 2.10982C2.1156 1.72186 2.30608 1.36549 2.58579 1.08579C2.86549 0.806082 3.22186 0.615601 3.60982 0.53843C3.99778 0.46126 4.39991 0.500867 4.76537 0.652242C5.13082 0.803617 5.44318 1.05996 5.66294 1.38886C5.8827 1.71776 6 2.10444 6 2.5C6 3.03043 5.78929 3.53914 5.41421 3.91421C5.03914 4.28929 4.53043 4.5 4 4.5ZM4 1.5C3.80222 1.5 3.60888 1.55865 3.44443 1.66853C3.27998 1.77841 3.15181 1.93459 3.07612 2.11732C3.00043 2.30004 2.98063 2.50111 3.01921 2.69509C3.0578 2.88907 3.15304 3.06726 3.29289 3.20711C3.43275 3.34696 3.61093 3.4422 3.80491 3.48079C3.99889 3.51937 4.19996 3.49957 4.38268 3.42388C4.56541 3.34819 4.72159 3.22002 4.83147 3.05557C4.94135 2.89112 5 2.69778 5 2.5C5 2.23478 4.89464 1.98043 4.70711 1.79289C4.51957 1.60536 4.26522 1.5 4 1.5Z" fill="black" />
                                <path d="M12 4.5C11.6044 4.5 11.2178 4.3827 10.8889 4.16294C10.56 3.94318 10.3036 3.63082 10.1522 3.26537C10.0009 2.89992 9.96126 2.49778 10.0384 2.10982C10.1156 1.72186 10.3061 1.36549 10.5858 1.08579C10.8655 0.806082 11.2219 0.615601 11.6098 0.53843C11.9978 0.46126 12.3999 0.500867 12.7654 0.652242C13.1308 0.803617 13.4432 1.05996 13.6629 1.38886C13.8827 1.71776 14 2.10444 14 2.5C14 3.03043 13.7893 3.53914 13.4142 3.91421C13.0391 4.28929 12.5304 4.5 12 4.5ZM12 1.5C11.8022 1.5 11.6089 1.55865 11.4444 1.66853C11.28 1.77841 11.1518 1.93459 11.0761 2.11732C11.0004 2.30004 10.9806 2.50111 11.0192 2.69509C11.0578 2.88907 11.153 3.06726 11.2929 3.20711C11.4327 3.34696 11.6109 3.4422 11.8049 3.48079C11.9989 3.51937 12.2 3.49957 12.3827 3.42388C12.5654 3.34819 12.7216 3.22002 12.8315 3.05557C12.9414 2.89112 13 2.69778 13 2.5C13 2.23478 12.8946 1.98043 12.7071 1.79289C12.5196 1.60536 12.2652 1.5 12 1.5Z" fill="black" />
                                <path d="M13 15H11C10.7348 15 10.4804 14.8946 10.2929 14.7071C10.1054 14.5196 10 14.2652 10 14V10.5H11V14H13V9.5H14V6.5C14 6.36739 13.9473 6.24022 13.8536 6.14645C13.7598 6.05268 13.6326 6 13.5 6H10.29L8 10L5.71 6H2.5C2.36739 6 2.24021 6.05268 2.14645 6.14645C2.05268 6.24022 2 6.36739 2 6.5V9.5H3V14H5V10.5H6V14C6 14.2652 5.89464 14.5196 5.70711 14.7071C5.51957 14.8946 5.26522 15 5 15H3C2.73478 15 2.48043 14.8946 2.29289 14.7071C2.10536 14.5196 2 14.2652 2 14V10.5C1.73478 10.5 1.48043 10.3946 1.29289 10.2071C1.10536 10.0196 1 9.76522 1 9.5V6.5C1 6.10218 1.15804 5.72064 1.43934 5.43934C1.72064 5.15804 2.10218 5 2.5 5H6.29L8 8L9.71 5H13.5C13.8978 5 14.2794 5.15804 14.5607 5.43934C14.842 5.72064 15 6.10218 15 6.5V9.5C15 9.76522 14.8946 10.0196 14.7071 10.2071C14.5196 10.3946 14.2652 10.5 14 10.5V14C14 14.2652 13.8946 14.5196 13.7071 14.7071C13.5196 14.8946 13.2652 15 13 15Z" fill="black" />
                            </svg>
                        </div>
                        <div className='text-black font-normal text-f-m '>{(cartStatus == 1 && !orderCreated) ? "Start Negotiation" : (cartStatus == 2 && !orderCreated) ? "Offer send" : (cartStatus == 3 && !orderCreated) ? "New Offer" : (cartStatus == 4 || orderCreated) ? "Negotiation Done" : (cartStatus == 5 && !orderCreated) ? "Limit Crossed" : "Negotiation Done"}</div>
                    </div>
                    <div className={`flex gap-s items-center px-xl py-s rounded-lg whitespace-nowrap ${(activeBuyButton && !orderCreated) ? 'bg-brand1-500 hover:bg-brand1-600 text-white' : (cartStatus == 6 || orderCreated) ? 'bg-brand1-500 text-white ' : 'bg-neutral-300 text-black'}`} onClick={(activeBuyButton && !orderCreated) ? initiateBuyingHandler : undefined} >
                        <div className='font-normal text-f-m'>{((cartStatus == 1 || cartStatus == 4) && !orderCreated) ? "Start Purchase Process" : (cartStatus == 6 || orderCreated) ? "Order Created" : (cartStatus == 7 && !orderCreated) ? "Payment Done" : "Start Purchase Process"}</div>
                    </div>
                </div> : <div className="flex flex-[2] border-l border-neutral-500  justify-center text-center gap-xl   px-s">
                    <div className={`flex gap-s items-center px-xl py-s rounded-lg bg-brand1-500 text-white`}  >
                        Out Of Stock
                    </div></div>}

            </div>
        </div>
    );
};

export default ProjectCard;
