import MultiSelector from "@/components/common/MultiSelector";
import SingleSelector from "@/components/common/SingleSelector";
import React from "react";
import { LabelHandler } from "@/components/common/LabelHandler";

export const InputFieldRow = ({ fields, formValues, errors, onChange, sectorList, typeList, methodologyList, countryList, optionalcheck }: any) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2xl my-xl">
            {fields.map((field: any) => (

                <SingleField
                    allfieldsValue={formValues}
                    key={field.id}
                    id={field.id}
                    placeholder={field.placeholder}
                    title={field.title}
                    instruction={field.instruction}
                    type={field.type}
                    value={formValues[field.id] || ""}
                    error={errors[field.id]}
                    onChange={onChange}
                    sectorList={sectorList}
                    typeList={typeList}
                    methodologyList={methodologyList}
                    countryList={countryList}
                    optionalcheck={optionalcheck}
                />
            ))}
        </div>
    );
};

const SingleField = ({ allfieldsValue, id, placeholder, title, instruction = "", type, value, error, onChange, sectorList, typeList, methodologyList, countryList, optionalcheck }: any) => {
    let data: string[] = [];
    // let hide: boolean = false;
    if (id === "sector") {
        data = sectorList;
    } else if (id === "project_types") {
        // hide = allfieldsValue['sector'] == undefined
        // console.log("------------------------------------", id, allfieldsValue, hide)
        data = typeList;
    } else if (id === "methodologies") {
        // hide = (allfieldsValue['project_types'] || allfieldsValue.project_types?.length == 0);
        data = methodologyList;
    } else if (id === "country_id") {
        data = countryList;
    }
    //
    // console.log("jjjjj--------------------kkkk", hide)
    return (
        <div >
            <LabelHandler title={title} instruction={instruction} optionalcheck={(id == "blockchain_id" || id == "blockchain_url" || (optionalcheck && (id == "estimation_annual_estimated_reductions" || id == "actual_annual_estimated_reductions"))) ? true : false} />
            {
                type === "input" && (
                    <input
                        type="text"
                        id={id}
                        value={value}
                        placeholder={placeholder}
                        className={`my-s py-s px-l text-f-m border block w-full rounded-md border-gray-300 shadow-sm sm:text-sm  focus:outline-none ${!error && ' hover:ring-brand1-500 hover:border-brand1-500 focus:border-brand1-500 focus:ring-brand1-500'} ${error ? 'border-red-500' : 'border-neutral-300'}`}
                        onChange={(e) => onChange(id, e.target.value)}
                    />
                )
            }
            {
                type === "multi" && (
                    <MultiSelector
                        data={data}
                        placeholder={placeholder}
                        selectedValues={value}
                        onChange={(selected: any) => onChange(id, selected)}
                        error={error}
                        allfieldsValue={allfieldsValue}
                    />
                )
            }
            {
                type === "drop" && (
                    <SingleSelector
                        data={data}
                        placeholder={placeholder}
                        selectedValue={value}
                        onChange={(selected: any) => onChange(id, selected)}
                        error={error}
                        allfieldsValue={allfieldsValue}
                    />
                )
            }
            {error && <p className="text-negativeBold text-sm mt-1">{error}</p>}
        </div >
    );
};


