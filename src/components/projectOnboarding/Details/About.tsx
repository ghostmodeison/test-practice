import React, { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation';
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import * as Yup from 'yup';
import {
    currentProjectDetail,
    incrementDetailStepper
} from "@/app/store/slices/projectOnboardingSlice";
import AxiosApi from "@/utils/axios-api";
import { API_ENDPOINTS } from "@/config/api-endpoint";
import { Routes } from "@/config/routes";
import axiosApi from "@/utils/axios-api";
import { LabelHandler } from "@/components/common/LabelHandler";
import { ButtonGroup } from "@/components/common/ButtonGroup";
import SingleSelector from '@/components/common/SingleSelector';
import { getRegisterNamesAndIds } from '../SpecificationApis';
import { encryptString } from '@/utils/enc-utils';

const validationSchema = Yup.object().shape({
    project_name: Yup.string().required('Project name is required'),
    project_url: Yup.string().url('Must be a valid URL').required('Project URL is required'),
    project_id: Yup.string().required('Project ID is required').matches(/^[a-zA-Z0-9]+$/, 'Only letters and numbers are allowed'),
    project_status: Yup.string().required('Project status is required'),
});

const About: React.FC = () => {
    const dispatch = useDispatch();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [registryList, setRegistryList] = useState([]);
    const [selectedRegistry, setSelectedRegistry] = useState<any>({ name: "", _id: "" });
    const [registryError, setRegisterError] = useState(false);

    interface RootState {
        projectOnboarding: {
            ckAssisted?: boolean;
        };
    }

    const ckAssisted = useSelector((state: RootState) => state.projectOnboarding?.ckAssisted ?? true);
    const projectDetail = useSelector((state: any) => state.projectOnboarding?.projectDetail);
    const [statusOptions, setStatusOptions] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        project_name: '',
        project_url: '',
        project_id: '',
        project_status: '',
    });

    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});


    useEffect(() => {
        const fetchStatusOptions = async () => {
            try {
                const response = await AxiosApi.project.get(API_ENDPOINTS.ProjectStatus);
                setStatusOptions(response.data.data.project_statuses);
            } catch (error) {
                if (axios.isAxiosError(error)) {
                    if (!error.response) {
                        console.log(error)
                    }
                }
            }
        };

        const fetchProjectDetail = async () => {
            try {
                console.log("project Detail Getting Successfully.", projectDetail)

                if (projectDetail) {
                    setFormData({
                        project_name: projectDetail.name || '',
                        project_url: projectDetail.project_url || '',
                        project_id: projectDetail.project_id || '',
                        project_status: projectDetail.project_status._id || ''
                    });
                    if (projectDetail.registry) {
                        let addregister = {
                            _id: projectDetail.registry._id,
                            name: projectDetail.registry.name
                        }
                        setSelectedRegistry(addregister);
                    }
                }
            } catch (error) {
                if (axios.isAxiosError(error)) {
                    if (!error.response) {
                        console.log(error)
                    }
                }
            }
        };

        fetchStatusOptions();
        fetchProjectDetail();
    }, [projectDetail, searchParams]);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (selectedRegistry._id == "") {
            setRegisterError(true);
            // return;
        }
        setErrors({});
        setIsLoading(true);
        try {
            const projectId = searchParams.get('id');
            await validationSchema.validate(formData, { abortEarly: false });

            const submissionData = {
                ...formData,
                name: formData.project_name,
                registry: selectedRegistry._id,
                ck_assisted: ckAssisted !== undefined ? ckAssisted : true,
                onboarding_status: {
                    step_number: 1,
                    step_name: "details",
                    is_complete: true
                }
            };

            let projectResponse;
            const requestBody = submissionData
            let encryptedPayload = {};
            if(Object.keys(requestBody).length && process.env.EMAIL_CHECK && process.env.EMAIL_CHECK.length > 0){
                encryptedPayload = encryptString(JSON.stringify(requestBody), process.env.EMAIL_CHECK);
            }
            if (!projectId) {
                projectResponse = await AxiosApi.project.post(API_ENDPOINTS.ProjectInit, {data: encryptedPayload});
            } else {
                projectResponse = await axiosApi.project.put(API_ENDPOINTS.ProjectUpdate(projectId), {data: encryptedPayload});
            }
            const projectData = projectResponse.data.data.project;
            if (projectData) {
                dispatch(incrementDetailStepper())
               // dispatch(currentProjectDetail(projectData));
                console.log(projectData);
                router.replace(`${Routes.ProjectCreate}?id=${projectData._id}`);
            } else {
                console.log("Unexpected response from server");
            }
        } catch (error) {
            if (error instanceof Yup.ValidationError) {
                const validationErrors: { [key: string]: string } = {};
                error.inner.forEach((err) => {
                    if (err.path) {
                        validationErrors[err.path] = err.message;
                    }
                });
                setErrors(validationErrors);
            } else if (axios.isAxiosError(error)) {
                if (error.response) {
                    console.log(`API Error: ${error.response.status} - ${error.response.data.message || 'Unknown error'}`);
                } else {
                    console.log(`Request setup error: ${error.message}` );
                }
            } else {
                console.log('An unexpected error occurred while submitting the form');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        let { name, value }: any = e.target;

        // Prevent special characters for the project_id field
        if (name === 'project_id') {
            // Only allow alphanumeric characters
            value = value.replace(/[^a-zA-Z0-9]/g, '');
        }

        if ((name === 'project_name' || name === 'project_id' || name === 'project_url') && value.trim() === '') {
            value = '';
        }

        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));

        // Clear the error for this field when the user starts typing
        if (errors[name]) {
            setErrors(prevErrors => ({ ...prevErrors, [name]: '' }));
        }
    };


    const onclickBackButton = () => {
        router.replace(`${Routes.ProjectCreate}`);
    }

    const projectCompletionStatus = useSelector((state: any) =>
        state.projectOnboarding?.projectDetail?.project_completion_status ?? 0
    );
    const onSkip = () => {
        dispatch(incrementDetailStepper())
    }

    useEffect(() => {

        const fetchData = async () => {
            try {
                const list = await getRegisterNamesAndIds()
                setRegistryList(list);
            } catch (e: any) {
                console.log(e)
            } finally {
                console.log("finally")
            }
        };

        fetchData();
    }, [])


    return (
        <div className="w-full">
            <h1 className="text-4xl font-light text-neutral-1400">About your project</h1>
            <p className="text-base text-neutral-1200 mt-1">Fill in the details below</p>

           {/* {errors.api && <p className="text-negativeBold mt-2">{errors.api}</p>}*/}

            <form onSubmit={handleSubmit} className="flex justify-start items-start self-stretch">
                <div className="w-full max-w-[875px] mx-auto flex flex-col gap-6 pt-3">
                    <div>
                        <LabelHandler title="Project Registry" instruction="" />
                        <SingleSelector
                            data={registryList}
                            placeholder="Enter project registry"
                            selectedValue={selectedRegistry._id}
                            onChange={(selected: any) => {
                                console.log(selected)
                                setSelectedRegistry({ name: selected.name, _id: selected.id })
                            }}
                            error={registryError && !selectedRegistry._id}
                        />
                        {registryError && !selectedRegistry._id && <p className="text-negativeBold text-sm">This field is required</p>}
                    </div>
                    <div className="">
                        {[
                            { name: 'project_name', label: 'Name of your project', placeholder: 'Enter Project Name', hint: ''},
                            { name: 'project_url', label: 'Project URL', placeholder: 'Enter URL', hint: '' },
                            { name: 'project_id', label: 'Project ID', placeholder: 'Enter ID', hint: '' },
                        ].map((field) => (
                            <div key={field.name} className="grid grid-cols-1 mb-xl">
                                <LabelHandler title={field.label} instruction={field.hint} />
                                <input
                                    id={field.name}
                                    name={field.name}
                                    type="text"
                                    value={formData[field.name as keyof typeof formData]}
                                    onChange={handleInputChange}
                                    placeholder={field.placeholder}
                                    className={`my-s py-s px-l text-f-m border block w-full rounded-md shadow-sm sm:text-sm  focus:outline-none ${!errors[field.name] && ' hover:ring-brand1-500 hover:border-brand1-500 focus:border-brand1-500 focus:ring-brand1-500'} ${errors[field.name] ? 'border-red-500' : 'border-neutral-300'}`}
                                />
                                {errors[field.name] && <p className="text-negativeBold text-sm">{errors[field.name]}</p>}
                            </div>
                        ))}

                        <div className="grid grid-cols-1 my-xl">
                            <LabelHandler title={'Project Status'} instruction={''} />
                            <div className="relative">
                                <select
                                    id="project_status"
                                    name="project_status"
                                    value={formData.project_status}
                                    onChange={handleInputChange}
                                    className={`my-s py-s px-l text-f-m border block w-full rounded-md shadow-sm sm:text-sm focus:outline-none ${!errors.project_status && ' hover:ring-brand1-500 hover:border-brand1-500 focus:border-brand1-500 focus:ring-brand1-500'} ${errors.project_status ? 'border-red-500' : 'border-neutral-300'} appearance-none`}
                                >
                                    <option value="" disabled hidden>Select Status</option>
                                    {statusOptions.map((status) => (
                                        <option key={status._id} value={status._id}>{status.project_status_name}</option>
                                    ))}
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                                    <svg className="w-4 h-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd"
                                            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                            clipRule="evenodd" />
                                    </svg>
                                </div>
                            </div>
                            {errors.project_status && <p className="text-negativeBold text-sm">{errors.project_status}</p>}
                        </div>
                    </div>


                    <ButtonGroup
                        onBack={onclickBackButton}
                        onSubmit={() => { }}
                        submitType="submit"
                        isLoading={isLoading}
                        onSkip={onSkip}
                        isSkipVisible={[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].includes(projectCompletionStatus)}
                    />
                </div>
            </form>
        </div>
    )
}

export default About;