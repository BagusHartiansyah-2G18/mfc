import * as React from "react";
import { cn } from "../../utils/cn";
import { Button } from "./button";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

export interface InputWithBtnPopUpProps
  extends Omit<React.ComponentProps<"input">, "size"> {
  buttonLabel?: string;
  buttonIcon?: React.ReactNode;
  buttonVariant?: "default" | "outline" | "secondary" | "ghost";
  buttonPosition?: "right" | "left";
  onButtonClick?: () => void;
  popupContent?: React.ReactNode;
  popupTitle?: string;
  error?: string;
  size?: "sm" | "default" | "lg";
  containerClassName?: string;
}

export const InputWithBtnPopUp = React.forwardRef<
  HTMLInputElement,
  InputWithBtnPopUpProps
>(
  (
    {
      className,
      containerClassName,
      buttonLabel,
      buttonIcon,
      buttonVariant = "ghost",
      buttonPosition = "right",
      onButtonClick,
      popupContent,
      popupTitle,
      error,
      size = "default",
      value,
      onChange,
      type = "text",
      ...props
    },
    ref
  ) => {
    const isRight = buttonPosition === "right";

    const sizeClasses = {
      sm: "h-8 text-xs",
      default: "h-9 text-xs",
      lg: "h-10 text-sm",
    };

    const btnSizeClasses = {
      sm: "h-7 px-2 text-[11px]",
      default: "h-8 px-2.5 text-xs",
      lg: "h-9 px-3 text-xs",
    };

    const actionButton = (
      <Button
        type="button"
        variant={buttonVariant}
        onClick={popupContent ? undefined : onButtonClick}
        className={cn(
          "shrink-0 font-medium cursor-pointer",
          btnSizeClasses[size],
          buttonVariant === "ghost" && "hover:bg-muted text-muted-foreground hover:text-foreground"
        )}
      >
        {buttonIcon && <span className={cn(buttonLabel && "mr-1.5")}>{buttonIcon}</span>}
        {buttonLabel}
      </Button>
    );

    return (
      <div
        className={cn(
          "flex w-full items-center rounded-md border border-input bg-background p-0.5 shadow-xs transition-colors focus-within:border-primary focus-within:ring-1 focus-within:ring-ring",
          error && "border-destructive focus-within:ring-destructive",
          containerClassName
        )}
      >
        {!isRight && (
          <div className="pl-1">
            {popupContent ? (
              <Popover>
                <PopoverTrigger asChild>{actionButton}</PopoverTrigger>
                <PopoverContent className="w-80 p-3 text-xs" align="start">
                  {popupTitle && <div className="font-semibold text-foreground mb-2 pb-1 border-b">{popupTitle}</div>}
                  {popupContent}
                </PopoverContent>
              </Popover>
            ) : (
              actionButton
            )}
          </div>
        )}

        <input
          ref={ref}
          type={type}
          value={value}
          onChange={onChange}
          className={cn(
            "flex w-full bg-transparent px-2.5 font-sans text-foreground placeholder:text-muted-foreground/70 focus:outline-hidden disabled:cursor-not-allowed disabled:opacity-50",
            sizeClasses[size],
            className
          )}
          {...props}
        />

        {isRight && (
          <div className="pr-1">
            {popupContent ? (
              <Popover>
                <PopoverTrigger asChild>{actionButton}</PopoverTrigger>
                <PopoverContent className="w-80 p-3 text-xs" align="end">
                  {popupTitle && <div className="font-semibold text-foreground mb-2 pb-1 border-b">{popupTitle}</div>}
                  {popupContent}
                </PopoverContent>
              </Popover>
            ) : (
              actionButton
            )}
          </div>
        )}
      </div>
    );
  }
);

InputWithBtnPopUp.displayName = "InputWithBtnPopUp";
