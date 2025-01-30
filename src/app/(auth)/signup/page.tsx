'use client'
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import Link from 'next/link';
import AuthLayout from '@/layouts/AuthLayout';
import Input from '@/components/ui/input';
import Checkbox from '@/components/ui/checkbox';
import { useRouter } from "next/navigation";
import { getAuthCredentials, isAuthenticated } from "@/utils/auth-utils";
import { Routes } from "@/config/routes";
import { customToast } from "@/components/ui/customToast";
import axiosApi from "@/utils/axios-api";
import { API_ENDPOINTS } from "@/config/api-endpoint";
import { AxiosError } from "axios";
import { encryptString } from '@/utils/enc-utils';
import {Edit, View, ViewOff} from '@carbon/icons-react';

const signUpFormSchema = yup.object().shape({
    email: yup.string().email('Invalid email format').matches(
        /^[a-zA-Z0-9]+([._]?[a-zA-Z0-9]+)*@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        "Email must not have special characters."
    ).max(100, 'Email must not exceed 255 characters').required('Email is required'),
    password: yup.string().required('Password is required'),
    terms: yup.boolean()
    //Testing@001.oneOf([true], 'You must accept the terms and conditions')
});




const Home = () => {
    const router = useRouter();
    const { token } = getAuthCredentials();
    if (isAuthenticated({ token })) {
        router.replace(Routes.Dashboard);
    }
    const [showPassword, setShowPassword] = useState(false);
    const [isPasswordTooShort, setIsPasswordTooShort] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isEmailRealOnly, setIsEmailRealOnly] = useState(false);
    const { register, handleSubmit, formState: { errors }, getValues, trigger } = useForm({
        resolver: yupResolver(signUpFormSchema),
    });

    const handleTogglePasswordVisibility = () => {
        setIsPasswordVisible(!isPasswordVisible);
    };

    const handleEmailEdit = () => {
        setIsEmailRealOnly(!isEmailRealOnly);
    };

    const onSubmit = async (data: any) => {
        if (data.password.length < 8) {
            customToast.warning("Password length should be minimum 8 characters.");
            return;
        }

        if (!data.terms) {
            customToast.error("Please accept the terms and conditions.");
            return;
        }

        try {
            const requestBody = { email: data.email, password: data.password };
            let encryptedPayload = {};
            if (Object.keys(requestBody).length && process.env.EMAIL_CHECK && process.env.EMAIL_CHECK.length > 0) {
                encryptedPayload = encryptString(JSON.stringify(requestBody), process.env.EMAIL_CHECK);
            }
            const response = await axiosApi.auth.post(API_ENDPOINTS.SignUp, {
                data: encryptedPayload
            });

            if (response.status === 200 || response.status === 201) {
                customToast.success("Please verify your account");
                router.push(`${Routes.VerifyEmail}?email=${encodeURIComponent(data.email)}`);
            } else {
                customToast.error(response.data.message || "Sign up failed. Please try again.");
            }
        } catch (error: any) {
            console.error('Error during sign up:', error);
            if (error instanceof AxiosError && error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                // customToast.error(error.response.data.message || "Sign up failed. Please try again.");
            }
        }
    };

    const handleChange = (e: any) => {
        const password = e.target.value;
        setIsPasswordTooShort(password.length < 8);
    };

    const handleContinue = async () => {
        const result = await trigger('email');
        if (result) {
            setIsEmailRealOnly(true);
            setShowPassword(true);
        }
    };

    return (
        <AuthLayout>
            <h1 className="text-f-3xl font-semibold text-center text-neutral-1400">Create your account</h1>
            <form onSubmit={handleSubmit(onSubmit)} noValidate  className={`flex flex-col w-full ${showPassword ? 'gap-y-6' : 'gap-y-8'}`}>

                <Input
                    label='Email Address'
                    required={true}
                    inputClassName={'border-primary'}
                    registration={register('email')}
                    type="email"
                    id="email"
                    placeholder="Email Address"
                    readOnly={isEmailRealOnly}
                    icon={showPassword ? <Edit className="w-6 h-6 text-[#161616]" /> : undefined}
                    onIconClick={handleEmailEdit}
                    error={errors.email?.message}
                />

                {!showPassword ? (
                    <button type="button" onClick={handleContinue} className="w-full h-14 bg-brand1-500 text-white rounded-lg mb-6">
                        Continue
                    </button>
                ) : (
                    <>
                        <Input
                            label='Password'
                            required={true}
                            inputClassName={'border-primary'}
                            registration={register('password')}
                            type={isPasswordVisible ? 'text' : 'password'}
                            id="password"
                            error={errors.password?.message}
                            onChange={handleChange}
                            icon={showPassword ? (
                                isPasswordVisible ?
                                    <View className="w-6 h-6 text-[#161616]" /> :
                                    <ViewOff className="w-6 h-6 text-[#161616]" />
                            ) : undefined}
                            onIconClick={handleTogglePasswordVisibility}
                        />
                        {isPasswordTooShort && (
                            <div
                                className="flex flex-col justify-start items-start self-stretch flex-grow-0 flex-shrink-0 h-[84px] relative gap-2 px-[15px] py-2 rounded-lg bg-white border border-[#e6e6e6]">
                                <p className="flex-grow-0 flex-shrink-0 text-base text-center text-neutral-1200">
                                    Your password must contain 8 characters
                                </p>
                                <div
                                    className="flex justify-start items-center flex-grow-0 flex-shrink-0 relative gap-2">
                                    <img src='/check.svg'
                                        className="flex-grow-0 flex-shrink-0 w-6 h-6 relative" />
                                    <p className="flex-grow-0 flex-shrink-0 text-base text-center text-neutral-1200">
                                        At least 8 characters
                                    </p>
                                </div>
                            </div>
                        )}
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                registration={register('terms')}
                                id="terms"
                                error={errors.terms?.message}
                            />
                            <label htmlFor="terms" className="text-f-m text-neutral-1200">
                                I agree to the <Link href={Routes.Terms} className="text-tertiary underline">terms and conditions</Link>
                            </label>
                        </div>

                        <button type="submit" className="w-full h-14 bg-brand1-500 text-white rounded-lg">
                            Create Account
                        </button>
                    </>
                )}
            </form>
            <p className="text-center text-neutral-1200">
                Already have an account? <Link href={Routes.SignIn} className="text-tertiary underline">Login</Link>
            </p>
        </AuthLayout>
    );
};

export default Home;