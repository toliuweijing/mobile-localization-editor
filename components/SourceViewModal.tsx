
import React from 'react';
import { StringResource } from '../types';

interface SourceViewModalProps {
  resource: StringResource | null;
  onClose: () => void;
  platform: 'android' | 'ios' | null;
}

const SourceViewModal: React.FC<SourceViewModalProps> = ({ resource, onClose, platform }) => {
  if (!resource) {
    return null;
  }

  const language = platform === 'android' ? 'xml' : 'swift'; // .strings syntax is similar to swift strings

  return (
    <div 
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="source-view-title"
    >
      <div 
        className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 id="source-view-title" className="text-lg font-semibold text-slate-800 dark:text-slate-100 truncate">
            Source for: <span className="font-mono text-blue-600 dark:text-blue-400">{resource.id}</span>
          </h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
            aria-label="Close modal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        <div className="p-4 overflow-auto">
          <pre className="bg-slate-100 dark:bg-slate-900 p-4 rounded-md text-sm">
            <code className={`language-${language} whitespace-pre-wrap break-all text-slate-800 dark:text-slate-200`}>
              {resource.sourceText}
            </code>
          </pre>
        </div>
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-end">
            <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
                Close
            </button>
        </div>
      </div>
    </div>
  );
};

export default SourceViewModal;
