import React, { useEffect, useRef, useState } from 'react';
import AddImage from './AddImage';
import {
    currentProjectDetail,
    currentStatusHandler,
    currentTabHandler,
    decrementEnrichmentStepper,
    updateAllowedTabs
} from '@/app/store/slices/projectOnboardingSlice';
import { useDispatch, useSelector } from 'react-redux';
import { API_ENDPOINTS } from '@/config/api-endpoint';
import axiosApi from '@/utils/axios-api';
import { useRouter, useSearchParams } from 'next/navigation';
import { getAuthCredentials } from '@/utils/auth-utils';
import { Routes } from '@/config/routes';
import { customToast } from '@/components/ui/customToast';
import { WITHOUT_CREDITS_PROJECT_STATUS_IDS } from "@/utils/constants";
import { validateFile } from '@/utils/validate-file';
import { encryptString } from '@/utils/enc-utils';

interface GalleriesData {
    id: string, // Changed to string for uniqid
    thumbnail: any,
    title: string,
    description: string,
    country_id: string
}

const Gallery: React.FC = () => {
    const [locations, setLocations] = useState<any>([]);
    const [selectedLocations, setSelectedLocations] = useState<any>('');
    const [selectedImage, setSelecteImage] = useState<any>('');
    const [formValue, setFormValue] = useState<any>([])
    const [addImage, setAddImage] = useState(false);
    const [files, setFiles] = useState<File[]>([]); // Changed to store multiple files
    const [galleryItems, setGalleryItems] = useState<GalleriesData[]>([]);
    const dispatch = useDispatch();
    const searchParams = useSearchParams();
    const projectDetail = useSelector((state: any) => state.projectOnboarding?.projectDetail);
    const allowedTabs = useSelector((state: any) => state.projectOnboarding?.allowedTabs);
    const router = useRouter();
    const [completeOnboarding, setCompleteOnboarding] = useState(false)

    useEffect(() => {
        window.scrollTo(0, 0);
        const projectId = searchParams.get('id');
        if (!projectId) {
            console.log("No project ID found in URL. Skipping project details fetch.");
            return;
        }

        const fetchData = async () => {
            try {
                const projectResponse = await axiosApi.project.get(API_ENDPOINTS.ProjectCurrentStatus(projectId));
                const projectData = projectResponse.data.data.project_details;

                const newData = projectData.locations.map((location: any) => ({
                    ...location,
                    images: location.images && location.images.length > 0 ? location.images : []
                }));
                setFormValue(newData);
                console.log("setLocations", projectData.locations)
                setLocations(projectData.locations)
                setSelectedLocations(projectData.locations[0].state_id ? projectData.locations[0].state_id : projectData.locations[0].country_id)
            } catch (e: any) {
                console.log(e)
            } finally {
                console.log("finally")
            }
        };
        fetchData();
    }, []);

    const updateImagesInLocation = (countryId: any, newImage: any) => {
        setFormValue((prevLocations: any) =>
            prevLocations.map((location: any) =>
                (location.state_id ? location.state_id : location.country_id) == countryId
                    ? {
                        ...location,
                        images: [...location.images, newImage]
                    }
                    : location
            )
        );
    };

    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const validation = validateFile(e.target.files[0], 8, ['.jpg', '.jpeg', '.png']);
            if (!validation.isValid) {
                customToast.error(validation.error || 'Invalid file');

                // Clear the file input to allow re-upload of the same file
                e.target.value = '';
                return;
            }
            const uploadedFiles = Array.from(e.target.files); // Convert FileList to Array
            setFiles(uploadedFiles); // Update state with the selected files

            console.log('uploadedFiles', uploadedFiles)
            const newGalleryItems = uploadedFiles.map(async (uploadedFile) => {
                const formData = new FormData();
                formData.append('file', uploadedFile);
                formData.append('folder', 'project-images');
                try {
                    const token = getAuthCredentials();
                    const response = await fetch(`${process.env.NEXT_PUBLIC_REST_API_IMAGE_ENDPOINT}/auth/file-upload`, {
                        method: 'POST',
                        body: formData,
                        headers: {
                            'Authorization': `Bearer ${token.token}`
                        }

                    });

                    if (response.ok) {
                        const result = await response.json();
                        console.log('Files uploaded successfully:', result);
                        let newData = {
                            "name": uploadedFile.name,
                            "path": result.data.file_path,
                            "description": "Enter the description...'",
                            "title": uploadedFile.name
                        }



                        updateImagesInLocation(selectedLocations, newData);


                    } else {
                        console.error('Failed to upload files:', response.statusText);
                    }

                } catch (error) {
                    console.error('Error uploading files:', error);
                }
            });
        }
    };

    const handleDeleteImage = (imagePath: string) => {
        setFormValue((prevLocations: any) =>
            prevLocations.map((location: any) =>
                (location.state_id ? location.state_id : location.country_id) === selectedLocations
                    ? {
                        ...location,
                        images: location.images.filter((img: any) => img.path !== imagePath)
                    }
                    : location
            )
        );
    };

    const handleDownload = (imagePath: string) => {
        // Find the location with the specified country_id
        const location = formValue.find((loc: any) => (loc.state_id ? loc.state_id : loc.country_id) === selectedLocations);

        if (!location) {
            console.log(`Location with country_id ${selectedLocations} not found`);
            return;
        }

        // Find the image within the location that matches the imagePath
        const image = location.images.find((img: any) => img.path === imagePath);

        if (!image) {
            console.log(`Image with path ${imagePath} not found in location with country_id ${selectedLocations}`);
            return;
        }

        // Open the image in a new tab
        const imageUrl = `${process.env.NEXT_PUBLIC_IMAGE_ENDPOINT}/project-images/${image.path}`;
        window.open(imageUrl, '_blank');
    };

    const handleImageAdd = (id: string) => {
        setSelecteImage(id)
        setAddImage(true);
    };


    const onCloseImageHandler = () => {
        setAddImage(false);
    };

    const onSubmitImageHandler = (data: any) => {

        setFormValue((prevLocations: any) =>
            prevLocations.map((location: any) =>
                (location.state_id ? location.state_id : location.country_id) == selectedLocations
                    ? {
                        ...location,
                        images: location.images.map((image: any) =>
                            image.path === selectedImage
                                ? { ...image, description: data.description, title: data.tag }
                                : image
                        )
                    }
                    : location
            )
        );
        console.log(galleryItems)
        onCloseImageHandler()
    };

    const currentLocationHandler = (location_id: any) => {
        setSelectedLocations(location_id)
    }

    const nextHandler = async () => {
        const newData = {
            "locations": formValue,
            "onboarding_status": {
                "step_number": 6,
                "step_name": "enrichment",
                "is_complete": true,
            },
            "project_completion_status": 12,
        };

        try {
            const projectId = searchParams.get('id');
            if (!projectId) {
                console.error("No project ID found.");
                return;
            }
            const requestBody = newData;
            let encryptedPayload = {};
            if (Object.keys(requestBody).length && process.env.EMAIL_CHECK && process.env.EMAIL_CHECK.length > 0) {
                encryptedPayload = encryptString(JSON.stringify(requestBody), process.env.EMAIL_CHECK);
            }
            let response = await axiosApi.project.put(API_ENDPOINTS.ProjectUpdate(projectId), { data: encryptedPayload });

            if (response.status == 200) {
                setCompleteOnboarding(true)
            }
            // if (response.data.data && response.data.data.project) {
            //     // router.replace(`${Routes.ProjectCreate}?id=${projectId}`);
            // }

        } catch (e: any) {
            console.log(e)
        } finally {

            console.log("finally")
        }

        console.log(formValue)
    }

    const onclickBackButton = () => {
        dispatch(decrementEnrichmentStepper())
    }

    const handleSkip = async () => {
        if (projectDetail.project_completion_status == 4) {
            await router.replace(`${Routes.Project}/${projectDetail._id}`);
        }
    }

    const updateStatus = async () => {
        try {
            const requestBody = { project_completion_status: 4 };
            let encryptedPayload = {};
            if (Object.keys(requestBody).length && process.env.EMAIL_CHECK && process.env.EMAIL_CHECK.length > 0) {
                encryptedPayload = encryptString(JSON.stringify(requestBody), process.env.EMAIL_CHECK);
            }
            const response = await axiosApi.project.post(`/project-status/${projectDetail._id}`, {
                data: encryptedPayload
            });
            if (response.status === 200) {
                dispatch(currentProjectDetail(response.data.project));
                dispatch(currentStatusHandler(response.data.project.project_completion_status));
                if (WITHOUT_CREDITS_PROJECT_STATUS_IDS.includes(response.data.project?.project_status?._id)) {
                    dispatch(updateAllowedTabs({ isDetailsComplete: true, isSpecificationsComplete: true }));
                    dispatch(currentTabHandler("enrichment"));
                } else {
                    dispatch(updateAllowedTabs({ isDetailsComplete: true, isSpecificationsComplete: true, isEnrichmentComplete: true }));
                    dispatch(currentTabHandler("management"));
                }

                customToast.success(`Onboarding completed successfully.`);
            }
        } catch (err) {
            customToast.error('Failed to update status');
        } finally {
        }
    }

    return (
        <div className="w-full">
            {addImage && <AddImage onClose={onCloseImageHandler} onSubmit={onSubmitImageHandler} />}
            <h2 className="text-f-5xl font-light mb-xs">Gallery</h2>
            <p className="text-neutral-1200 text-f-l font-normal mb-xl ">Fill in the details below</p>

            {/* Location Selection */}
            <div className="flex space-x-4 mb-xl items-center">
                {locations.map((location: any, index: any) => (
                    <button
                        key={index}
                        className={`py-s px-m rounded-lg flex ${selectedLocations === (location.state_id ? location.state_id : location.country_id) ? 'bg-brand1-200' : 'bg-gray-200'}`}
                        onClick={() => {
                            currentLocationHandler(location.state_id ? location.state_id : location.country_id);
                        }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <g >
                                <path d="M7 7.87561C6.56736 7.87561 6.14443 7.74732 5.78469 7.50695C5.42496 7.26658 5.14458 6.92494 4.97902 6.52523C4.81345 6.12552 4.77013 5.68568 4.85454 5.26135C4.93894 4.83702 5.14728 4.44724 5.45321 4.14131C5.75914 3.83539 6.14891 3.62705 6.57324 3.54264C6.99758 3.45824 7.43741 3.50156 7.83712 3.66712C8.23684 3.83269 8.57848 4.11307 8.81884 4.4728C9.05921 4.83253 9.1875 5.25546 9.1875 5.68811C9.18684 6.26807 8.95616 6.82408 8.54607 7.23418C8.13598 7.64427 7.57996 7.87495 7 7.87561ZM7 4.37561C6.74042 4.37561 6.48666 4.45259 6.27082 4.59681C6.05498 4.74103 5.88675 4.94601 5.78741 5.18584C5.68807 5.42567 5.66208 5.68957 5.71272 5.94417C5.76337 6.19877 5.88837 6.43263 6.07193 6.61619C6.25548 6.79974 6.48935 6.92475 6.74395 6.97539C6.99855 7.02603 7.26245 7.00004 7.50228 6.9007C7.7421 6.80136 7.94709 6.63314 8.09131 6.4173C8.23553 6.20146 8.3125 5.9477 8.3125 5.68811C8.31212 5.34013 8.17372 5.00651 7.92766 4.76045C7.6816 4.5144 7.34798 4.37599 7 4.37561Z" fill="#4D4D4D" />
                                <path d="M7 13.1256L3.30947 8.77305C3.28852 8.74807 3.15714 8.57552 3.15714 8.57552C2.52666 7.7451 2.18603 6.73076 2.1875 5.68811C2.1875 4.41176 2.69453 3.18768 3.59705 2.28516C4.49957 1.38264 5.72365 0.87561 7 0.87561C8.27636 0.87561 9.50044 1.38264 10.403 2.28516C11.3055 3.18768 11.8125 4.41176 11.8125 5.68811C11.8141 6.73033 11.4737 7.74428 10.8435 8.57443L10.8429 8.57552C10.8429 8.57552 10.7116 8.74807 10.6921 8.77126L7 13.1256ZM3.85547 8.04842C3.85547 8.04842 3.95759 8.18326 3.98086 8.21222L7 11.7728L10.0231 8.20719C10.0423 8.18304 10.1451 8.0472 10.1451 8.0472C10.6602 7.36867 10.9385 6.53998 10.9375 5.68811C10.9375 4.64382 10.5227 3.6423 9.78424 2.90388C9.04581 2.16545 8.04429 1.75061 7 1.75061C5.95571 1.75061 4.9542 2.16545 4.21577 2.90388C3.47735 3.6423 3.0625 4.64382 3.0625 5.68811C3.06154 6.54044 3.34009 7.36957 3.85547 8.04842Z" fill="#4D4D4D" />
                            </g>
                            <defs>
                                <clipPath id="clip0_1983_52">
                                    <rect width="14" height="14" fill="white" transform="translate(0 0.000610352)" />
                                </clipPath>
                            </defs>
                        </svg>
                        <div className='text-f-xs font-semibold ml-xs text-gray-600 '>
                            {!location.state_name ? location.country_name : location.state_name}
                        </div>
                    </button>
                ))}
            </div>

            {/* Location Description */}
            {/* <div className="mb-6">
                <label className="block text-f-m text-neutral-1200 font-normal mb-s" htmlFor="description">
                    Project Description
                </label>
                <textarea
                    id="description"
                    className="w-full border rounded-md text-gray-700 resize-none px-l py-m"
                    placeholder="Description"
                    value={locationDescription}
                    onChange={(e) => setLocationDescription(e.target.value)}
                    maxLength={2000}
                    rows={5}
                />
                <p className="text-right italic text-f-m text-gray-400">Max. 2000 characters</p>
            </div> */}

            {(![4, 6, 7, 8, 9, 10].includes(projectDetail?.project_completion_status) && !(projectDetail?.project_completion_status == 12 || completeOnboarding)) && <div className="mb-6 p-l bg-gray-200 border-dashed border border-gray-300 rounded-md hover:ring-brand1-500 hover:border-brand1-500 focus:border-brand1-500 focus:ring-brand1-500">
                <div className="w-full h-auto relative flex items-center justify-center cursor-pointer">
                    <input
                        type="file"
                        id="banner"
                        ref={fileInputRef}
                        className="opacity-0 absolute h-full w-full cursor-pointer"
                        onChange={handleFileChange}
                        accept=".jpeg,.jpg,.png"
                        multiple // Allow multiple file selection
                    />
                    <div className="text-center">

                        <div className='flex justify-center flex-col items-center '>
                            <div className='w-fit p-m rounded-full border-4 border-white mb-m'>
                                <svg xmlns="http://www.w3.org/2000/svg" width="17" height="16" viewBox="0 0 17 16" fill="none">
                                    <path d="M7.5 10.7076L5 8.20711L5.7065 7.50061L7.5 9.29361L11.2925 5.50061L12 6.20811L7.5 10.7076Z" fill="#808080" />
                                    <path d="M8.5 1.00061C7.11553 1.00061 5.76216 1.41115 4.61101 2.18032C3.45987 2.94949 2.56266 4.04274 2.03285 5.32183C1.50303 6.60091 1.36441 8.00838 1.63451 9.36624C1.9046 10.7241 2.57129 11.9714 3.55026 12.9504C4.52922 13.9293 5.7765 14.596 7.13437 14.8661C8.49224 15.1362 9.8997 14.9976 11.1788 14.4678C12.4579 13.938 13.5511 13.0407 14.3203 11.8896C15.0895 10.7385 15.5 9.38508 15.5 8.00061C15.5 6.14409 14.7625 4.36362 13.4497 3.05086C12.137 1.73811 10.3565 1.00061 8.5 1.00061ZM8.5 14.0006C7.31332 14.0006 6.15328 13.6487 5.16658 12.9894C4.17989 12.3301 3.41085 11.3931 2.95673 10.2967C2.5026 9.20035 2.38378 7.99395 2.61529 6.83007C2.8468 5.66618 3.41825 4.59708 4.25736 3.75797C5.09648 2.91885 6.16558 2.34741 7.32946 2.1159C8.49335 1.88439 9.69975 2.00321 10.7961 2.45733C11.8925 2.91146 12.8295 3.68049 13.4888 4.66719C14.1481 5.65388 14.5 6.81392 14.5 8.00061C14.5 9.59191 13.8679 11.118 12.7426 12.2433C11.6174 13.3685 10.0913 14.0006 8.5 14.0006Z" fill="#808080" />
                                </svg>
                            </div>
                            <p className="text-tertiary text-f-m font-semibold">Click to upload banner images</p>
                            <p className="text-neutral-1000 text-f-m font-normal">
                                .jpg, .jpeg, .png (max. 8mb, Dimension: 1920px*330px)
                            </p>
                        </div>

                    </div>
                </div>
            </div>}

            {/* Other UI components */}

            <div className="bg-white shadow border border-gray-50 rounded-2xl mt-xl">
                <div className='py-l px-xl border-b flex justify-between'>
                    <div className="text-f-3xl font-light text-black border-gray-300">Gallery</div>
                    <div className="flex">
                        {/* <button className="text-gray-600">View All</button> */}
                    </div>
                </div>
                <div className='p-xl w-full'>
                    <div className="min-w-full bg-white overflow-hidden">
                        {/* <thead className='bg-red-600 w-full'> */}
                        <div className="w-full text-left bg-gray-200 flex">
                            <div className="py-m px-s text-f-m font-semibold flex-[0.3]">Thumbnail</div>
                            <div className="py-m px-s text-f-m font-semibold flex-[1]">Details</div>
                            <div className="py-m px-s text-f-m font-semibold w-[10px] flex-[0.4]">Action</div>
                        </div>
                        {/* </thead> */}
                        <div>
                            {formValue.map((item: any) => (
                                (item.state_id ? item.state_id : item.country_id) === selectedLocations && item.images?.map((image: any, index: any) => (
                                    <div key={index} className="border-t border-gray-200 flex">
                                        <div className="my-m pl-s  flex-[0.3]">
                                            <img src={`${process.env.NEXT_PUBLIC_IMAGE_ENDPOINT}/project-images/${image.path}`} alt={item.title} className="w-16 h-16 rounded-md" />
                                        </div>
                                        <div className="my-m h-auto flex flex-[1] flex-col justify-center" onClick={() => handleImageAdd(image.path)}>
                                            <div className='text-f-m font-normal'>{image.title}</div>
                                            <div className="text-gray-500 text-f-xs">{image.description}</div>
                                        </div>
                                        <div className="my-m flex items-center flex-[0.4] gap-m">
                                            <div className='' onClick={() => handleImageAdd(image.path)}>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                                    <path d="M15 13H1V14H15V13Z" fill="#1A1A1A" />
                                                    <path d="M12.7 4.5C13.1 4.1 13.1 3.5 12.7 3.1L10.9 1.3C10.5 0.9 9.9 0.9 9.5 1.3L2 8.8V12H5.2L12.7 4.5ZM10.2 2L12 3.8L10.5 5.3L8.7 3.5L10.2 2ZM3 11V9.2L8 4.2L9.8 6L4.8 11H3Z" fill="#1A1A1A" />
                                                </svg>
                                            </div>

                                            <button id="download" onClick={() => {
                                                handleDownload(image.path);


                                            }}>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                                    <path d="M13 12.0006V14.0006H3V12.0006H2V14.0006C2 14.2658 2.10536 14.5202 2.29289 14.7077C2.48043 14.8953 2.73478 15.0006 3 15.0006H13C13.2652 15.0006 13.5196 14.8953 13.7071 14.7077C13.8946 14.5202 14 14.2658 14 14.0006V12.0006H13Z" fill="#4D4D4D" />
                                                    <path d="M13 7.00061L12.295 6.29561L8.5 10.0856V1.00061H7.5V10.0856L3.705 6.29561L3 7.00061L8 12.0006L13 7.00061Z" fill="#4D4D4D" />
                                                </svg>
                                            </button>
                                            <button id="delete" onClick={() => {
                                                handleDeleteImage(image.path);
                                                if (fileInputRef.current) {
                                                    fileInputRef.current.value = '';
                                                }
                                            }}>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                                    <path d="M7 6.00061H6V12.0006H7V6.00061Z" fill="#4D4D4D" />
                                                    <path d="M10 6.00061H9V12.0006H10V6.00061Z" fill="#4D4D4D" />
                                                    <path d="M2 3.00061V4.00061H3V14.0006C3 14.2658 3.10536 14.5202 3.29289 14.7077C3.48043 14.8953 3.73478 15.0006 4 15.0006H12C12.2652 15.0006 12.5196 14.8953 12.7071 14.7077C12.8946 14.5202 13 14.2658 13 14.0006V4.00061H14V3.00061H2ZM4 14.0006V4.00061H12V14.0006H4Z" fill="#4D4D4D" />
                                                    <path d="M10 1.00061H6V2.00061H10V1.00061Z" fill="#4D4D4D" />
                                                </svg>
                                            </button>

                                        </div>
                                    </div>
                                ))
                            ))}
                        </div>
                    </div>
                </div>

            </div>
            <div className='my-xl flex justify-end gap-l border-t pt-xl'>
                <button className='px-xl py-l flex items-center' onClick={onclickBackButton}>
                    <div className='-scale-100'>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M10.9998 8.00061L5.9998 13.0006L5.2998 12.3006L9.5998 8.00061L5.2998 3.70061L5.9998 3.00061L10.9998 8.00061Z" fill="#22577a" />
                        </svg>
                    </div>
                    <div className='text-f-m ml-l text-tertiary font-normal'>Back</div>
                </button>
                {[4, 6, 7, 8, 9, 10].includes(projectDetail?.project_completion_status) ? (
                    /*<button
                        type='button'
                        className={`flex h-12 min-w-12 px-6 py-4 justify-end items-center gap-4 rounded-lg bg-brand1-500 text-white cursor-pointer'`}
                        onClick={handleSkip}
                    >
                        {allowedTabs.includes('management') ? 'Skip' : 'Redirect to Detail Page'}
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M10.9998 8L5.9998 13L5.2998 12.3L9.5998 8L5.2998 3.7L5.9998 3L10.9998 8Z"
                                fill="currentColor" />
                        </svg>
                    </button>*/
                    <></>
                ) : (
                    (projectDetail?.project_completion_status == 12 || completeOnboarding) ? <button
                        type="button"
                        className=" flex items-center justify-center h-14 px-6 rounded-lg bg-gray-300 hover:bg-gray-400 transition-colors"
                        onClick={updateStatus}
                    >
                        Complete Onboarding
                        <svg
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
                    </button> : <button className='px-xl py-l bg-brand1-500 text-white rounded-lg flex items-center' onClick={nextHandler}>
                        <div className='text-f-m mr-l font-normal'>Submit</div>
                        <div>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M10.9998 8.00061L5.9998 13.0006L5.2998 12.3006L9.5998 8.00061L5.2998 3.70061L5.9998 3.00061L10.9998 8.00061Z" fill="white" />
                            </svg>
                        </div>
                    </button>

                )}
            </div>
        </div>
    );
};

export default Gallery;

