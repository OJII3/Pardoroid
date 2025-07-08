import type { LucideIcon } from "lucide-react";
import type React from "react";
import { Button } from "./button";

interface FormButtonProps extends React.ComponentProps<typeof Button> {
	icon?: LucideIcon;
	iconPosition?: "left" | "right";
	loading?: boolean;
	loadingText?: string;
	loadingIcon?: LucideIcon;
}

export const FormButton: React.FC<FormButtonProps> = ({
	icon: Icon,
	iconPosition = "left",
	loading = false,
	loadingText,
	loadingIcon: LoadingIcon,
	children,
	disabled,
	...props
}) => {
	const isDisabled = disabled || loading;
	const displayText = loading && loadingText ? loadingText : children;
	const DisplayIcon = loading && LoadingIcon ? LoadingIcon : Icon;

	return (
		<Button disabled={isDisabled} {...props}>
			{DisplayIcon && iconPosition === "left" && (
				<DisplayIcon
					className={`h-4 w-4 ${displayText ? "mr-2" : ""} ${loading ? "animate-spin" : ""}`}
				/>
			)}
			{displayText}
			{DisplayIcon && iconPosition === "right" && (
				<DisplayIcon
					className={`h-4 w-4 ${displayText ? "ml-2" : ""} ${loading ? "animate-spin" : ""}`}
				/>
			)}
		</Button>
	);
};
