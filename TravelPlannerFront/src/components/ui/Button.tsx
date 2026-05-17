import React from 'react';
import { Loader2 } from 'lucide-react';
 
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  isLoading?: boolean;
}
 
export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  isLoading,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = "inline-flex items-center justify-center gap-2 px-4 py-2 font-label text-sm font-medium tracking-wide transition-all rounded-lg border focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-navy";
 
  const variants = {
    primary: "bg-teal text-navy border-teal/20 hover:bg-teal-light focus:ring-teal shadow-[0_0_12px_rgba(14,165,176,0.25)]",
    secondary: "bg-surface-2 text-mist border-border hover:bg-border focus:ring-teal",
    danger: "bg-danger/10 text-danger border-danger/30 hover:bg-danger hover:text-white focus:ring-danger",
  };
 
  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${disabled || isLoading ? 'opacity-40 cursor-not-allowed' : ''} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
};