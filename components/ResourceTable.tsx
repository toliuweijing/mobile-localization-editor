import React, { useState, useMemo } from 'react';
import { StringResource } from '../types';
import TrashIcon from './icons/TrashIcon';
import SparkleIcon from './icons/SparkleIcon';
import LoaderIcon from './icons/LoaderIcon';
import CodeIcon from './icons/CodeIcon';
import SourceViewModal from './SourceViewModal';


interface ResourceTableProps {
  resources: StringResource[];
  languages: string[];
  onUpdateResource: (id: string, field: 'context' | 'value', langCode: string, newValue: string) => void;
  onRemoveLanguage: (langCode: string) => void;
  onAiTranslate: (langCode: string) => void;
  aiTranslating: { [langCode: string]: boolean };
  platform: 'android' | 'ios' | null;
}

const ResourceTable: React.FC<ResourceTableProps> = ({ resources, languages, onUpdateResource, onRemoveLanguage, onAiTranslate, aiTranslating, platform }) => {
  const [selectedResource, setSelectedResource] = useState<StringResource | null>(null);

  const visibleResources = useMemo(() => resources.filter(r => !r.isArchived), [resources]);

  const handleBlur = (e: React.FocusEvent<HTMLTableCellElement>, id: string, field: 'context' | 'value', langCode: string) => {
    const newValue = e.currentTarget.textContent || '';
    const originalResource = resources.find(r => r.id === id);
    if (!originalResource) return;

    const originalValue = field === 'context' ? originalResource.context : originalResource.values[langCode];

    if (originalValue !== newValue) {
      onUpdateResource(id, field, langCode, newValue);
    }
  };

  return (
    <>
      <div className="w-full mt-6 overflow-hidden border border-slate-200 dark:border-slate-700 rounded-lg shadow-md">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-100 dark:bg-slate-800">
              <tr>
                <th scope="col" className="w-1/5 px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider sticky left-0 bg-slate-100 dark:bg-slate-800 z-10">
                  String ID
                </th>
                <th scope="col" className="w-1/4 px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                  Context (Editable)
                </th>
                {languages.map(lang => (
                  <th key={lang} scope="col" className="w-1/4 px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                    <div className="flex items-center justify-between">
                      <span>
                          {lang === 'default' ? 'Default Value' : `Value (${lang})`} (Editable)
                      </span>
                      {lang !== 'default' && (
                        <div className="flex items-center gap-2">
                            <button 
                              onClick={() => onAiTranslate(lang)}
                              disabled={aiTranslating[lang]}
                              title={`Translate with AI to ${lang}`}
                              aria-label={`Translate with AI to ${lang}`}
                              className="p-1 rounded-full text-slate-400 hover:bg-purple-100 hover:text-purple-600 dark:hover:bg-purple-900/50 dark:hover:text-purple-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {aiTranslating[lang] ? <LoaderIcon className="w-4 h-4 animate-spin" /> : <SparkleIcon className="w-4 h-4" />}
                            </button>
                            <button 
                              onClick={() => onRemoveLanguage(lang)} 
                              title={`Remove ${lang} language`}
                              aria-label={`Remove ${lang} language`}
                              className="p-1 rounded-full text-slate-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/50 dark:hover:text-red-400 transition-colors"
                              >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                        </div>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-700">
              {visibleResources.map((resource) => {
                let rowClass = 'group transition-colors duration-150';
                let stickyTdClass = 'px-6 py-4 whitespace-nowrap text-sm font-mono text-blue-600 dark:text-blue-400 break-all sticky left-0 z-10';

                if (resource.status === 'new') {
                    rowClass += ' bg-green-50 dark:bg-green-900/30';
                    stickyTdClass += ' bg-green-50 dark:bg-green-900/30 group-hover:bg-green-100 dark:group-hover:bg-green-900/50';
                } else if (resource.status === 'updated') {
                    rowClass += ' bg-yellow-50 dark:bg-yellow-900/30';
                    stickyTdClass += ' bg-yellow-50 dark:bg-yellow-900/30 group-hover:bg-yellow-100 dark:group-hover:bg-yellow-900/50';
                } else {
                    rowClass += ' hover:bg-slate-50 dark:hover:bg-slate-800/50';
                    stickyTdClass += ' bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/50';
                }

                return (
                  <tr key={resource.id} className={rowClass}>
                    <td className={stickyTdClass}>
                      <div className="flex items-center justify-between gap-4">
                          <span className="truncate" title={resource.id}>{resource.id}</span>
                          <button
                              onClick={() => setSelectedResource(resource)}
                              title="View original source"
                              aria-label={`View original source for ${resource.id}`}
                              className="p-1.5 rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                          >
                              <CodeIcon className="w-4 h-4" />
                          </button>
                      </div>
                    </td>
                    <td
                      contentEditable
                      suppressContentEditableWarning={true}
                      onBlur={(e) => handleBlur(e, resource.id, 'context', '')}
                      className="px-6 py-4 whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-400 cursor-text focus:outline-blue-500 focus:outline-2 focus:outline-offset-[-2px] rounded-md"
                    >
                      {resource.context}
                    </td>
                    {languages.map(lang => (
                      <td
                        key={lang}
                        contentEditable
                        suppressContentEditableWarning={true}
                        onBlur={(e) => handleBlur(e, resource.id, 'value', lang)}
                        className="px-6 py-4 whitespace-pre-wrap text-sm text-slate-900 dark:text-slate-100 font-medium cursor-text focus:outline-blue-500 focus:outline-2 focus:outline-offset-[-2px] rounded-md"
                      >
                        {resource.values[lang] || ''}
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
      <SourceViewModal 
        resource={selectedResource}
        onClose={() => setSelectedResource(null)}
        platform={platform}
      />
    </>
  );
};

export default ResourceTable;