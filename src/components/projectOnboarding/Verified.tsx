import React from 'react';
import { useDispatch } from "react-redux";
import { currentProjectDetail, currentStatusHandler } from "@/app/store/slices/projectOnboardingSlice";
import axiosApi from '@/utils/axios-api';
import { API_ENDPOINTS } from "@/config/api-endpoint";
import { useSearchParams } from "next/navigation";
import { encryptString } from '@/utils/enc-utils';

const Verified = () => {
    const dispatch = useDispatch();
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [error, setError] = React.useState('');
    const searchParams = useSearchParams();

    const handleSubmit = async (ckAssisted: boolean) => {
        setIsSubmitting(true);
        setError('');

        try {
            const projectId = searchParams.get('id');
            if (!projectId) {
                console.log("No project ID found in URL. Skipping project details fetch.");
                return;
            }
            const requestBody = { ck_assisted: ckAssisted }
            let encryptedPayload = {};
            if(Object.keys(requestBody).length && process.env.EMAIL_CHECK && process.env.EMAIL_CHECK.length > 0){
                encryptedPayload = encryptString(JSON.stringify(requestBody), process.env.EMAIL_CHECK);
            }
            const response = await axiosApi.project.put(
                API_ENDPOINTS.ProjectUpdate(projectId),{ data: encryptedPayload }
            );
            dispatch(currentStatusHandler(response.data.data.project.project_completion_status));
            dispatch(currentProjectDetail(response.data.data.project));
        } catch (err) {
            setError('Failed to update preferences. Please try again.');
            console.error('Error updating preferences:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen py-6xl flex flex-col items-center bg-white text-black">
            <h1 className="text-7xl font-normal pb-s text-brand1-500">Congratulations! </h1>
            <h2 className="text-xl font-light mt-4">Your Data Has Been Successfully Verified!</h2>
            <h2 className="text-xl text-neutral-800 font-light mt-m text-center"> You can now proceed with your project setup. Let us know how you’d like to continue.</h2>



            <p className="text-f-3xl my-2xl font-normal text-neutral-1200">
                Would you prefer to complete the onboarding process yourself or with Envr assistance?"
            </p>

            {error && (
                <div className="mb-4 p-4 bg-danger/10 text-danger rounded-lg">
                    {error}
                </div>
            )}

            <div className="flex justify-center items-center gap-4 pt-8">
                <button
                    onClick={() => handleSubmit(false)}
                    disabled={isSubmitting}
                    className="flex items-center h-12 gap-4 px-6 py-4 rounded-lg bg-primary hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <span className="text-sm text-white">
                        {isSubmitting ? 'Processing...' : 'Continue with Self-Onboarding'}
                    </span>
                    <svg
                        className="text-white"
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M10.9998 8L5.9998 13L5.2998 12.3L9.5998 8L5.2998 3.7L5.9998 3L10.9998 8Z"
                            fill="currentColor"
                        />
                    </svg>
                </button>

                <button
                    onClick={() => handleSubmit(true)}
                    disabled={isSubmitting}
                    className="flex items-center h-12 gap-4 px-6 py-4 rounded-lg bg-primary hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <span className="text-sm text-white">
                        {isSubmitting ? 'Processing...' : 'Continue with Envr Assistance'}
                    </span>
                    <svg
                        className="text-white"
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M10.9998 8L5.9998 13L5.2998 12.3L9.5998 8L5.2998 3.7L5.9998 3L10.9998 8Z"
                            fill="currentColor"
                        />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default Verified;