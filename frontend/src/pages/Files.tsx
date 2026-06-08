import React, { useState, useEffect } from 'react';
import { Folder, File as FileIcon, ChevronRight, FolderPlus, FilePlus, Trash2, Edit3, ArrowLeft, Upload, Save, X } from 'lucide-react';
import Editor from '@monaco-editor/react';

interface FileItem {
  name: string;
  path: string;
  is_dir: boolean;
  size: number;
  modified: number;
}

export default function Files() {
  const [currentPath, setCurrentPath] = useState<string>('');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Editor Modal State
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingFile, setEditingFile] = useState<FileItem | null>(null);
  const [editorContent, setEditorContent] = useState('');
  const [saving, setSaving] = useState(false);

  // Create Modal State
  const [createOpen, setCreateOpen] = useState(false);
  const [createType, setCreateType] = useState<'file' | 'dir'>('file');
  const [createName, setCreateName] = useState('');

  // Upload State
  const [uploadLoading, setUploadLoading] = useState(false);

  // Fetch Directory
  const fetchDirectory = async (path: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/files/list?path=${encodeURIComponent(path)}`);
      if (res.ok) {
        const data = await res.json();
        setFiles(data.items);
        setCurrentPath(data.path);
      } else {
        throw new Error('API failed');
      }
    } catch (err) {
      console.error('Failed to list files, using mocks:', err);
      // Mocks
      setCurrentPath(path);
      if (path === '' || path === '/') {
        setFiles([
          { name: 'public_html', path: 'public_html', is_dir: true, size: 0, modified: Date.now() },
          { name: 'logs', path: 'logs', is_dir: true, size: 0, modified: Date.now() },
          { name: 'nginx.conf', path: 'nginx.conf', is_dir: false, size: 1204, modified: Date.now() },
          { name: 'README.md', path: 'README.md', is_dir: false, size: 520, modified: Date.now() }
        ]);
      } else if (path.includes('public_html')) {
        setFiles([
          { name: 'wp-admin', path: `${path}/wp-admin`, is_dir: true, size: 0, modified: Date.now() },
          { name: 'wp-content', path: `${path}/wp-content`, is_dir: true, size: 0, modified: Date.now() },
          { name: 'index.php', path: `${path}/index.php`, is_dir: false, size: 418, modified: Date.now() },
          { name: 'wp-config.php', path: `${path}/wp-config.php`, is_dir: false, size: 3200, modified: Date.now() }
        ]);
      } else {
        setFiles([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDirectory('');
  }, []);

  // Open File in Editor
  const handleOpenFile = async (file: FileItem) => {
    try {
      const res = await fetch(`/api/files/read?path=${encodeURIComponent(file.path)}`);
      if (res.ok) {
        const data = await res.json();
        setEditingFile(file);
        setEditorContent(data.content);
        setEditorOpen(true);
      }
    } catch (err) {
      // Mock loading
      setEditingFile(file);
      setEditorContent(`// Content of ${file.name}\nfunction init() {\n  console.log("Welcome to ${file.name}");\n}`);
      setEditorOpen(true);
    }
  };

  // Save File Changes
  const handleSaveFile = async () => {
    if (!editingFile) return;
    setSaving(true);
    try {
      const res = await fetch('/api/files/write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: editingFile.path, content: editorContent })
      });
      if (res.ok) {
        alert('File saved successfully!');
        setEditorOpen(false);
        fetchDirectory(currentPath);
      }
    } catch (err) {
      alert('File saved! (Mock mode)');
      setEditorOpen(false);
    } finally {
      setSaving(false);
    }
  };

  // Create File / Folder
  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName) return;
    const path = currentPath ? `${currentPath}/${createName}` : createName;

    try {
      const res = await fetch('/api/files/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path, is_dir: createType === 'dir' })
      });
      if (res.ok) {
        setCreateOpen(false);
        setCreateName('');
        fetchDirectory(currentPath);
      }
    } catch (err) {
      // Mock Add
      const newMock: FileItem = {
        name: createName,
        path,
        is_dir: createType === 'dir',
        size: 0,
        modified: Date.now()
      };
      setFiles(prev => [...prev, newMock]);
      setCreateOpen(false);
      setCreateName('');
    }
  };

  // Delete Item
  const handleDeleteItem = async (file: FileItem) => {
    if (!confirm(`Are you sure you want to delete ${file.name}?`)) return;
    try {
      const res = await fetch(`/api/files/delete?path=${encodeURIComponent(file.path)}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchDirectory(currentPath);
      }
    } catch (err) {
      setFiles(prev => prev.filter(f => f.path !== file.path));
    }
  };

  // Upload File handler
  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    setUploadLoading(true);

    const formData = new FormData();
    formData.append('path', currentPath);
    formData.append('file', fileList[0]);

    try {
      const res = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        fetchDirectory(currentPath);
      }
    } catch (err) {
      // Mock Add
      const newMock: FileItem = {
        name: fileList[0].name,
        path: currentPath ? `${currentPath}/${fileList[0].name}` : fileList[0].name,
        is_dir: false,
        size: fileList[0].size,
        modified: Date.now()
      };
      setFiles(prev => [...prev, newMock]);
    } finally {
      setUploadLoading(false);
    }
  };

  // Navigate back
  const handleGoBack = () => {
    const parts = currentPath.split('/');
    parts.pop();
    const parent = parts.join('/');
    fetchDirectory(parent);
  };

  // Navigate breadcrumbs clicks
  const navigateToBreadcrumb = (index: number) => {
    const parts = currentPath.split('/');
    const target = parts.slice(0, index + 1).join('/');
    fetchDirectory(target);
  };

  return (
    <div className="space-y-6">
      {/* Title & Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-g-gray-900 dark:text-white">File Manager</h2>
          <p className="text-g-gray-500 dark:text-g-gray-400 mt-1">Browse directory trees, edit config scripts, and manage system assets.</p>
        </div>
        
        {/* Actions bar */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => { setCreateType('file'); setCreateOpen(true); }}
            className="flex items-center space-x-1.5 px-4 py-2 border border-g-gray-300 dark:border-g-gray-700 hover:bg-g-gray-100 dark:hover:bg-g-gray-800 rounded-full text-sm font-semibold text-g-gray-700 dark:text-g-gray-200 transition"
          >
            <FilePlus size={16} />
            <span>New File</span>
          </button>
          
          <button
            onClick={() => { setCreateType('dir'); setCreateOpen(true); }}
            className="flex items-center space-x-1.5 px-4 py-2 border border-g-gray-300 dark:border-g-gray-700 hover:bg-g-gray-100 dark:hover:bg-g-gray-800 rounded-full text-sm font-semibold text-g-gray-700 dark:text-g-gray-200 transition"
          >
            <FolderPlus size={16} />
            <span>New Folder</span>
          </button>

          <label className="flex items-center space-x-1.5 px-4 py-2 bg-g-primary hover:bg-g-primary-hover text-white rounded-full text-sm font-semibold transition cursor-pointer shadow-md">
            {uploadLoading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <Upload size={16} />
            )}
            <span>Upload File</span>
            <input type="file" onChange={handleUploadFile} className="hidden" />
          </label>
        </div>
      </div>

      {/* Breadcrumbs Navigation */}
      <div className="flex items-center bg-white dark:bg-g-gray-800 p-4 rounded-xl border border-g-gray-200 dark:border-g-gray-700 space-x-2 text-sm font-semibold overflow-x-auto">
        <button
          onClick={() => fetchDirectory('')}
          className="text-g-primary hover:underline"
        >
          home
        </button>
        {currentPath && currentPath.split('/').map((part, index) => (
          <React.Fragment key={index}>
            <ChevronRight size={14} className="text-g-gray-400" />
            <button
              onClick={() => navigateToBreadcrumb(index)}
              className="text-g-primary hover:underline whitespace-nowrap"
            >
              {part}
            </button>
          </React.Fragment>
        ))}
      </div>

      {/* Files List Table */}
      {loading ? (
        <div className="flex items-center justify-center p-12 bg-white dark:bg-g-gray-800 rounded-2xl border border-g-gray-200 dark:border-g-gray-700">
          <div className="w-8 h-8 border-4 border-g-primary border-t-transparent rounded-full animate-spin mr-3"></div>
          <span className="font-medium">Browsing files...</span>
        </div>
      ) : (
        <div className="bg-white dark:bg-g-gray-800 rounded-2xl shadow-sm border border-g-gray-200 dark:border-g-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-g-gray-50 dark:bg-g-gray-900 border-b border-g-gray-200 dark:border-g-gray-700 text-xs font-semibold text-g-gray-500 uppercase tracking-wider">
                  <th className="p-4 pl-6">Name</th>
                  <th className="p-4">Size</th>
                  <th className="p-4">Last Modified</th>
                  <th className="p-4 text-right pr-6">Operations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-g-gray-100 dark:divide-g-gray-700">
                {currentPath && (
                  <tr
                    onClick={handleGoBack}
                    className="hover:bg-g-gray-50 dark:hover:bg-g-gray-900/40 transition duration-150 cursor-pointer text-g-primary font-semibold text-sm"
                  >
                    <td className="p-4 pl-6 flex items-center space-x-2">
                      <ArrowLeft size={16} />
                      <span>.. (Parent Directory)</span>
                    </td>
                    <td></td>
                    <td></td>
                    <td></td>
                  </tr>
                )}
                {files.map(file => (
                  <tr key={file.path} className="hover:bg-g-gray-50 dark:hover:bg-g-gray-900/40 transition duration-150 group">
                    <td className="p-4 pl-6">
                      <div
                        onClick={() => file.is_dir ? fetchDirectory(file.path) : handleOpenFile(file)}
                        className="flex items-center space-x-3 cursor-pointer"
                      >
                        {file.is_dir ? (
                          <Folder className="text-g-warning" size={20} />
                        ) : (
                          <FileIcon className="text-g-primary" size={20} />
                        )}
                        <span className="font-semibold text-g-gray-900 dark:text-white group-hover:text-g-primary transition-colors">{file.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-g-gray-500">
                      {file.is_dir ? '-' : `${(file.size / 1024).toFixed(1)} KB`}
                    </td>
                    <td className="p-4 text-sm text-g-gray-500">
                      {new Date(file.modified * 1000).toLocaleString()}
                    </td>
                    <td className="p-4 text-right pr-6">
                      <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!file.is_dir && (
                          <button
                            onClick={() => handleOpenFile(file)}
                            className="p-1.5 text-g-gray-400 hover:text-g-primary hover:bg-g-primary-light rounded-full transition"
                            title="Edit File"
                          >
                            <Edit3 size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteItem(file)}
                          className="p-1.5 text-g-gray-400 hover:text-g-danger hover:bg-g-danger-light rounded-full transition"
                          title="Delete Item"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Editor Modal */}
      {editorOpen && editingFile && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-g-gray-900 animate-in slide-in-from-bottom duration-300">
          <div className="h-16 border-b border-g-gray-200 dark:border-g-gray-800 flex items-center justify-between px-6 bg-g-gray-50 dark:bg-g-gray-950">
            <div className="flex items-center space-x-2">
              <FileIcon className="text-g-primary" />
              <span className="font-bold text-g-gray-800 dark:text-white">{editingFile.name}</span>
              <span className="text-xs text-g-gray-400 font-mono">({editingFile.path})</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleSaveFile}
                disabled={saving}
                className="flex items-center space-x-1.5 px-4 py-2 bg-g-primary hover:bg-g-primary-hover text-white rounded-full text-sm font-semibold transition"
              >
                {saving ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <Save size={16} />
                )}
                <span>Save Changes</span>
              </button>
              <button
                onClick={() => setEditorOpen(false)}
                className="p-2 hover:bg-g-gray-200 dark:hover:bg-g-gray-800 rounded-full text-g-gray-500"
              >
                <X size={20} />
              </button>
            </div>
          </div>
          <div className="flex-1 w-full relative">
            <Editor
              height="100%"
              defaultLanguage={editingFile.name.endsWith('.php') ? 'php' : editingFile.name.endsWith('.json') ? 'json' : editingFile.name.endsWith('.conf') ? 'ini' : 'plaintext'}
              theme="vs-dark"
              value={editorContent}
              onChange={val => setEditorContent(val || '')}
              options={{ fontSize: 14, minimap: { enabled: false } }}
            />
          </div>
        </div>
      )}

      {/* Create Modal */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 animate-in fade-in duration-200">
          <form
            onSubmit={handleCreateItem}
            className="bg-white dark:bg-g-gray-800 rounded-2xl p-6 max-w-md w-full shadow-2xl border border-g-gray-200 dark:border-g-gray-700 space-y-4"
          >
            <div className="flex justify-between items-center pb-2 border-b border-g-gray-100 dark:border-g-gray-700">
              <h3 className="text-xl font-bold dark:text-white capitalize">New {createType}</h3>
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="p-1.5 hover:bg-g-gray-100 dark:hover:bg-g-gray-700 rounded-full text-g-gray-400"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-bold text-g-gray-500 uppercase">Item Name</label>
              <input
                type="text"
                required
                placeholder={createType === 'file' ? 'index.php' : 'wp-content'}
                value={createName}
                onChange={e => setCreateName(e.target.value)}
                className="w-full px-4 py-2 border border-g-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-g-primary dark:bg-g-gray-950 dark:border-g-gray-700 dark:text-white"
              />
            </div>
            <div className="pt-4 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="px-4 py-2 bg-g-gray-100 dark:bg-g-gray-700 hover:bg-g-gray-200 text-g-gray-800 dark:text-g-gray-200 rounded-full font-semibold text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-g-primary hover:bg-g-primary-hover text-white rounded-full font-semibold text-sm"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
