import React, { useEffect, useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useAuthStore } from '../state/auth';
import { useFormBuilderStore } from '../state/formBuilder';
import { ElementPalette } from './form-builder/ElementPalette';
import { FormCanvas } from './form-builder/FormCanvas';
import { PropertiesPanel } from './form-builder/PropertiesPanel';
import { FormPreview } from './form-builder/FormPreview';
import { Button } from './ui/Button';

export const FormBuilder: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { elements, clearCanvas } = useFormBuilderStore();
  const [showPreview, setShowPreview] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  const handleSave = () => {
    // TODO: Implement form saving
    console.log('Saving form:', { elements });
    alert('Form save functionality coming soon!');
  };

  const handlePreview = () => {
    setShowPreview(true);
  };

  const handlePublish = () => {
    // TODO: Implement form publishing
    console.log('Publishing form:', { elements });
    alert('Form publishing functionality coming soon!');
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="h-screen flex flex-col bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 flex items-center justify-center rounded-lg bg-blue-600">
                  <svg 
                    className="h-5 w-5 text-white" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                    />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">FormForge</h1>
                  <p className="text-sm text-gray-500">Form Builder</p>
                </div>
              </div>
              
              <div className="hidden md:flex items-center space-x-1 text-sm text-gray-600">
                <span>Elements: {elements.length}</span>
                <span className="mx-2">•</span>
                <span>User: {user?.firstName} {user?.lastName}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm" onClick={handleSave}>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Save
              </Button>
              
              <Button variant="outline" size="sm" onClick={handlePreview}>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Preview
              </Button>
              
              <Button size="sm" onClick={handlePublish}>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Publish
              </Button>
              
              <div className="border-l border-gray-200 pl-3">
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Element Palette */}
          <ElementPalette />
          
          {/* Canvas Area */}
          <FormCanvas className="flex-1" />
          
          {/* Properties Panel */}
          <PropertiesPanel />
        </div>

        {/* Footer/Status Bar */}
        <footer className="bg-white border-t border-gray-200 px-6 py-2">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-4">
              <span>Ready</span>
              {elements.length > 0 && (
                <>
                  <span>•</span>
                  <span>{elements.length} elements on canvas</span>
                </>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              <span>FormForge v1.0.0</span>
              <button
                onClick={clearCanvas}
                className="text-red-600 hover:text-red-800 text-xs"
              >
                Clear Canvas
              </button>
            </div>
          </div>
        </footer>

        {/* Form Preview Modal */}
        {showPreview && (
          <FormPreview onClose={() => setShowPreview(false)} />
        )}
      </div>
    </DndProvider>
  );
};