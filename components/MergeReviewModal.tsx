import React, { useState, useEffect } from 'react';
import { MergeComparison, MergeResolutions } from '../types';
import PlusIcon from './icons/PlusIcon';
import TrashIcon from './icons/TrashIcon';
import RefreshIcon from './icons/RefreshIcon';
import { diffStrings } from '../diff';
import DiffView from './DiffView';

interface MergeReviewModalProps {
  comparison: MergeComparison;
  onClose: () => void;
  onApply: (resolutions: MergeResolutions) => void;
}

const MergeReviewModal: React.FC<MergeReviewModalProps> = ({ comparison, onClose, onApply }) => {
  const [updateResolutions, setUpdateResolutions] = useState<{ [id: string]: 'update' | 'keep' }>({});
  const [removalResolutions, setRemovalResolutions] = useState<{ [id: string]: 'delete' | 'keep' }>({});

  useEffect(() => {
    // Set default resolutions
    const defaultUpdates = comparison.updated.reduce((acc, item) => ({ ...acc, [item.id]: 'update' }), {});
    const defaultRemovals = comparison.removed.reduce((acc, item) => ({ ...acc, [item.id]: 'keep' }), {});
    setUpdateResolutions(defaultUpdates);
    setRemovalResolutions(defaultRemovals);
  }, [comparison]);

  const handleApply = () => {
    onApply({
      updates: updateResolutions,
      removals: removalResolutions,
    });
  };

  const hasChanges = comparison.added.length > 0 || comparison.updated.length > 0 || comparison.removed.length > 0;

  return (
    <div 
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="merge-review-title"
    >
      <div 
        className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col"
      >
        <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 id="merge-review-title" className="text-xl font-bold text-slate-800 dark:text-slate-100">
            Review Changes
          </h2>
          <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700" aria-label="Close modal">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          <div className="bg-slate-100 dark:bg-slate-900/50 p-4 rounded-lg mb-6 sticky top-0 z-10">
            <h3 className="text-lg font-semibold mb-2 text-slate-800 dark:text-slate-200">Summary of Changes</h3>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2"><PlusIcon className="w-5 h-5 text-green-500" /> <strong>{comparison.added.length}</strong> New Strings</div>
                <div className="flex items-center gap-2"><RefreshIcon className="w-5 h-5 text-blue-500" /> <strong>{comparison.updated.length}</strong> Updated Strings</div>
                <div className="flex items-center gap-2"><TrashIcon className="w-5 h-5 text-red-500" /> <strong>{comparison.removed.length}</strong> Removed Strings</div>
            </div>
          </div>

          {!hasChanges && <p className="text-center text-slate-500 dark:text-slate-400">No changes were detected in the uploaded file.</p>}

          {comparison.updated.length > 0 && (
            <section className="mb-6">
              <h3 className="text-lg font-semibold mb-3 text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-2">Updated Strings</h3>
              <div className="space-y-4">
                {comparison.updated.map(item => (
                  <div key={item.id} className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg">
                    <p className="font-mono text-sm text-blue-600 dark:text-blue-400 mb-2">{item.id}</p>
                    
                    {item.valueChanges.map((change, index) => {
                      const valueDiff = diffStrings(change.oldValue, change.newValue);
                      return (
                        <div key={change.langCode} className={index > 0 || item.contextChange ? 'mt-4 pt-4 border-t border-slate-200 dark:border-slate-600' : ''}>
                          <p className="font-bold text-slate-500 dark:text-slate-400 mb-2 text-xs uppercase">{change.langCode} Value</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="font-bold text-slate-500 dark:text-slate-400 mb-1">Old</p>
                              <p className="p-2 bg-slate-100 dark:bg-slate-900/50 rounded text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                                  <DiffView parts={valueDiff.oldParts} />
                              </p>
                            </div>
                            <div>
                              <p className="font-bold text-slate-500 dark:text-slate-400 mb-1">New</p>
                              <p className="p-2 bg-slate-100 dark:bg-slate-900/50 rounded text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                                  <DiffView parts={valueDiff.newParts} />
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {item.contextChange && (
                      <div className={item.valueChanges.length > 0 ? 'mt-4 pt-4 border-t border-slate-200 dark:border-slate-600' : ''}>
                        <p className="font-bold text-slate-500 dark:text-slate-400 mb-2 text-xs uppercase">Context</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="font-bold text-slate-500 dark:text-slate-400 mb-1">Old</p>
                                <p className="p-2 bg-slate-100 dark:bg-slate-900/50 rounded text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                                <DiffView parts={diffStrings(item.contextChange.oldContext, item.contextChange.newContext).oldParts} />
                                </p>
                            </div>
                            <div>
                                <p className="font-bold text-slate-500 dark:text-slate-400 mb-1">New</p>
                                <p className="p-2 bg-slate-100 dark:bg-slate-900/50 rounded text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                                <DiffView parts={diffStrings(item.contextChange.oldContext, item.contextChange.newContext).newParts} />
                                </p>
                            </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="mt-3 flex items-center gap-4 text-sm">
                        <label className="flex items-center gap-2"><input type="radio" name={`update-${item.id}`} value="update" checked={updateResolutions[item.id] === 'update'} onChange={() => setUpdateResolutions(prev => ({...prev, [item.id]: 'update'}))} /> Apply Changes</label>
                        <label className="flex items-center gap-2"><input type="radio" name={`update-${item.id}`} value="keep" checked={updateResolutions[item.id] === 'keep'} onChange={() => setUpdateResolutions(prev => ({...prev, [item.id]: 'keep'}))} /> Keep Original</label>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {comparison.added.length > 0 && (
            <section className="mb-6">
                <h3 className="text-lg font-semibold mb-3 text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-2">New Strings</h3>
                <div className="space-y-3">
                    {comparison.added.map(item => (
                        <div key={item.id} className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                            <p className="font-mono text-sm text-green-800 dark:text-green-300 mb-1">{item.id}</p>
                            <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{item.values.default || Object.values(item.values)[0] || ''}</p>
                        </div>
                    ))}
                </div>
            </section>
          )}

          {comparison.removed.length > 0 && (
            <section>
              <h3 className="text-lg font-semibold mb-3 text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-2">Removed Strings</h3>
              <div className="space-y-4">
                {comparison.removed.map(item => (
                    <div key={item.id} className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="font-mono text-sm text-red-800 dark:text-red-300 mb-2">{item.id}</p>
                        <p className="text-sm text-slate-700 dark:text-slate-300 mb-3 whitespace-pre-wrap"><strong>Last value:</strong> {item.values.default}</p>
                        <div className="flex items-center gap-4 text-sm">
                            <label className="flex items-center gap-2"><input type="radio" name={`remove-${item.id}`} value="keep" checked={removalResolutions[item.id] === 'keep'} onChange={() => setRemovalResolutions(prev => ({...prev, [item.id]: 'keep'}))} /> Keep as Archived</label>
                            <label className="flex items-center gap-2"><input type="radio" name={`remove-${item.id}`} value="delete" checked={removalResolutions[item.id] === 'delete'} onChange={() => setRemovalResolutions(prev => ({...prev, [item.id]: 'delete'}))} /> Delete Permanently</label>
                        </div>
                    </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-4">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md shadow-sm hover:bg-slate-50 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-600">
                Cancel
            </button>
            <button onClick={handleApply} disabled={!hasChanges} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
                Apply Changes
            </button>
        </div>
      </div>
    </div>
  );
};

export default MergeReviewModal;