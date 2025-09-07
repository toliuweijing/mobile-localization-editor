import React, { useState, useEffect } from 'react';
import { LanguageMappingRequest, LanguageMappingResolution } from '../types';
import XIcon from './icons/XIcon';

interface LanguageMappingModalProps {
  request: LanguageMappingRequest;
  onClose: () => void;
  onConfirm: (resolutions: LanguageMappingResolution) => void;
}

const LanguageMappingModal: React.FC<LanguageMappingModalProps> = ({ request, onClose, onConfirm }) => {
  const [resolutions, setResolutions] = useState<LanguageMappingResolution>({});
  const [isConfirmDisabled, setIsConfirmDisabled] = useState(true);

  useEffect(() => {
    // Initialize resolutions state
    const initialResolutions: LanguageMappingResolution = {};
    request.unrecognizedColumns.forEach(col => {
      initialResolutions[col] = { action: 'map', langCode: '' }; // Default to map, with empty code
    });
    setResolutions(initialResolutions);
  }, [request.unrecognizedColumns]);

  useEffect(() => {
    // Validate to enable/disable confirm button
    const allResolved = request.unrecognizedColumns.every(col => {
      const res = resolutions[col];
      return res && (res.action === 'ignore' || (res.action === 'map' && res.langCode.trim() !== ''));
    });
    setIsConfirmDisabled(!allResolved);
  }, [resolutions, request.unrecognizedColumns]);

  const handleResolutionChange = (column: string, action: 'map' | 'ignore', langCode: string = '') => {
    setResolutions(prev => {
        const newResolutions = { ...prev };
        if (action === 'map') {
            newResolutions[column] = { action: 'map', langCode };
        } else {
            newResolutions[column] = { action: 'ignore' };
        }
        return newResolutions;
    });
  };

  const handleConfirm = () => {
    onConfirm(resolutions);
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lang-map-title"
    >
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 id="lang-map-title" className="text-xl font-bold text-slate-800 dark:text-slate-100">
            Confirm New Languages
          </h2>
          <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700" aria-label="Close modal">
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {request.newLanguages.length > 0 && (
            <section>
              <h3 className="text-lg font-semibold mb-3 text-slate-800 dark:text-slate-200">New Languages Detected</h3>
              <p className="text-slate-600 dark:text-slate-300 mb-3">
                The following language columns were found and will be added to your project:
              </p>
              <div className="flex flex-wrap gap-2">
                {request.newLanguages.map(lang => (
                  <span key={lang} className="px-3 py-1 text-sm font-semibold text-green-800 bg-green-100 rounded-full dark:bg-green-900/50 dark:text-green-300">
                    {lang}
                  </span>
                ))}
              </div>
            </section>
          )}

          {request.unrecognizedColumns.length > 0 && (
            <section>
              <h3 className="text-lg font-semibold mb-3 text-slate-800 dark:text-slate-200">Unrecognized Columns</h3>
              <p className="text-slate-600 dark:text-slate-300 mb-4">
                Please map the following columns to a language code (e.g., "fr", "es") or choose to ignore them.
              </p>
              <div className="space-y-4">
                {request.unrecognizedColumns.map(column => {
                  const resolution = resolutions[column];
                  const isMap = resolution?.action === 'map';

                  return (
                    <div key={column} className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg">
                      <p className="font-semibold text-slate-700 dark:text-slate-200 mb-3">
                        Column: <span className="font-mono bg-slate-200 dark:bg-slate-900/70 px-2 py-1 rounded">{column}</span>
                      </p>
                      <div className="flex items-center gap-4 text-sm">
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`action-${column}`}
                            value="map"
                            checked={isMap}
                            onChange={() => handleResolutionChange(column, 'map', isMap ? resolution.langCode : '')}
                          />
                          Map to Language Code
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`action-${column}`}
                            value="ignore"
                            checked={!isMap}
                            onChange={() => handleResolutionChange(column, 'ignore')}
                          />
                          Ignore this column
                        </label>
                      </div>
                      {isMap && (
                        <div className="mt-3">
                          <input
                            type="text"
                            value={resolution.langCode}
                            onChange={(e) => handleResolutionChange(column, 'map', e.target.value)}
                            placeholder="e.g., fr, es, de-DE"
                            className="block w-full sm:w-1/2 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-4">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md shadow-sm hover:bg-slate-50 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-600">
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isConfirmDisabled}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-slate-400 dark:disabled:bg-slate-500 disabled:cursor-not-allowed"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default LanguageMappingModal;
