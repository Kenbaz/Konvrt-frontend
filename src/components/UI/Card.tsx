import { forwardRef, type HTMLAttributes } from 'react';
import { clsx } from 'clsx';


export type CardVariant = 'default' | 'elevated' | 'outlined';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface CardProps extends HTMLAttributes<HTMLDivElement> { 
    variant?: CardVariant;
    padding?: CardPadding;
    hoverable?: boolean;
    clickable?: boolean;
};

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
    title?: string;
    subtitle?: string;
    action?: React.ReactNode;
};

export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> { 
    align?: 'left' | 'center' | 'right' | 'between';
};


const baseStyles = "rounded-lg";

const variantStyles: Record<CardVariant, string> = {
  default: "bg-white border border-gray-200",
  outlined: "bg-transparent border-2 border-gray-300",
  elevated: "bg-white shadow-lg",
};

const paddingStyles: Record<CardPadding, string> = {
  none: "",
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
};

const hoverStyles = "transition-shadow duration-200 hover:shadow-md";

const clickableStyles = clsx(
  "cursor-pointer",
  "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
  "transition-all duration-200"
);

const footerAlignStyles: Record<string, string> = {
  left: "justify-start",
  center: "justify-center",
  right: "justify-end",
  between: "justify-between",
};


export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = "default",
      padding = "md",
      hoverable = false,
      clickable = false,
      className,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={clsx(
          baseStyles,
          variantStyles[variant],
          paddingStyles[padding],
          hoverable && hoverStyles,
          clickable && clickableStyles,
          className
        )}
        tabIndex={clickable ? 0 : undefined}
        role={clickable ? "button" : undefined}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";


export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ title, subtitle, action, className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(
          "flex items-start justify-between gap-4",
          "pb-4 border-b border-gray-100",
          "mb-4",
          className
        )}
        {...props}
      >
        <div className="flex-1 min-w-0">
          {title && (
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {title}
            </h3>
          )}
          {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
          {children}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    );
  }
);

CardHeader.displayName = "CardHeader";


export const CardContent = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  return (
    <div ref={ref} className={clsx("text-gray-700", className)} {...props}>
      {children}
    </div>
  );
});

CardContent.displayName = "CardContent";


export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ align = "right", className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(
          "flex items-center gap-3",
          "pt-4 border-t border-gray-100",
          "mt-4",
          footerAlignStyles[align],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardFooter.displayName = "CardFooter";