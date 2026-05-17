import React from 'react';
 
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
  label: string;
  error?: string;
  isTextArea?: boolean;
}
 
export const Input: React.FC<InputProps> = ({
  label,
  error,
  isTextArea,
  className = '',
  ...props
}) => {
  const baseStyles = "w-full bg-surface border border-border rounded-lg px-3 py-2 text-mist font-body placeholder:text-slate/50 focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal transition-colors text-sm";
 
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label className="font-label text-xs font-semibold text-slate uppercase tracking-wider">
        {label}
      </label>
      {isTextArea ? (
        <textarea
          className={`${baseStyles} resize-y min-h-[100px]`}
          {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
        />
      ) : (
        <input
          className={baseStyles}
          {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
        />
      )}
      {error && <span className="text-xs font-functional text-danger">{error}</span>}
    </div>
  );
};
 