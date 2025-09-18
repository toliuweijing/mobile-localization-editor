import React, { useState } from 'react';
import { SheetSelectionRequest } from '../types';
import XIcon from './icons/XIcon';

interface SheetSelectionModalProps {
  request: SheetSelectionRequest;
  onClose: () => void;
  onConfirm: (sheetName: string) => void;
}

const SheetSelectionModal: React.FC<SheetSelectionModalProps> = ({ request, onClose, onConfirm }) => {
  const [selectedSheet, setSelectedSheet] = useState<string>(request.sheetNames[0]);

  const handleConfirm = () => {
    onConfirm(selectedSheet);
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sheet-select-title"
    >
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 id="sheet-select-title" className="text-xl font-bold text-slate-800 dark:text-slate-100">
            Select a Sheet to Import
          </h2>
          <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700" aria-label="Close modal">
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          <p className="text-slate-600 dark:text-slate-300">
            Your workbook contains multiple sheets with localization data. Please choose which one to use.
          </p>
          <fieldset className="space-y-3">
            <legend className="sr-only">Available Sheets</legend>
            {request.sheetNames.map(name => (
              <label key={name} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50 dark:has-[:checked]:bg-slate-700/50">
                <input
                  type="radio"
                  name="sheet-selection"
                  value={name}
                  checked={selectedSheet === name}
                  onChange={() => setSelectedSheet(name)}
                  className="h-4 w-4 border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="font-medium text-slate-800 dark:text-slate-200">{name}</span>
              </label>
            ))}
          </fieldset>
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-4">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md shadow-sm hover:bg-slate-50 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-600">
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default SheetSelectionModal;
