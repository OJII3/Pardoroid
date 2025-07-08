import type { LucideIcon } from "lucide-react";
import type React from "react";
import { Input } from "./input";

interface FormInputProps extends React.ComponentProps<"input"> {
	label: string;
	icon?: LucideIcon;
	error?: string;
	description?: string;
	containerClassName?: string;
}

export const FormInput: React.FC<FormInputProps> = ({
	label,
	icon: Icon,
	error,
	description,
	containerClassName,
	className,
	...props
}) => {
	const inputId = `input-${Math.random().toString(36).substr(2, 9)}`;

	return (
		<div className={containerClassName}>
			<label className="block text-sm font-medium mb-2" htmlFor={inputId}>
				{label}
				{props.required && <span className="text-red-500 ml-1">*</span>}
			</label>
			<div className="relative">
				{Icon && (
					<Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
				)}
				<Input
					className={`${Icon ? "pl-10" : ""} ${error ? "border-red-500 focus-visible:border-red-500" : ""} ${className}`}
					id={inputId}
					{...props}
				/>
			</div>
			{description && !error && (
				<p className="text-sm text-muted-foreground mt-1">{description}</p>
			)}
			{error && <p className="text-sm text-red-500 mt-1">{error}</p>}
		</div>
	);
};
