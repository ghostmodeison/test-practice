'use client'
import React, { useRef, useState, useEffect } from 'react';
import Input from "@/components/ui/input";
import { customToast } from "@/components/ui/customToast";
import * as yup from 'yup';
import { Routes } from "@/config/routes";
import DatePicker, { DateObject } from "react-multi-date-picker";
import EditableTableCell from "@/app/project/agreement/components/editableCell";
import axiosApi from "@/utils/axios-api";
import Checkbox from "@/components/ui/checkbox";
import { API_ENDPOINTS } from "@/config/api-endpoint";
import { useRouter } from "next/navigation";
import { PageProps } from "@/types";
import { encryptString } from '@/utils/enc-utils';
import { Edit } from '@carbon/icons-react';

interface Batch {
    _id: string;
    project_id: string;
    status: number;
    agreement_id: string;
    total_credit: number;
    per_credit_price: number;
    start_date: string;
    end_date: string;
    created_at: string;
    updated_at: string;
}

interface Vintage {
    _id: string;
    project_id: string;
    batch_id: string;
    total_credit: number;
    per_credit_price: number;
    year: string;
    status: number;
    updated_at: string;
    created_at: string;
}

interface BatchResponse {
    batch: Batch;
    vintages: Vintage[];
}

// Custom Scrollbar Component
const CustomScrollbar: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const contentRef = useRef<HTMLDivElement>(null);
    const [scrollPercentage, setScrollPercentage] = useState(0);


    const handleScroll = () => {
        const element = contentRef.current;
        if (element) {
            const scrolled = element.scrollTop;
            const maxScroll = element.scrollHeight - element.clientHeight;
            const percentage = (scrolled / maxScroll) * 100;
            setScrollPercentage(percentage);
        }
    };

    useEffect(() => {
        const element = contentRef.current;
        if (element) {
            element.addEventListener('scroll', handleScroll);
            return () => element.removeEventListener('scroll', handleScroll);
        }
    }, []);

    return (
        <div className="flex justify-between items-start self-stretch flex-grow relative">
            <div
                ref={contentRef}
                className="flex-grow pr-4 h-[194px] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            >
                {children}
            </div>
            <div className="flex-shrink-0 w-1.5 h-[194px] relative">
                <div className="w-1.5 h-full absolute right-0 bg-neutral-300" />
                <div
                    className="w-1.5 absolute right-0 bg-primary transition-all duration-200"
                    style={{
                        height: '100px',
                        top: `${scrollPercentage}%`,
                        transform: `translateY(-${scrollPercentage}%)`
                    }}
                />
            </div>
        </div>
    );
};

interface FormData {
    batch_id: string;
    total_credit: number;
    per_credit_price: number;
    start_date: string;
    end_date: string;
    vintages: Array<{
        _id: string;
        total_credit: number;
    }>;
}

const validationSchema = yup.object().shape({
    batch_id: yup.string().required('Batch ID is required'),
    total_credit: yup.number().required('Total credit is required').max(999999999999, 'Total credits can not exceed 12 digits').positive('Total credit must be positive'),
    per_credit_price: yup.number().required('Price per credit is required').max(9999999999, 'Price per credit can not exceed 10 digits').positive('Per Credit Price must be positive'),
    start_date: yup.string().required('Start date is required'),
    end_date: yup.string().required('End date is required'),
    vintages: yup.array().of(
        yup.object().shape({
            _id: yup.string().required(),
            total_credit: yup.number().required().max(9999999999, 'Price per credit can not exceed 10 digits').positive('Per Credit Price must be positive')
        })
    )
});

// Main Component
const AgreementPage = ({ searchParams }: PageProps) => {
    const router = useRouter();
    const [isChecked, setIsChecked] = useState(false);
    const [data, setData] = useState<BatchResponse | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formErrors, setFormErrors] = useState<any>({});
    const [dateRange, setDateRange] = useState<DateObject[]>([]);
    const [editingVintageId, setEditingVintageId] = useState<string | null>(null);
    const [alreadySubmitted, setAlreadySubmitted] = useState(false);
    const handleEditClick = (vintageId: string) => {
        setEditingVintageId(vintageId);
    };
    const token = searchParams.token;
    console.log(token);
    const formatDate = (date: string): DateObject => {
        const [year, month, day] = date.split('-').map(Number);
        return new DateObject({ year, month, day });
    };
    const [formData, setFormData] = useState<FormData>({
        batch_id: '',
        total_credit: 0,
        per_credit_price: 0,
        start_date: '',
        end_date: '',
        vintages: []
    });

    useEffect(() => {
        const token = searchParams.token;
        if (!token) {
            console.log(token);
            customToast.error("No token ID found in URL.");
        }
        const fetchData = async () => {
            try {
                const response: any = await axiosApi.project.get(API_ENDPOINTS.ProjectAgreement, {
                    params: {
                        token: token
                    }
                });
                if (response.status != 200) {
                    if (response.status === 401) {
                        customToast.error("Your session has expired. Please log in again.");
                        router.replace(Routes.SignIn);
                        return;
                    } else {
                        const errorData = await response.json().catch(() => null);
                        customToast.error(errorData?.message || 'Failed to fetch agreement data');

                    }
                }

                let responseData = response.data;
                setData(responseData);
                if (responseData?.batch) {
                    setFormData(({
                        batch_id: responseData.batch._id,
                        total_credit: responseData.batch.total_credit,
                        per_credit_price: responseData.batch.per_credit_price,
                        start_date: responseData.batch.start_date,
                        end_date: responseData.batch.end_date,
                        vintages: responseData.vintages.map((v: Vintage) => ({
                            _id: v._id,
                            total_credit: v.total_credit
                        }))
                    }));
                    const startDate = formatDate(responseData.batch.start_date);
                    const endDate = formatDate(responseData.batch.end_date);
                    setDateRange([startDate, endDate]);
                }
            } catch (e: any) {
                console.log(e);
            } finally {
                console.log("finally");
            }
        };
        fetchData();
    }, [router, searchParams]);

    const handleSubmit = async () => {
        try {
            if (!isChecked) {
                customToast.error("Please agree to the terms first");
                return;
            }

            const hasInvalidVintages = formData.vintages.some(
                vintage => vintage.total_credit < 0 || vintage.total_credit > 9999999999
            );

            if (hasInvalidVintages) {
                customToast.error("Please correct all vintage credit values before submitting");
                return;
            }

            await validationSchema.validate(formData, { abortEarly: false });

            setIsSubmitting(true);

            const requestBody = {
                batch_id: formData.batch_id,
                total_credit: calculateTotalCredits(formData.vintages),
                per_credit_price: Number(formData.per_credit_price),
                start_date: formData.start_date,
                end_date: formData.end_date,
                vintages: formData.vintages.map(vintage => ({
                    _id: vintage._id,
                    total_credit: vintage.total_credit
                }))
            };
            console.log(requestBody);

            const token = searchParams.token;
            let encryptedPayload = {};
            if (Object.keys(requestBody).length && process.env.EMAIL_CHECK && process.env.EMAIL_CHECK.length > 0) {
                encryptedPayload = encryptString(JSON.stringify(requestBody), process.env.EMAIL_CHECK);
            }
            const response: any = await axiosApi.project.patch(API_ENDPOINTS.AgreementSubmit(token), { data: encryptedPayload });
            if (response.status == 200) {
                customToast.success("Agreement updated successfully");
            } else {
                customToast.success('Failed to update agreement');
            }
            setAlreadySubmitted(true);
        } catch (error) {
            if (error instanceof yup.ValidationError) {
                const errors: { [key: string]: string } = {};
                error.inner.forEach(err => {
                    if (err.path) {
                        errors[err.path] = err.message;
                    }
                });
                setFormErrors(errors);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDateChange = (dates: DateObject[]) => {
        if (Array.isArray(dates) && dates.length === 2) {
            setDateRange(dates);

            // Update formData with the new dates
            setFormData(prev => ({
                ...prev,
                start_date: dates[0].format('YYYY-MM-DD'),
                end_date: dates[1].format('YYYY-MM-DD')
            }));

            if (formErrors.start_date || formErrors.end_date) {
                setFormErrors((prev: any) => ({
                    ...prev,
                    start_date: '',
                    end_date: ''
                }));
            }
        }
    };

    const handleCreditUpdate = (vintageId: string, newValue: number) => {
        if (newValue === null) {
            return;
        }

        setFormData(prev => {
            const updatedVintages = prev.vintages.map(vintage =>
                vintage._id === vintageId
                    ? { ...vintage, total_credit: newValue }
                    : vintage
            );

            return {
                ...prev,
                vintages: updatedVintages,
                vintageTotalCredits: calculateTotalCredits(updatedVintages)
            };
        });
    };

    const calculateTotalCredits = (vintages: Array<{ _id: string; total_credit: number }>) => {
        return vintages.reduce((sum, vintage) => sum + vintage.total_credit, 0);
    };

    return (
        <>
            {data && (
                <div className="flex flex-col justify-start items-start self-stretch m-auto w-[768px] p-8">
                    <div className="flex flex-col justify-start items-start self-stretch flex-grow gap-[72px] px-6 pb-6 rounded-lg">
                        {/* Logo Section */}
                        <div className="flex flex-col justify-start items-center self-stretch gap-3 pt-4">
                            <div className="h-[45px]">
                                <img src='/logo.svg' className='cursor-pointer w-[80px] ' />
                            </div>
                        </div>

                        <div className="flex flex-col justify-start items-center self-stretch gap-8">
                            {/* Agreement Content */}
                            <div className="flex flex-col justify-start items-center self-stretch gap-3">
                                <p className="text-base text-center">
                                    <span className="text-neutral-1200">Dear, </span>
                                    <span className="text-neutral-1400">Project Owner</span>
                                </p>

                                <p className="text-base text-center text-neutral-1200">
                                    Kindly review and confirm your agreement so we can proceed to close the deal.
                                </p>

                                <p className="text-base font-semibold text-center">
                                    <span className="text-neutral-1200">Agree to sell - </span>
                                    <span className="text-neutral-1400">{calculateTotalCredits(formData.vintages)}</span>
                                    <span className="text-neutral-1200"> Carbon Credits @ $</span>
                                    <span className="text-neutral-1400">{formData.per_credit_price} per </span>
                                    <span className="text-neutral-1200">credit</span>
                                    <br />
                                    <span className="text-neutral-1200">for the following vintage</span>
                                </p>

                                {/* Terms Section */}
                                <div className="flex flex-col justify-start items-center self-stretch h-[260px] gap-2.5 p-4 rounded-lg border border-neutral-300">
                                    <p className="text-base font-semibold text-center text-neutral-1400">
                                        Terms & Conditions
                                    </p>
                                    <CustomScrollbar>
                                        <div className="text-base text-justify text-neutral-1200 whitespace-pre-line">
                                            <h6 className=" font-bold mb-8">TERMS AND CONDITIONS FOR BUYING CARBON
                                                CREDITS VIA THE envr PROJECT MARKETPLACE</h6>

                                            <div className="space-y-8">
                                                <section>
                                                    <h2 className="text-xl font-semibold mb-4">1. Introduction, Purpose and
                                                        Acceptance of the Terms</h2>
                                                    <p className="mb-4">Envr has created a marketplace page on our website (the
                                                        "Site"), which provides a venue for Buyers to find, learn about, and
                                                        purchase Standard-certified carbon credits from select projects located
                                                        around the world (the "Project Marketplace"). We want to make sure that
                                                        you have a positive experience. Please read on to find out more about
                                                        your rights as a Buyer, as well as our expectations of you. By buying
                                                        Gold Standard-certified carbon credits on the Project Marketplace you
                                                        accept these Buyer terms and conditions (the "Terms"). To accept and
                                                        adopt these Terms, please click on I agree to Envr Marketplace's Terms
                                                        of service box.</p>
                                                </section>

                                                <section>
                                                    <h2 className="text-xl font-semibold mb-4">2. Restrictions</h2>
                                                    <p className="mb-4">By shopping on the Envr Marketplace, you understand,
                                                        agree and represent that:</p>
                                                    <ul className="list-disc pl-6 space-y-2">
                                                        <li>You are at least eighteen (18) years old;</li>
                                                        <li>You have the authority and capability to enter in to these Terms;
                                                        </li>
                                                        <li>Payments via the online Project Marketplace platform are made
                                                            through third party payment providers, such as PayPal or Stripe;
                                                        </li>
                                                        <li>All prices are in US Dollars and all payments should be made in US
                                                            Dollars;
                                                        </li>
                                                        <li>Envr will take 15% of the proceeds from the price listed at the time
                                                            of purchase;
                                                        </li>
                                                        <li>After purchase, the Standard-certified carbon credits are publicly
                                                            retired in near to real-time;
                                                        </li>
                                                        <li>A Retirement Certificate will be sent to your email address;</li>
                                                        <li>Carbon credits purchased may not be sold onwards;</li>
                                                        <li>The credit Retirements are publicly displayed in the Envr
                                                            Retirements.
                                                        </li>
                                                    </ul>
                                                </section>

                                                <section>
                                                    <h2 className="text-xl font-semibold mb-4">3. Purchasing credits on the Envr
                                                        Project Marketplace</h2>
                                                    <p className="mb-4">When you buy ENVR carbon credits, you represent, agree
                                                        and understand that:</p>
                                                    <ul className="list-disc pl-6 space-y-2">
                                                        <li>You have read the project listing, including the project
                                                            description;
                                                        </li>
                                                        <li>You will submit appropriate and timely payment;</li>
                                                        <li>The ENVR will transparently retire the credits on your behalf.</li>
                                                    </ul>
                                                </section>

                                                <section>
                                                    <h2 className="text-xl font-semibold mb-4">4. Payment terms</h2>
                                                    <p className="mb-4">Payments can be made:</p>
                                                    <ul className="list-disc pl-6 space-y-2">
                                                        <li>Online via PayPal or credit/debit card;</li>
                                                        <li>By direct bank transfer for amounts over $5,000.00</li>
                                                    </ul>
                                                    <p className="mt-4">For bank transfers:</p>
                                                    <ul className="list-disc pl-6 space-y-2">
                                                        <li>Provide written confirmation via email to credits@ENVR.EARTH</li>
                                                        <li>ENVR will respond with an invoice within 3 business days</li>
                                                        <li>Payment must be made within 15 business days</li>
                                                        <li>Credits will be retired within 3 business days of receiving funds
                                                        </li>
                                                    </ul>
                                                </section>

                                                <section>
                                                    <h2 className="text-xl font-semibold mb-4">5. Refunds</h2>
                                                    <p>The ENVR-certified carbon credits are non-refundable once retired.</p>
                                                </section>

                                                <section>
                                                    <h2 className="text-xl font-semibold mb-4">6. Tax Deduction</h2>
                                                    <p>Tax deductibility depends on your local laws. Please consult a tax
                                                        professional.</p>
                                                </section>

                                                <section>
                                                    <h2 className="text-xl font-semibold mb-4">7. Communicating with Project
                                                        Developers</h2>
                                                    <p>Contact information for Project Developers is available under each
                                                        Project's listing.</p>
                                                </section>

                                                <section>
                                                    <h2 className="text-xl font-semibold mb-4">8. Privacy and data
                                                        protection</h2>
                                                    <p className="mb-4">ENVR handles personal data in accordance with our
                                                        Privacy Policy. You consent to background checks as required by law.</p>
                                                </section>

                                                <section>
                                                    <h2 className="text-xl font-semibold mb-4">9. Copyright</h2>
                                                    <p>Project images and information belong to the Project Developers and/or
                                                        Participants. You may use this information to communicate your climate
                                                        action efforts with proper attribution.</p>
                                                </section>

                                                <section>
                                                    <h2 className="text-xl font-semibold mb-4">11. Termination</h2>
                                                    <p className="mb-4">These Terms apply to each individual purchase. ENVR
                                                        reserves the right to restrict access and take legal action for
                                                        fraudulent actions or material breaches.</p>
                                                </section>
                                            </div>
                                        </div>
                                    </CustomScrollbar>
                                </div>
                            </div>

                            {/* Table Section */}
                            <div className="flex flex-col justify-center items-start self-stretch overflow-hidden gap-3">
                                <table className="w-full border border-neutral-300">
                                    <thead>
                                        <tr className="h-14 border text-left border-neutral-300">
                                            <th className="flex-grow px-2 py-3 text-sm font-semibold text-neutral-1400">Vintage</th>
                                            <th className="flex-grow px-2 py-3 text-sm font-semibold text-neutral-1400">Credits
                                                (tCO₂e)
                                            </th>
                                            <th className="flex-grow px-2 py-3 text-sm font-semibold text-neutral-1400">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data?.vintages.map((row, index) => (
                                            <tr
                                                key={index}
                                                className="min-h-[64px] border border-neutral-300"
                                            >
                                                <td className="flex-grow px-2 py-3 text-neutral-1200">{row.year}</td>
                                                <td className="flex-grow px-2 py-3">
                                                    <div className="flex flex-grow relative gap-2">
                                                        <EditableTableCell
                                                            initialValue={row.total_credit}
                                                            onSubmit={(newValue) => handleCreditUpdate(row._id, newValue)}
                                                            isEditing={editingVintageId === row._id}
                                                            onFinishEditing={() => setEditingVintageId(null)}
                                                        />
                                                    </div>
                                                </td>
                                                <td className="w-[100px] px-2 py-3">
                                                    <button
                                                        className="p-1 rounded-full "
                                                        onClick={() => handleEditClick(row._id)}
                                                    >
                                                        <Edit className="w-4 h-4 text-[#161616]" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        <tr className="h-14 border border-neutral-300">
                                            <td className="flex-grow px-2 py-3">
                                                <p className="text-sm font-semibold text-neutral-1400">
                                                    Total Credits (tCO₂e)
                                                </p>
                                            </td>
                                            <td className="flex-grow px-2 py-3" colSpan={2}>
                                                <p className="text-sm font-semibold text-neutral-1400">
                                                    {calculateTotalCredits(formData.vintages)}
                                                </p>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* Footer Section */}
                            <div className="flex flex-col justify-center items-start self-stretch gap-8">
                                {/* Date Picker */}
                                <div className="flex flex-col justify-start items-start self-stretch gap-2">
                                    <label className="block text-sm font-medium text-neutral-1200 mb-2">
                                        Engagement Period
                                    </label>
                                    <DatePicker
                                        range
                                        value={dateRange}
                                        onChange={handleDateChange}
                                        dateSeparator=" - "
                                        rangeHover
                                        editable={false}
                                        format="YYYY-MM-DD"
                                        containerClassName={'flex w-full'}
                                        inputClass={`flex w-full justify-start items-center self-stretch flex-grow-0 flex-shrink-0 h-[42px] relative gap-2 px-[15px] py-2 rounded-lg bg-white border ${formErrors.start_date || formErrors.end_date
                                            ? 'border-danger'
                                            : 'border-neutral-300'
                                            } text-sm text-neutral-1200 outline-none`}
                                    />
                                    {(formErrors.start_date || formErrors.end_date) && (
                                        <p className="mt-1 text-xs text-danger">
                                            {formErrors.start_date || formErrors.end_date}
                                        </p>
                                    )}
                                </div>

                                <div className="flex flex-col justify-start items-start self-stretch gap-2">
                                    <Input
                                        className="w-full"
                                        label="Price Per Credit ($)"
                                        type='text'
                                        inputClassName='text-black w-full'
                                        value={formData.per_credit_price}
                                        onChange={(e) => {
                                            const value = e.target.value;

                                            if (value.length > 10) return;

                                            // Allow empty value or value matching pattern (numbers with up to 2 decimals)
                                            if (/^\d*\.?\d{0,2}$/.test(value)) {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    per_credit_price: value as unknown as number
                                                }));
                                                if (formErrors.per_credit_price) {
                                                    setFormErrors((prev: any) => ({
                                                        ...prev,
                                                        per_credit_price: ''
                                                    }));
                                                }
                                            }
                                        }}
                                        onKeyDown={(e) => {
                                            if (['e', 'E', '+', '-'].includes(e.key)) {
                                                e.preventDefault();
                                            }
                                        }}
                                    />
                                    {(formErrors.per_credit_price || formErrors.per_credit_price) && (
                                        <p className="mt-1 text-xs text-danger">
                                            {formErrors.per_credit_price || formErrors.per_credit_price}
                                        </p>
                                    )}
                                </div>

                                <div className="flex items-center justify-center space-x-2">
                                    <Checkbox
                                        id="keepLoggedIn"
                                        onClick={() => setIsChecked(!isChecked)}
                                        className={`w-6 h-6 rounded bg-white border transition-colors ${isChecked ? 'border-primary bg-primary/10' : 'border-neutral-300 hover:border-primary'
                                            }`}
                                    />
                                    <label htmlFor="keepLoggedIn" className="text-sm text-[#333] ml-2">
                                        I agree ENVR agreement
                                    </label>
                                </div>
                                {/* Action Buttons */}
                                <div className="flex justify-start items-start self-stretch gap-6">
                                    <button
                                        className="flex justify-center items-center flex-grow h-14 px-6 rounded-lg bg-primary hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        onClick={handleSubmit}
                                        disabled={isSubmitting || alreadySubmitted}
                                    >
                                        <span className="text-base text-center text-white">
                                            {isSubmitting ? 'Submitting...' : 'Accept'}
                                        </span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </>
    );
};

export default AgreementPage;