'use client'
import React, { useState } from 'react'
import Stepper from '../ui/Stepper'
import { useSelector } from 'react-redux';
import About from "@/components/projectOnboarding/Details/About";
import DocumentUpload from "@/components/projectOnboarding/Details/DocumentUpload";

const steps: any = [
    { title: 'Basic Details', description: 'Details to validate your project' },
    { title: 'Documents', description: 'Legal document of the project' }
];

const stepComponents: Record<number, React.ReactNode> = {
    0: <About />,
    1: <DocumentUpload />
};

const Details = () => {
    const currentStep = useSelector((state: any) => state.projectOnboarding.detailStepper);
    return (
        <div className="text-black relative max-w-screen-lg h-auto mx-auto flex mt-xl ">
            <div className='flex-1 mr-2xl'>
                {stepComponents[currentStep]}
            </div>
            <div className='flex-[0.4] '>
                <Stepper steps={steps} currentStep={currentStep} />
            </div>
        </div>
    )
}

export default Details