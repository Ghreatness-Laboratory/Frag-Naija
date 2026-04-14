'use client';

interface FieldProps {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}

export function Field({ label, required, children }: FieldProps) {
  return (
    <div>
      <label className="block text-fn-muted text-xs uppercase tracking-widest mb-1.5">
        {label}{required && <span className="text-fn-red ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = 'w-full bg-fn-dark border border-fn-gborder rounded px-3 py-2 text-fn-text text-sm focus:outline-none focus:border-fn-green transition-colors placeholder:text-fn-muted/50';

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={inputCls} />;
}

export function Select({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={inputCls}>
      {children}
    </select>
  );
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} rows={3} className={inputCls + ' resize-none'} />;
}

export function SubmitBtn({ loading, label = 'Save' }: { loading?: boolean; label?: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full bg-fn-green text-fn-black font-bold py-2.5 rounded text-sm uppercase tracking-widest hover:bg-fn-gdim transition-colors disabled:opacity-50 mt-2"
    >
      {loading ? 'Saving...' : label}
    </button>
  );
}
