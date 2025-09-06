import React from 'react';
import NewFileIcon from './icons/NewFileIcon';
import SaveIcon from './icons/SaveIcon';
import TrashIcon from './icons/TrashIcon';
import UploadIcon from './icons/UploadIcon';
import DownloadIcon from './icons/DownloadIcon';


interface Project {
  id: string;
  name: string;
  lastModified: number;
}

interface SidebarProps {
  projects: Project[];
  activeProjectId: string | null;
  isDirty: boolean;
  onSelectProject: (id: string) => void;
  onNewProject: () => void;
  onSaveProject: () => void;
  onDeleteProject: (id: string) => void;
  onRenameProject: (id: string, newName: string) => void;
  onImportWorkspace: (file: File) => void;
  onExportWorkspace: () => void;
  isSidebarOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ projects, activeProjectId, isDirty, onSelectProject, onNewProject, onSaveProject, onDeleteProject, onRenameProject, onImportWorkspace, onExportWorkspace, isSidebarOpen }) => {
  const importInputRef = React.useRef<HTMLInputElement>(null);
  const sortedProjects = [...projects].sort((a, b) => b.lastModified - a.lastModified);

  const handleImportClick = () => {
    importInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onImportWorkspace(e.target.files[0]);
      e.target.value = ''; // Reset input to allow re-uploading the same file
    }
  };

  return (
    <aside className={`h-full bg-slate-100 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col shadow-md transition-all duration-300 ease-in-out overflow-hidden ${isSidebarOpen ? 'w-64' : 'w-0'}`}>
      <div className="min-w-[16rem] flex flex-col h-full">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Projects</h2>
        </div>
        <div className="p-2 flex items-center gap-2 border-b border-slate-200 dark:border-slate-700">
          <button
            onClick={onNewProject}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors"
          >
            <NewFileIcon className="w-4 h-4" />
            New
          </button>
          <button
            onClick={onSaveProject}
            disabled={!isDirty || !activeProjectId}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:bg-green-500 dark:hover:bg-green-600 transition-colors disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed"
          >
            <SaveIcon className="w-4 h-4" />
            Save
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <ul className="p-2 space-y-1">
            {sortedProjects.length > 0 ? (
              sortedProjects.map(project => (
                <li key={project.id}>
                  <button
                    onClick={() => onSelectProject(project.id)}
                    className={`w-full text-left p-2 rounded-md transition-colors group flex justify-between items-center ${
                      activeProjectId === project.id
                        ? 'bg-blue-500 text-white'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <div className="flex flex-col truncate">
                      <div className="flex items-center">
                          <span
                              className="text-sm font-semibold truncate cursor-text rounded-sm focus:outline-none focus:ring-1 focus:ring-blue-400 focus:bg-white dark:focus:bg-slate-900 focus:text-slate-900 dark:focus:text-slate-100"
                              contentEditable
                              suppressContentEditableWarning={true}
                              onClick={(e) => {
                                  // Prevent project selection when clicking to edit name
                                  e.stopPropagation();
                              }}
                              onBlur={(e) => {
                                  const newName = e.currentTarget.textContent?.trim();
                                  const originalProject = projects.find(p => p.id === project.id);
                                  if (newName && originalProject && newName !== originalProject.name) {
                                      onRenameProject(project.id, newName);
                                  } else {
                                      // Revert if name is empty or unchanged
                                      e.currentTarget.textContent = originalProject?.name || 'Untitled Project';
                                  }
                              }}
                              onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                      e.preventDefault();
                                      (e.target as HTMLElement).blur();
                                  } else if (e.key === 'Escape') {
                                      const originalProject = projects.find(p => p.id === project.id);
                                      e.currentTarget.textContent = originalProject?.name || 'Untitled Project';
                                      (e.target as HTMLElement).blur();
                                  }
                              }}
                          >
                              {project.name}
                          </span>
                          {project.id === activeProjectId && isDirty ? <span className="ml-1 text-red-400 font-bold">*</span> : ''}
                      </div>
                      <span className={`text-xs ${activeProjectId === project.id ? 'text-blue-200' : 'text-slate-400'}`}>
                        {new Date(project.lastModified).toLocaleDateString()}
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteProject(project.id);
                      }}
                      className={`p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity ${
                          activeProjectId === project.id 
                          ? 'text-blue-200 hover:bg-blue-600 hover:text-white' 
                          : 'text-slate-400 hover:bg-red-100 dark:hover:bg-red-900/50 hover:text-red-600'
                      }`}
                      aria-label={`Delete project ${project.name}`}
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </button>
                </li>
              ))
            ) : (
              <div className="p-4 text-center text-sm text-slate-500 dark:text-slate-400">
                  No projects found. Click "New" to start.
              </div>
            )}
          </ul>
        </div>
        <div className="mt-auto p-4 border-t border-slate-200 dark:border-slate-700">
            <h3 className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-2">Workspace</h3>
            <div className="space-y-2">
                <button
                    onClick={handleImportClick}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                    <UploadIcon className="w-5 h-5" />
                    <span>Import Workspace</span>
                </button>
                <input type="file" ref={importInputRef} onChange={handleFileChange} className="hidden" accept=".json" />
                <button
                    onClick={onExportWorkspace}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                    <DownloadIcon className="w-5 h-5" />
                    <span>Export Workspace</span>
                </button>
            </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
