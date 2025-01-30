'use client'
import AuthLayout from "../../../layouts/AuthLayout";
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from "next/navigation";
import { customToast } from "@/components/ui/customToast";
import axiosApi from "@/utils/axios-api";
import {API_ENDPOINTS} from "@/config/api-endpoint";
import { encryptString } from "@/utils/enc-utils";

interface PageProps {
    searchParams: {
        [key: string]: string | string[] | undefined
    }
}

const VerifyEmail = ({ searchParams }: PageProps) => {
    const router = useRouter();
    const token = searchParams.token;
    const toEmail = searchParams.email as string;
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [isResendEnabled, setIsResendEnabled] = useState(false);
    const hasCalledContinue = useRef(false);

    const handleContinue = useCallback(async () => {
        if (hasCalledContinue.current) return;
        hasCalledContinue.current = true;

        try {
            const requestBody = { email: toEmail };
            let encryptedPayload = {};
            if(Object.keys(requestBody).length && process.env.EMAIL_CHECK && process.env.EMAIL_CHECK.length > 0){
                encryptedPayload = encryptString(JSON.stringify(requestBody), process.env.EMAIL_CHECK);
            }
            const response = await axiosApi.auth.post(API_ENDPOINTS.ResendVerificationMail, {
                data: encryptedPayload
            });

            if (response.status === 200) {
                customToast.success(response.data.message);
            } else {
                customToast.error(response.data.message || "Failed to resend verification email. Please try again.");
            }
        } catch (error:any) {
            console.error('Error during resend:', error);

            if (error.response) {
                customToast.error(error.response.data.message || "Failed to resend verification email. Please try again.");
            }
        } finally {
            hasCalledContinue.current = false;
        }
    }, [toEmail]);

    useEffect(() => {
        if (timeRemaining <= 0) {
            setIsResendEnabled(true);
            return;
        }

        const timer = setInterval(() => {
            setTimeRemaining(prev => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [timeRemaining]);

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    const handleResendClick = () => {
        console.log("handleResendClick");
        setTimeRemaining(5);
        setIsResendEnabled(false);
        hasCalledContinue.current = false;
        handleContinue();
    };

    return (
        <AuthLayout>
            <div className="flex flex-col items-center text-center gap-3">
                <p className="text-f-3xl font-semibold text-neutral-1400">Verify your email</p>
                <p className="text-base text-neutral-1200">
                    <span>We sent an email to</span><br />
                    <span>{toEmail}</span><br />
                    <span>Click the link inside to get started.</span>
                </p>
            </div>

            <div className="flex items-center justify-center gap-2.5 mt-5">
                <div className="flex items-center justify-center h-14 w-[75px] rounded-lg bg-[#f2f2f2]">
                    <p className="text-base font-semibold text-black">{formatTime(timeRemaining)}</p>
                </div>
                <button
                    className={`flex justify-center items-center gap-4 h-14 w-[278px] p-6 rounded-lg ${isResendEnabled ? 'bg-brand1-500' : 'bg-[#f2f2f2]'}`}
                    onClick={handleResendClick}
                    disabled={!isResendEnabled}
                >
                    <img src='/social/google.svg' className="w-6 h-6" alt="Google icon"/>
                    <span className={`text-base font-semibold ${isResendEnabled ? 'text-white' : 'text-black'}`}>
                        Resend Link
                    </span>
                </button>
            </div>
        </AuthLayout>
    );
};

export default VerifyEmail;