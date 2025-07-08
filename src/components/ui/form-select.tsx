import type { LucideIcon } from "lucide-react";
import type React from "react";
import { Button } from "./button";

interface FormSelectOption {
	value: string;
	label: string;
	icon?: LucideIcon;
}

interface FormSelectProps {
	label: string;
	options: FormSelectOption[];
	value: string;
	onChange: (value: string) => void;
	error?: string;
	description?: string;
	containerClassName?: string;
	size?: "sm" | "default";
}

export const FormSelect: React.FC<FormSelectProps> = ({
	label,
	options,
	value,
	onChange,
	error,
	description,
	containerClassName,
	size = "default",
}) => {
	return (
		<div className={containerClassName}>
			<div className="block text-sm font-medium mb-2">{label}</div>
			<div className="flex gap-2">
				{options.map((option) => {
					const Icon = option.icon;
					return (
						<Button
							key={option.value}
							onClick={() => onChange(option.value)}
							size={size}
							type="button"
							variant={value === option.value ? "default" : "outline"}
						>
							{Icon && <Icon className="h-4 w-4 mr-2" />}
							{option.label}
						</Button>
					);
				})}
			</div>
			{description && !error && (
				<p className="text-sm text-muted-foreground mt-1">{description}</p>
			)}
			{error && <p className="text-sm text-red-500 mt-1">{error}</p>}
		</div>
	);
};
