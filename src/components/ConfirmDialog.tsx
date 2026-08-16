import { useState } from 'react';

interface Props {
  onConfirm: (value: string) => void;
  onCancel: () => void;
  title?: string;
  message?: string;
  placeholder?: string;
  confirmLabel?: string;
}

export default function ConfirmDialog({
  onConfirm,
  onCancel,
  title = 'Are you sure?',
  message,
  placeholder,
  confirmLabel = 'Confirm',
}: Props) {
  const [value, setValue] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">{title}</h3>
        {message && <p className="text-sm text-neutral-600 mb-4">{message}</p>}
        {placeholder && (
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-neutral-900"
            autoFocus
          />
        )}
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(value)}
            className="px-4 py-2 text-sm font-medium text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
