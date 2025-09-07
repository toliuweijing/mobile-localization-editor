
import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { StringResource, Project, Platform, MergeComparison, MergeResolutions, UpdateDiff, ValueChange, LanguageMappingRequest, LanguageMappingResolution } from './types';
import { getAllProjects, saveProject, deleteProject, clearAllProjects, bulkSaveProjects } from './services/database';
import FileUpload from './components/FileUpload';
import ResourceTable from './components/ResourceTable';
import FileIcon from './components/icons/FileIcon';
import PlusIcon from './components/icons/PlusIcon';
import Sidebar from './components/Sidebar';
import MenuIcon from './components/icons/MenuIcon';
import RefreshIcon from './components/icons/RefreshIcon';
import MergeReviewModal from './components/MergeReviewModal';
import LanguageMappingModal from './components/LanguageMappingModal';
import UploadIcon from './components/icons/UploadIcon';
import CheckIcon from './components/icons/CheckIcon';

const App: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aiTranslating, setAiTranslating] = useState<{ [langCode: string]: boolean }>({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [mergeComparison, setMergeComparison] = useState<MergeComparison | null>(null);
  const [languageMappingRequest, setLanguageMappingRequest] = useState<LanguageMappingRequest | null>(null);
  const sourceUpdateFileInputRef = useRef<HTMLInputElement>(null);
  const translationUpdateFileInputRef = useRef<HTMLInputElement>(null);

  const activeProject = useMemo(() => {
    return projects.find(p => p.id === activeProjectId) || null;
  }, [projects, activeProjectId]);
  
  const hasPendingChanges = useMemo(() => {
    if (!activeProject) return false;
    return activeProject.resources.some(r => r.status === 'new' || r.status === 'updated');
  }, [activeProject]);

  // Load projects from IndexedDB on initial render
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const storedProjects = await getAllProjects();
        setProjects(storedProjects);
        if (storedProjects.length > 0 && !activeProjectId) {
            // Optional: activate the most recent project on load
            // setActiveProjectId(storedProjects[0].id);
        }
      } catch (e) {
        console.error("Failed to load projects from IndexedDB", e);
        setError("Could not load project data. The database may be corrupted.");
      }
    };
    loadProjects();
  }, []);

  const updateActiveProject = useCallback((updater: (project: Project) => Project) => {
    if (!activeProjectId) return;

    let updatedProject: Project | null = null;
    setProjects(prevProjects =>
      prevProjects.map(p => {
        if (p.id === activeProjectId) {
          updatedProject = updater(p);
          return updatedProject;
        }
        return p;
      })
    );
    
    if (updatedProject) {
      saveProject(updatedProject).catch(e => {
          console.error("Failed to save project changes:", e);
          setError("Failed to save changes to the database.");
      });
    }
  }, [activeProjectId]);


  const parseXmlContent = (xmlString: string): StringResource[] => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'application/xml');
    
    const parserError = xmlDoc.querySelector('parsererror');
    if (parserError) {
      throw new Error('Failed to parse XML. Please provide a valid XML file.');
    }

    const stringElements = xmlDoc.getElementsByTagName('string');
    if (stringElements.length === 0) {
        throw new Error('No <string> tags found in the XML file.');
    }

    const parsedResources: StringResource[] = [];

    for (const element of Array.from(stringElements)) {
      const id = element.getAttribute('name');
      const value = element.textContent || '';
      let context = 'No context provided.';
      let commentNode: Comment | null = null;

      let currentNode = element.previousSibling;
      while (currentNode) {
        if (currentNode.nodeType === 8) { // Node.COMMENT_NODE
          context = currentNode.textContent?.trim() || '';
          commentNode = currentNode as Comment;
          break;
        }
        if (currentNode.nodeType === 1 || (currentNode.nodeType === 3 && currentNode.textContent?.trim())) { // Node.ELEMENT_NODE or non-empty Node.TEXT_NODE
          break;
        }
        currentNode = currentNode.previousSibling;
      }

      if (id) {
        const commentText = commentNode ? `<!--${commentNode.textContent}-->\n    ` : '';
        const sourceText = (commentText + element.outerHTML).trim();
        parsedResources.push({ id, context, values: { default: value }, sourceText });
      }
    }
    return parsedResources;
  };

  const parseIosStringsContent = (stringsFileContent: string): StringResource[] => {
    const parsedResources: StringResource[] = [];
    // Regex to match comments and key-value pairs
    const regex = /(?:\/\*([\s\S]*?)\*\/[\s\n]*)?"(.*?)"[\s\n]*=[\s\n]*"(.*?)";/g;
    let match;

    if (!stringsFileContent.includes('=')) {
        throw new Error('No valid key-value pairs found. Please provide a valid .strings file.');
    }

    while ((match = regex.exec(stringsFileContent)) !== null) {
      const sourceText = match[0].trim();
      const context = match[1]?.trim() || 'No context provided.';
      const id = match[2];
      // Need to handle escaped characters like \" and \n
      const value = match[3].replace(/\\"/g, '"').replace(/\\n/g, '\n');
      
      if (id) {
        parsedResources.push({ id, context, values: { default: value }, sourceText });
      }
    }

    if (parsedResources.length === 0) {
        throw new Error('Failed to parse .strings file. No entries were found.');
    }
    
    return parsedResources;
  };

  const parseCsvRow = (row: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < row.length; i++) {
        const char = row[i];
        if (char === '"') {
            if (inQuotes && row[i + 1] === '"') {
                current += '"';
                i++; // Skip the second quote
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim());
    return result.map(val => {
        if (val.startsWith('"') && val.endsWith('"')) {
            return val.slice(1, -1).replace(/""/g, '"');
        }
        return val;
    });
  };

  const parseCsvContent = (csvString: string): { headers: string[], rows: { [key: string]: string }[] } => {
    const lines = csvString.replace(/\r\n/g, '\n').split('\n');
    if (lines.length < 1) return { headers: [], rows: [] };

    const headers = parseCsvRow(lines[0]);
    if (headers.indexOf('id') === -1) {
        throw new Error("CSV must contain an 'id' column.");
    }

    const rows = [];
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const values = parseCsvRow(line);
        if (values.length !== headers.length) continue; // Skip malformed rows
        const rowObject = headers.reduce((obj, header, index) => {
            obj[header] = values[index];
            return obj;
        }, {} as { [key: string]: string });
        rows.push(rowObject);
    }
    return { headers, rows };
  };

  const handleInitialFileUpload = useCallback((file: File) => {
    if (!activeProjectId) return;

    const isXml = file.type === 'text/xml' || file.name.endsWith('.xml');
    const isStrings = file.name.endsWith('.strings');

    if (!isXml && !isStrings) {
        setError('Invalid file type. Please upload an Android (.xml) or iOS (.strings) file.');
        return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        let parsedData: StringResource[];
        let detectedPlatform: Platform;

        if (isXml) {
            parsedData = parseXmlContent(content);
            detectedPlatform = 'android';
        } else { // isStrings
            parsedData = parseIosStringsContent(content);
            detectedPlatform = 'ios';
        }
        
        updateActiveProject(proj => ({
            ...proj,
            resources: parsedData,
            fileName: file.name,
            platform: detectedPlatform,
            languages: ['default'],
        }));
        setError(null);
      } catch (e: unknown) {
        if (e instanceof Error) {
            setError(e.message);
        } else {
            setError('An unknown error occurred during parsing.');
        }
        updateActiveProject(proj => ({
            ...proj,
            resources: [],
            fileName: null,
            platform: null,
        }));
      }
    };
    reader.onerror = () => {
        setError('Failed to read the file.');
        updateActiveProject(proj => ({
            ...proj,
            resources: [],
            fileName: null,
            platform: null,
        }));
    };
    reader.readAsText(file);
  }, [activeProjectId, updateActiveProject]);

  const handleSourceFileUpdate = (file: File) => {
     if (!activeProject) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        handleProcessFileUpdate(file, {});
      } catch (e: unknown) {
        if (e instanceof Error) {
            setError(e.message);
        } else {
            setError('An unknown error occurred during update analysis.');
        }
      }
    };
    reader.onerror = () => {
        setError('Failed to read the update file.');
    };
    reader.readAsText(file);
  };

  const handleTranslationFileUpdate = (file: File) => {
     if (!activeProject) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const content = event.target?.result as string;
            // Phase 1: CSV Header Analysis
            const lines = content.replace(/\r\n/g, '\n').split('\n');
            if (lines.length < 1) throw new Error("CSV is empty.");
            const headers = parseCsvRow(lines[0]);
            
            const newLanguages: string[] = [];
            const unrecognizedColumns: string[] = [];

            for (const header of headers) {
                if (header === 'id' || header === 'context') continue;

                if (header.startsWith('value_')) {
                    const langCode = header.substring('value_'.length);
                    if (!activeProject.languages.includes(langCode)) {
                        newLanguages.push(langCode);
                    }
                } else {
                    unrecognizedColumns.push(header);
                }
            }

            if (newLanguages.length > 0 || unrecognizedColumns.length > 0) {
                setLanguageMappingRequest({ newLanguages, unrecognizedColumns, file });
                return; // Pause execution, wait for user input from modal
            }
            
            // If CSV has no new/unrecognized languages, proceed directly.
            handleProcessFileUpdate(file, {});

        } catch (e: unknown) {
            if (e instanceof Error) {
                setError(e.message);
            } else {
                setError('An unknown error occurred during update analysis.');
            }
        }
    };
    reader.onerror = () => {
        setError('Failed to read the update file.');
    };
    reader.readAsText(file);
  }

  const handleProcessFileUpdate = (file: File, resolutions: LanguageMappingResolution) => {
    if (!activeProject) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        let newResources: StringResource[];
        const isCsv = file.name.endsWith('.csv');

        if (isCsv) {
            const { headers, rows } = parseCsvContent(content);
            const headerMap: { [key: string]: string } = {}; // Maps original header to its purpose (e.g., 'value_fr')
            
            for(const header of headers) {
                if (header.startsWith('value_')) {
                    headerMap[header] = header;
                } else if (resolutions[header]?.action === 'map') {
                    const res = resolutions[header];
                    if (res.action === 'map') {
                        headerMap[header] = `value_${res.langCode}`;
                    }
                }
            }

            newResources = rows.map(row => {
                const id = row.id;
                if (!id) return null;
                const context = row.context || 'No context provided.';
                const values: { [lang: string]: string } = {};
                for (const originalHeader in headerMap) {
                    const mappedHeader = headerMap[originalHeader];
                    if (mappedHeader.startsWith('value_')) {
                        const langCode = mappedHeader.substring('value_'.length);
                        values[langCode] = row[originalHeader] || '';
                    }
                }
                return { id, context, values, sourceText: '' };
            }).filter((r): r is StringResource => r !== null);
        } else {
            newResources = activeProject.platform === 'android' 
                ? parseXmlContent(content) 
                : parseIosStringsContent(content);
        }

        const oldResourcesMap = new Map(activeProject.resources.map(r => [r.id, r]));

        const added: StringResource[] = [];
        const updated: UpdateDiff[] = [];
        const handledNewIds = new Set<string>();

        for (const newResource of newResources) {
            handledNewIds.add(newResource.id);
            const oldResource = oldResourcesMap.get(newResource.id);
            if (!oldResource || oldResource.isArchived) { // Treat archived as new
                added.push(newResource);
            } else {
                const valueChanges: ValueChange[] = [];
                let contextChange: UpdateDiff['contextChange'] = null;
                
                let languagesToCompare: Set<string>;
                if (isCsv) {
                    languagesToCompare = new Set([...Object.keys(oldResource.values), ...Object.keys(newResource.values)]);
                } else {
                    languagesToCompare = new Set(Object.keys(newResource.values));
                }
                
                for (const langCode of languagesToCompare) {
                  const oldValue = oldResource.values[langCode] || '';
                  const newValue = newResource.values[langCode] || '';
                  if (oldValue !== newValue) {
                      valueChanges.push({ langCode, oldValue, newValue });
                  }
                }
                
                if (newResource.context !== undefined && oldResource.context !== newResource.context) {
                    contextChange = { oldContext: oldResource.context, newContext: newResource.context };
                }

                if (valueChanges.length > 0 || contextChange) {
                    const updateDiff: UpdateDiff = { id: newResource.id, valueChanges, contextChange };
                    if (!isCsv) {
                        updateDiff.newSourceText = newResource.sourceText;
                    }
                    updated.push(updateDiff);
                }
            }
        }

        const removed = activeProject.resources.filter(r => !handledNewIds.has(r.id) && !r.isArchived);

        if (added.length === 0 && updated.length === 0 && removed.length === 0) {
            alert("No changes detected in the new file.");
            return;
        }
        setMergeComparison({ added, updated, removed });
        setError(null);

      } catch (e: unknown) {
        if (e instanceof Error) {
            setError(e.message);
        } else {
            setError('An unknown error occurred during update parsing.');
        }
      }
    };
    reader.onerror = () => {
        setError('Failed to read the update file.');
    };
    reader.readAsText(file);
  };
  
  const handleApplyMerge = (resolutions: MergeResolutions) => {
    if (!activeProject || !mergeComparison) return;

    updateActiveProject(proj => {
        const resourcesMap = new Map(proj.resources.map(r => [r.id, { ...r }]));
        let allLangs = new Set(proj.languages);

        // Process removals
        for (const res of mergeComparison.removed) {
            if (resolutions.removals[res.id] === 'delete') {
                resourcesMap.delete(res.id);
            } else if (resolutions.removals[res.id] === 'keep') {
                const existing = resourcesMap.get(res.id);
                if (existing) {
                    resourcesMap.set(res.id, { ...existing, isArchived: true, status: undefined });
                }
            }
        }

        // Process updates
        for (const update of mergeComparison.updated) {
            if (resolutions.updates[update.id] === 'update') {
                const existing = resourcesMap.get(update.id);
                if (existing) {
                    const newValues = { ...existing.values };
                    update.valueChanges.forEach(change => {
                        newValues[change.langCode] = change.newValue;
                        allLangs.add(change.langCode);
                    });

                    resourcesMap.set(update.id, {
                        ...existing,
                        values: newValues,
                        context: update.contextChange ? update.contextChange.newContext : existing.context,
                        sourceText: update.newSourceText || existing.sourceText,
                        isArchived: false,
                        status: 'updated',
                    });
                }
            }
        }
        
        // Process additions
        for (const newRes of mergeComparison.added) {
            resourcesMap.set(newRes.id, { ...newRes, status: 'new' });
            Object.keys(newRes.values).forEach(lang => allLangs.add(lang));
        }

        return {
            ...proj,
            resources: Array.from(resourcesMap.values()),
            languages: Array.from(allLangs),
            lastModified: Date.now(),
        };
    });

    setMergeComparison(null);
  };

  const handleUpdateResource = useCallback((id: string, field: 'context' | 'value', langCode: string, newValue: string) => {
    updateActiveProject(proj => ({
        ...proj,
        resources: proj.resources.map(resource => {
            if (resource.id !== id) return resource;
            
            const updatedResource = { ...resource };
            // Clear status on any edit
            if (updatedResource.status) {
                delete updatedResource.status;
            }

            if (field === 'context') {
                updatedResource.context = newValue;
            } else {
                updatedResource.values = { ...resource.values, [langCode]: newValue };
            }
            return updatedResource;
        })
    }));
  }, [updateActiveProject]);

  const handleNewProject = async () => {
    const newProject: Project = {
      id: `proj_${Date.now()}`,
      name: 'Untitled Project',
      lastModified: Date.now(),
      resources: [],
      fileName: null,
      platform: null,
      languages: ['default'],
    };
    await saveProject(newProject);
    setProjects(prev => [...prev, newProject]);
    setActiveProjectId(newProject.id);
    setError(null);
  };
  
  const handleSelectProject = (projectId: string | null) => {
    setActiveProjectId(projectId);
    setError(null);
  };

  const handleDeleteProject = async (projectId: string) => {
    if (window.confirm("Are you sure you want to permanently delete this project?")) {
        await deleteProject(projectId);
        setProjects(prev => prev.filter(p => p.id !== projectId));
        if (activeProjectId === projectId) {
            setActiveProjectId(null);
        }
    }
  };

  const handleRenameProject = useCallback(async (projectId: string, newName: string) => {
    const projectToUpdate = projects.find(p => p.id === projectId);
    if (projectToUpdate && projectToUpdate.name !== newName) {
        const updatedProject = { ...projectToUpdate, name: newName, lastModified: Date.now() };
        await saveProject(updatedProject);
        setProjects(prevProjects =>
            prevProjects.map(p =>
                p.id === projectId ? updatedProject : p
            )
        );
    }
  }, [projects]);

  const handleAcknowledgeChange = useCallback((resourceId: string) => {
    updateActiveProject(proj => ({
      ...proj,
      resources: proj.resources.map(r => {
        if (r.id === resourceId) {
          const { status, ...rest } = r;
          return rest as StringResource;
        }
        return r;
      }),
    }));
  }, [updateActiveProject]);
  
  const handleAcknowledgeAllChanges = useCallback(() => {
    if (!window.confirm("Are you sure you want to acknowledge all new and updated changes? This will remove their highlights.")) {
        return;
    }
    updateActiveProject(proj => ({
      ...proj,
      resources: proj.resources.map(r => {
        if (r.status) {
          const { status, ...rest } = r;
          return rest as StringResource;
        }
        return r;
      }),
    }));
  }, [updateActiveProject]);

  const triggerDownload = (content: string, fileType: string, downloadName: string) => {
    const blob = new Blob([content], { type: fileType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', downloadName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    if (!activeProject) return;
    const headers = ['id', 'context', ...activeProject.languages.map(l => `value_${l}`)];
    const escapeCsvField = (field: string) => {
      let escaped = (field || '').replace(/"/g, '""');
      if (escaped.includes(',') || escaped.includes('\n') || escaped.includes('"')) {
        escaped = `"${escaped}"`;
      }
      return escaped;
    };
    const csvRows = [
      headers.join(','),
      ...activeProject.resources.filter(r => !r.isArchived).map(r => 
        [
            escapeCsvField(r.id), 
            escapeCsvField(r.context), 
            ...activeProject.languages.map(l => escapeCsvField(r.values[l] || ''))
        ].join(',')
      )
    ];
    triggerDownload(csvRows.join('\n'), 'text/csv;charset=utf-8;', `${activeProject.fileName?.replace(/\.(xml|strings)$/, '')}.csv`);
  };

  const handleExportMD = () => {
    if (!activeProject) return;
    const escapeMdField = (field: string) => 
      (field || '').replace(/\|/g, '\\|').replace(/\r\n|\r|\n/g, '<br/>');

    const header = `| String ID | Context | ${activeProject.languages.map(l => `Value (${l})`).join(' | ')} |`;
    const separator = `|---|---|${activeProject.languages.map(() => '---').join('|')}|`;
    const mdRows = activeProject.resources.filter(r => !r.isArchived).map(r => 
      `| \`${escapeMdField(r.id)}\` | ${escapeMdField(r.context)} | ${activeProject.languages.map(l => escapeMdField(r.values[l] || '')).join(' | ')} |`
    );
    const mdContent = [header, separator, ...mdRows].join('\n');
    triggerDownload(mdContent, 'text/markdown;charset=utf-8;', `${activeProject.fileName?.replace(/\.(xml|strings)$/, '')}.md`);
  };
  
  const handleExportXML = (langCode: string) => {
    if (!activeProject?.fileName) return;

    const escapeXml = (str: string) => {
      return (str || '').replace(/[<>&"']/g, (c) => {
        switch (c) {
          case '<': return '&lt;';
          case '>': return '&gt;';
          case '&': return '&amp;';
          case '"': return '&quot;';
          case "'": return '&apos;';
          default: return c;
        }
      });
    };

    const xmlParts = activeProject.resources.filter(r => !r.isArchived).map(r => {
      const value = r.values[langCode] || '';
      if (!value && langCode !== 'default') return null; 
      const comment = r.context !== 'No context provided.' 
        ? `    <!-- ${escapeXml(r.context)} -->\n`
        : '';
      const stringTag = `    <string name="${escapeXml(r.id)}">${escapeXml(value)}</string>`;
      return comment + stringTag;
    }).filter(Boolean);

    const xmlContent = `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n${xmlParts.join('\n')}\n</resources>`;
    const downloadName = langCode === 'default' 
      ? activeProject.fileName
      : `strings-${langCode}.xml`;
    triggerDownload(xmlContent, 'application/xml;charset=utf-8;', downloadName);
  };

  const handleExportIosStrings = (langCode: string) => {
    if (!activeProject?.fileName) return;

    const escapeStringsValue = (str: string) => {
        return (str || '').replace(/"/g, '\\"').replace(/\n/g, '\\n');
    }

    const stringsParts = activeProject.resources.filter(r => !r.isArchived).map(r => {
        const value = r.values[langCode] || '';
        if (!value && langCode !== 'default') return null;
        const comment = r.context !== 'No context provided.'
            ? `/* ${r.context} */\n`
            : '';
        const stringEntry = `"${r.id}" = "${escapeStringsValue(value)}";`;
        return comment + stringEntry;
    }).filter(Boolean);

    const stringsContent = stringsParts.join('\n\n');
    const downloadName = langCode === 'default'
        ? `Localizable.strings`
        : `Localizable-${langCode}.strings`;
    
    triggerDownload(stringsContent, 'text/plain;charset=utf-8;', downloadName);
  };

  const handleAddLanguage = () => {
    const langCode = prompt("Enter a new language code (e.g., 'es', 'fr', 'de'):");
    if (langCode && langCode.trim()) {
      const newLang = langCode.trim();
      if (activeProject?.languages.includes(newLang)) {
        alert(`Language code '${newLang}' already exists.`);
      } else {
        updateActiveProject(proj => ({ ...proj, languages: [...proj.languages, newLang] }));
      }
    }
  };

  const handleRemoveLanguage = useCallback((langCodeToRemove: string) => {
    if (langCodeToRemove === 'default') {
      alert("Cannot remove the default language.");
      return;
    }
    if (window.confirm(`Are you sure you want to remove the '${langCodeToRemove}' language and all its translations? This cannot be undone.`)) {
      updateActiveProject(proj => {
        const newResources = proj.resources.map(r => {
            const newValues = { ...r.values };
            delete newValues[langCodeToRemove];
            return { ...r, values: newValues };
        });
        return {
            ...proj,
            languages: proj.languages.filter(l => l !== langCodeToRemove),
            resources: newResources,
        }
      });
    }
  }, [updateActiveProject]);

  const handleAiTranslate = useCallback(async (targetLangCode: string) => {
    if (!activeProject) return;
    if (!window.confirm(`This will use AI to translate all strings from 'default' to '${targetLangCode}'. Existing translations in this column will be overwritten. Do you want to proceed?`)) {
      return;
    }

    setAiTranslating(prev => ({ ...prev, [targetLangCode]: true }));

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      const stringsToTranslate = activeProject.resources.map(r => ({ id: r.id, value: r.values.default || '' }));

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `You are an expert translator for mobile app string resources. Translate the following JSON array of strings to the language code: ${targetLangCode}. It is critical that you preserve any formatting placeholders (like Android's %1$s, %d or iOS's %@, %d) exactly as they appear in the original text. Your response must be a valid JSON array of objects, where each object has an "id" and a "translation".\n\n${JSON.stringify(stringsToTranslate)}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                translation: { type: Type.STRING },
              },
              required: ["id", "translation"],
            },
          },
        },
      });

      const translatedStrings: { id: string, translation: string }[] = JSON.parse(response.text);
      const translationMap = new Map(translatedStrings.map(item => [item.id, item.translation]));
      
      updateActiveProject(proj => ({
        ...proj,
        resources: proj.resources.map(resource => {
          if (translationMap.has(resource.id)) {
            return {
              ...resource,
              values: {
                ...resource.values,
                [targetLangCode]: translationMap.get(resource.id)!,
              },
            };
          }
          return resource;
        })
      }));

    } catch (e) {
      console.error("AI translation failed:", e);
      alert("AI translation failed. Please check the console for more details or try again later.");
    } finally {
      setAiTranslating(prev => ({ ...prev, [targetLangCode]: false }));
    }
  }, [activeProject, updateActiveProject]);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, []);

  const handleExportWorkspace = async () => {
    try {
      const allProjects = await getAllProjects();
      const snapshot = {
        snapshotVersion: 1,
        exportDate: new Date().toISOString(),
        projects: allProjects,
      };
      const jsonString = JSON.stringify(snapshot, null, 2);
      const date = new Date().toISOString().split('T')[0];
      triggerDownload(jsonString, 'application/json;charset=utf-8;', `localization-editor-workspace-${date}.json`);
    } catch (e) {
      console.error("Failed to export workspace", e);
      alert("Failed to export workspace. Please check the console for details.");
    }
  };

  const handleImportWorkspace = (file: File) => {
    if (!file.name.endsWith('.json')) {
      alert("Invalid file type. Please select a .json snapshot file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const snapshot = JSON.parse(content);

        // Basic validation
        if (snapshot.snapshotVersion !== 1 || !Array.isArray(snapshot.projects)) {
          throw new Error("Invalid snapshot file format.");
        }

        const confirmed = window.confirm(
          "Are you sure you want to restore this workspace snapshot? This will PERMANENTLY DELETE all current projects and replace them with the contents of the file."
        );
        
        if (confirmed) {
          await clearAllProjects();
          await bulkSaveProjects(snapshot.projects);
          alert("Workspace imported successfully! The application will now reload.");
          window.location.reload();
        }

      } catch (e: unknown) {
        if (e instanceof Error) {
          alert(`Failed to import workspace: ${e.message}`);
        } else {
          alert('An unknown error occurred during import.');
        }
        console.error("Failed to import workspace", e);
      }
    };
    reader.onerror = () => {
      alert('Failed to read the file.');
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      <Sidebar 
        projects={projects}
        activeProjectId={activeProjectId}
        onSelectProject={handleSelectProject}
        onNewProject={handleNewProject}
        onDeleteProject={handleDeleteProject}
        onRenameProject={handleRenameProject}
        isSidebarOpen={isSidebarOpen}
        onImportWorkspace={handleImportWorkspace}
        onExportWorkspace={handleExportWorkspace}
      />
      <div className="flex-1 flex flex-col relative overflow-hidden">
        <button
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
          className="absolute top-4 left-4 z-20 p-2 bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
        >
          <MenuIcon className="w-6 h-6 text-slate-600 dark:text-slate-300" />
        </button>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            {!activeProject ? (
                <div className="flex flex-col items-center justify-center h-full">
                    <header className="text-center">
                        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
                            Mobile Localization Editor
                        </h1>
                        <p className="mt-4 max-w-2xl mx-auto text-lg text-slate-500 dark:text-slate-400">
                            Select a project from the sidebar or create a new one to begin.
                        </p>
                    </header>
                </div>
            ) : (
              <>
                {activeProject.resources.length > 0 && activeProject.fileName ? (
                  <div className="animate-fade-in">
                    <div className="flex flex-col sm:flex-row justify-between items-center mb-6 bg-white dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                      <div className="flex items-center text-lg font-medium text-slate-800 dark:text-slate-200 mb-4 sm:mb-0 mr-auto sm:mr-4">
                          <FileIcon className="w-6 h-6 mr-3 text-blue-500"/>
                          <span className="truncate" title={activeProject.fileName}>{activeProject.fileName}</span>
                          {activeProject.platform && <span className="ml-3 text-xs font-mono uppercase bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-2 py-1 rounded-full">{activeProject.platform}</span>}
                      </div>
                      <div className="flex items-center justify-center flex-wrap gap-3">
                          {hasPendingChanges && (
                              <button
                                  onClick={handleAcknowledgeAllChanges}
                                  className="flex items-center justify-center px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md shadow-sm hover:bg-slate-50 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-600 transition-colors"
                                  title="Acknowledge all new and updated strings, removing their highlights."
                              >
                                  <CheckIcon className="w-5 h-5 mr-2" />
                                  Acknowledge All
                              </button>
                          )}
                          <button
                            onClick={() => sourceUpdateFileInputRef.current?.click()}
                            className="flex items-center justify-center px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md shadow-sm hover:bg-slate-50 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-600 transition-colors"
                            title={`Update from a new version of the source file (${activeProject.platform === 'android' ? '.xml' : '.strings'})`}
                          >
                            <RefreshIcon className="w-5 h-5 mr-2" />
                            Update Source
                          </button>
                          <input
                            type="file"
                            ref={sourceUpdateFileInputRef}
                            className="hidden"
                            accept={activeProject.platform === 'android' ? '.xml' : '.strings'}
                            onChange={(e) => {
                                if (e.target.files && e.target.files.length > 0) {
                                    handleSourceFileUpdate(e.target.files[0]);
                                }
                                if (e.target) e.target.value = '';
                            }}
                          />
                          <button
                            onClick={() => translationUpdateFileInputRef.current?.click()}
                            className="flex items-center justify-center px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md shadow-sm hover:bg-slate-50 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-600 transition-colors"
                            title="Update translations from a CSV file"
                          >
                            <UploadIcon className="w-5 h-5 mr-2" />
                            Update Translation
                          </button>
                          <input
                            type="file"
                            ref={translationUpdateFileInputRef}
                            className="hidden"
                            accept=".csv"
                            onChange={(e) => {
                                if (e.target.files && e.target.files.length > 0) {
                                    handleTranslationFileUpdate(e.target.files[0]);
                                }
                                if (e.target) e.target.value = '';
                            }}
                          />
                          <button
                              onClick={handleAddLanguage}
                              className="flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:bg-green-500 dark:hover:bg-green-600 transition-colors"
                              title="Add a new language for translation"
                          >
                              <PlusIcon className="w-5 h-5 mr-2" />
                              Add Translation
                          </button>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm bg-white dark:bg-slate-800/50 mb-6">
                        <h3 className="text-lg font-semibold mb-3 text-slate-800 dark:text-slate-200">Export Options</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="flex flex-col gap-2">
                                <h4 className="font-medium text-slate-600 dark:text-slate-300">Export Native Files</h4>
                                <div className="flex flex-wrap gap-2">
                                    {activeProject.languages.map(lang => (
                                        <button key={lang} onClick={() => activeProject.platform === 'android' ? handleExportXML(lang) : handleExportIosStrings(lang)} className="px-3 py-1 text-xs font-semibold text-blue-700 bg-blue-100 rounded-full hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-900/80 transition-colors">
                                            {lang}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <h4 className="font-medium text-slate-600 dark:text-slate-300">Export CSV</h4>
                                <button onClick={handleExportCSV} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md shadow-sm hover:bg-slate-50 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-600 transition-colors">
                                    Download .csv
                                </button>
                            </div>
                            <div className="flex flex-col gap-2">
                                <h4 className="font-medium text-slate-600 dark:text-slate-300">Export Markdown</h4>
                                <button onClick={handleExportMD} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md shadow-sm hover:bg-slate-50 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-600 transition-colors">
                                    Download .md
                                </button>
                            </div>
                        </div>
                    </div>

                    <ResourceTable
                        resources={activeProject.resources}
                        languages={activeProject.languages}
                        onUpdateResource={handleUpdateResource}
                        onRemoveLanguage={handleRemoveLanguage}
                        onAiTranslate={handleAiTranslate}
                        aiTranslating={aiTranslating}
                        platform={activeProject.platform}
                        onAcknowledgeChange={handleAcknowledgeChange}
                    />
                  </div>
                ) : (
                  <FileUpload onFileSelect={handleInitialFileUpload} error={error} />
                )}
              </>
            )}
        </main>
        {languageMappingRequest && (
            <LanguageMappingModal
                request={languageMappingRequest}
                onClose={() => setLanguageMappingRequest(null)}
                onConfirm={(resolutions) => {
                    const file = languageMappingRequest.file;
                    setLanguageMappingRequest(null);
                    handleProcessFileUpdate(file, resolutions);
                }}
            />
        )}
        {mergeComparison && (
            <MergeReviewModal 
                comparison={mergeComparison}
                onClose={() => setMergeComparison(null)}
                onApply={handleApplyMerge}
            />
        )}
      </div>
    </div>
  );
};

export default App;
