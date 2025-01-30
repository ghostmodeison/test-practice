import * as yup from "yup";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import axiosApi from "@/utils/axios-api";
import { API_ENDPOINTS } from "@/config/api-endpoint";
import Input from "@/components/ui/input";
import React, { useEffect, useState } from "react";
import { Address, CityList, CountryList, StateList } from '@/types';
import SelectField from "@/components/ui/selectField";
import {
	getCountryDropdown, handleCountryChange, handleStateChange
} from "@/data/address";
import { customToast } from "@/components/ui/customToast";
import { encryptString } from "@/utils/enc-utils";
import { Close } from "@carbon/icons-react";

const formSchema = yup.object().shape({
	address1: yup.string().required('Address is required'),
	address2: yup.string().required('Address is required'),
	country_id: yup.string().required('Country is required'),
	state_id: yup.string().required('State is required'),
	city_id: yup.string().required('City is required'),
	pincode: yup.string()
		.required('Pincode is required')
		.matches(/^\d{1,15}$/, 'Max 15 digits allowed.')
});

const AddressModal = ({ onClose, initialData }: {
	onClose: () => void; initialData?: Address;
}) => {

	const [countryList, setCountryList] = useState<CountryList[]>([]);
	const [stateList, setStateList] = useState<StateList[]>([]);
	const [cityList, setCityList] = useState<CityList[]>([]);

	const { register, handleSubmit, formState: { errors }, setValue, reset } = useForm({
		resolver: yupResolver(formSchema), defaultValues: initialData || {
			address1: '', address2: '', country_id: '', state_id: '', city_id: '', pincode: ''
		}
	});


	useEffect(() => {
		const fetchData = async () => {
			try {
				const countryList = await getCountryDropdown();
				setCountryList(countryList);
				await new Promise(resolve => setTimeout(resolve, 100));

				await handleCountryChange(initialData?.country_id, setStateList);
				await new Promise(resolve => setTimeout(resolve, 100));

				await handleStateChange(initialData?.state_id, setCityList);
				await new Promise(resolve => setTimeout(resolve, 100));

				setValue('country_id', initialData?.country_id ?? '', { shouldValidate: true });
				setValue('state_id', initialData?.state_id ?? '', { shouldValidate: true });
				setValue('city_id', initialData?.city_id ?? '', { shouldValidate: true });
			} catch (error) {
				console.error('Error fetching project details:', error);
			}
		};

		fetchData();
	}, []);


	const onSubmit = async (data: any) => {
		try {
			//await axiosApi.auth.patch(API_ENDPOINTS.Address, data);
			if (initialData) {
				const keysToRemove = ['city', 'country', 'state', '_id'];
				const cleanData = Object.fromEntries(Object.entries(data).filter(([key]) => !keysToRemove.includes(key)));
				const requestBody = cleanData;
				let encryptedPayload = {};
				if (Object.keys(requestBody).length && process.env.EMAIL_CHECK && process.env.EMAIL_CHECK.length > 0) {
					encryptedPayload = encryptString(JSON.stringify(requestBody), process.env.EMAIL_CHECK);
				}
				await axiosApi.auth.patch(`${API_ENDPOINTS.Address}/${initialData._id}`, { data: encryptedPayload });
				customToast.success("Updated Successfully");
			}
			onClose();
		} catch (error) {
			console.error('Error saving address details:', error);
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 sc-md:p-0">
			<div className="relative w-full max-w-2xl  bg-white rounded-lg shadow-lg">
				<div className='flex justify-between p-xl rounded-t-lg border-b  items-center'>
					<div className='text-black text-f-xl font-normal'>
						{initialData ? 'Edit Billing Address' : 'Add Address'}
					</div>
					<button
						className=" text-gray-500 hover:text-gray-700"
						onClick={onClose}
					>
						<Close className="w-6 h-6" />
					</button>
				</div>
				<div className="px-xl flex-1 overflow-y-auto mt-4" style={{ maxHeight: 'calc(100vh - 180px)' }}>
					<form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-4 space-y-4">
						<Input
							registration={register('address1')}
							label="Address Line 1"
							placeholder="Enter address"
							className='flex flex-col gap-2 w-full'
							inputClassName='w-full text-sm text-[#363636] outline-none placeholder-[#bbb] h-[42px]'
							error={errors.address1?.message}
							required
						/> <Input
							registration={register('address2')}
							label="Address Line 2"
							placeholder="Enter address"
							className='flex flex-col gap-2 w-full'
							inputClassName='w-full text-sm text-[#363636] outline-none placeholder-[#bbb] h-[42px]'
							error={errors.address2?.message}
							required
						/> <SelectField className="flex flex-col gap-2 w-full"
							registration={register('country_id')}
							label="Country" placeholder="Add Country"
							options={countryList}
							dimension="small"
							variant="normal"
							onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
								handleCountryChange(e.target.value, setStateList);
							}} required
						/> <SelectField className="flex flex-col gap-2 w-full"
							label="State"
							placeholder="Add State"
							registration={register('state_id')}
							options={stateList}
							dimension="small"
							variant="normal"
							onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
								handleStateChange(e.target.value, setCityList);
							}}
							required
						/> <SelectField className="flex flex-col gap-2 w-full"
							label="City"
							placeholder="Add City"
							registration={register('city_id')}
							options={cityList}
							dimension="small"
							variant="normal"
							required
						/> <Input
							registration={register('pincode')}
							label="Pincode"
							placeholder="Enter pincode"
							className='flex flex-col gap-2 w-full'
							inputClassName='w-full text-sm text-[#363636] outline-none placeholder-[#bbb] h-[42px]'
							error={errors.pincode?.message}
							required
						/>
						<div className="w-full flex justify-end gap-2 px-6 py-4 border-t border-neutral-200">
							<button
								type="button"
								onClick={onClose}
								className="h-9 px-3 py-2 rounded-lg bg-neutral-1000 text-sm text-white"
							>
								Cancel
							</button>
							<button
								type="submit"
								className="h-9 px-3 py-2 rounded-lg bg-primary text-sm text-white"
							>
								{initialData ? 'Update' : 'Submit'}
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
};

export default AddressModal;