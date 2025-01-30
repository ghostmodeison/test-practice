import React from 'react';
import Image from "next/image";

// Enum for possible status types
enum StatusType {
    EMPTY = '',
    SUCCESS = 'success',
    WARNING = 'warning',
    ERROR = 'error'
}

// Enum for status codes
enum ProjectStatusCode {
    AGREEMENT_SENT = 6,
    AGREEMENT_APPROVED = 7,
    CREDIT_TRANSFER = 8,
    OWNERSHIP_CERTIFICATE = 9,
    PRICE_LOCK = 10
}

// Type for border colors
type BorderColorType = 'border-[#e6e6e6]' | 'border-[#57cc99]' | 'border-[#fcc603]' | 'border-red-500';

// Interface for status card props
interface StatusCardProps {
    title: string;
    description: string;
    status: StatusType;
    borderColor: BorderColorType;
}

// Interface for status data
interface StatusData extends StatusCardProps {
    statusCode: ProjectStatusCode;
}

// Interface for dynamic status data
interface DynamicStatusData {
    status: StatusType;
    description: string;
    borderColor: BorderColorType;
}

// Props interface for the main component
interface ProjectStatusProps {
    currentStatusCode: ProjectStatusCode;
}

const StatusCard: React.FC<StatusCardProps> = ({
                                                   title,
                                                   description,
                                                   status,
                                                   borderColor
                                               }) => {
    const getStatusIcon = () => {
        switch (status) {
            case StatusType.SUCCESS:
                return '/project/success.svg';
            case StatusType.WARNING:
                return '/project/Warning.svg';
            case StatusType.ERROR:
                return '/project/error.svg';
            default:
                return '';
        }
    };

    const DocumentIcon: React.FC = () => (
        <svg viewBox="0 0 32 32" className="w-8 h-8" fill="none">
            <path
                d="M20.85 12.6505L17.35 9.15049C17.25 9.05049 17.15 9.00049 17 9.00049H12C11.45 9.00049 11 9.45049 11 10.0005V22.0005C11 22.5505 11.45 23.0005 12 23.0005H20C20.55 23.0005 21 22.5505 21 22.0005V13.0005C21 12.8505 20.95 12.7505 20.85 12.6505ZM17 10.2005L19.8 13.0005H17V10.2005ZM20 22.0005H12V10.0005H16V13.0005C16 13.5505 16.45 14.0005 17 14.0005H20V22.0005Z"
                fill="#808080"/>
            <path d="M19 19.0005H13V20.0005H19V19.0005Z" fill="#808080"/>
            <path d="M19 16.0005H13V17.0005H19V16.0005Z" fill="#808080"/>
        </svg>
    );

    return (
        <div
            className={`flex justify-center items-center self-stretch relative gap-2 p-3 rounded-lg border ${borderColor}`}>
            <DocumentIcon/>
            <div className="flex flex-col justify-center items-start flex-grow gap-2">
                <div className="flex justify-start items-center self-stretch gap-0.5">
                    <div className="flex flex-col justify-start items-start flex-grow relative gap-1">
                        <div className="flex justify-start items-center self-stretch h-5 relative gap-2 py-px">
                            <p className="text-sm text-left text-neutral-1400">{title}</p>
                        </div>
                        <p className="self-stretch text-xs text-left text-neutral-1200">{description}</p>
                    </div>
                </div>
            </div>
            {(getStatusIcon() != "") && (
            <div className="flex justify-center items-center w-8 h-8 p-2 rounded-full border-2 border-neutral-100 bg-neutral-100">
                <Image
                    src={getStatusIcon()}
                    className="object-contain"
                    alt="Document Status"
                    width={32}
                    height={32}
                />
            </div>
            )}
        </div>
    );
};

const getStatusData = (currentStatusCode: ProjectStatusCode, cardStatusCode: ProjectStatusCode): DynamicStatusData => {
    const defaultStatus: DynamicStatusData = {
        status: StatusType.EMPTY,
        description: 'Not initiated',
        borderColor: 'border-[#e6e6e6]'
    };

    const successStatus: DynamicStatusData = {
        status: StatusType.SUCCESS,
        description: cardStatusCode === ProjectStatusCode.AGREEMENT_SENT ? 'Initiated' : 'Successfully Done',
        borderColor: 'border-[#57cc99]'
    };

    const warningStatus: DynamicStatusData = {
        status: StatusType.WARNING,
        description: 'In Progress',
        borderColor: 'border-[#fcc603]'
    };

    if (currentStatusCode === ProjectStatusCode.PRICE_LOCK) {
        // For Price Lock itself
        /*if (cardStatusCode === ProjectStatusCode.PRICE_LOCK) {
            return warningStatus;
        }*/
        // For all previous steps
        return successStatus;
    }

    // For statuses less than current status code
    if (cardStatusCode <= currentStatusCode) {
        return successStatus;
    }

    // For Credit Transfer and Price Lock
    return defaultStatus;
};

const ProjectStatus: React.FC<ProjectStatusProps> = ({ currentStatusCode }) => {
    const statusConfigs: Array<Omit<StatusData, keyof DynamicStatusData>> = [
        {
            title: "Agreement sent",
            statusCode: ProjectStatusCode.AGREEMENT_SENT,
        },
        {
            title: "Agreement approved",
            statusCode: ProjectStatusCode.AGREEMENT_APPROVED,
        },
        {
            title: "Credit transfer",
            statusCode: ProjectStatusCode.CREDIT_TRANSFER,
        },
        {
            title: "Ownership Certificate Upload",
            statusCode: ProjectStatusCode.OWNERSHIP_CERTIFICATE,
        },
        {
            title: "Price Lock",
            statusCode: ProjectStatusCode.PRICE_LOCK,
        }
    ];

    const statuses: StatusData[] = statusConfigs.map(config => ({
        ...config,
        ...getStatusData(currentStatusCode, config.statusCode)
    }));

    return (
        <div className="text-black relative max-w-screen-lg mx-auto">
            <div className="flex justify-start items-start self-stretch gap-8">
                <div className="flex flex-col justify-start items-start flex-grow gap-6 pt-3 pb-6">
                    <div className="flex flex-col justify-center items-start self-stretch relative gap-1">
                        <p className="text-[32px] font-light text-center text-neutral-1400">Status</p>
                        <p className="self-stretch text-base text-left text-neutral-1200">
                            Status of your project agreement
                        </p>
                    </div>
                    <div className="flex flex-col justify-start items-start self-stretch gap-8">
                        {statuses.map((status, index) => (
                            <StatusCard key={index} {...status} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectStatus;