interface SwitchProps {
  label: string;
  defaultChecked?: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
}

export default function Switch({
  label,
  defaultChecked = false,
  disabled = false,
  onChange,
}: SwitchProps) {
  return (
    <label
      className={`flex items-center gap-3 text-sm font-medium ${
        disabled ? "text-gray-400" : "text-gray-700 dark:text-gray-400"
      }`}
    >
      <button
        type="button"
        role="switch"
        aria-checked={defaultChecked}
        disabled={disabled}
        onClick={() => onChange?.(!defaultChecked)}
        className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 ${
          defaultChecked
            ? "bg-brand-500"
            : "bg-gray-200 dark:bg-white/10"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <span
          className={`pointer-events-none relative inline-flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ease-in-out ${
            defaultChecked ? "translate-x-[1.375rem]" : "translate-x-0.5"
          }`}
        >
          {defaultChecked ? (
            <svg className="h-3.5 w-3.5 text-brand-500" viewBox="0 0 12 12" fill="none">
              <path
                d="M3 6l2 2 4-4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <svg className="h-3.5 w-3.5 text-gray-400" viewBox="0 0 12 12" fill="none">
              <path
                d="M4 4l4 4M8 4l-4 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </span>
      </button>
      {label}
    </label>
  );
}
