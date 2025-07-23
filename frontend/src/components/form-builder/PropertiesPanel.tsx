import React from 'react';
import { useFormBuilderStore } from '../../state/formBuilder';
import { FormElementType, PicklistOption } from '../../types/form-builder';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

export const PropertiesPanel: React.FC = () => {
  const { 
    elements, 
    selectedElementId, 
    updateElement,
    canUndo,
    canRedo,
    undo,
    redo,
    clearCanvas,
    snapToGrid,
    toggleSnapToGrid,
    gridSize,
    setGridSize,
    zoom,
    setZoom
  } = useFormBuilderStore();

  const selectedElement = elements.find(el => el.id === selectedElementId);

  const handlePropertyChange = (property: string, value: any) => {
    if (selectedElement) {
      if (property.startsWith('properties.')) {
        const propKey = property.replace('properties.', '');
        updateElement(selectedElement.id, {
          properties: {
            ...selectedElement.properties,
            [propKey]: value,
          },
        });
      } else {
        updateElement(selectedElement.id, { [property]: value });
      }
    }
  };

  const handleOptionChange = (index: number, field: 'label' | 'value', value: string) => {
    if (selectedElement && selectedElement.properties.options) {
      const newOptions = [...selectedElement.properties.options];
      newOptions[index] = { ...newOptions[index], [field]: value };
      handlePropertyChange('properties.options', newOptions);
    }
  };

  const addOption = () => {
    if (selectedElement && selectedElement.properties.options) {
      const newOptions = [...selectedElement.properties.options];
      newOptions.push({ label: `Option ${newOptions.length + 1}`, value: `option${newOptions.length + 1}` });
      handlePropertyChange('properties.options', newOptions);
    }
  };

  const removeOption = (index: number) => {
    if (selectedElement && selectedElement.properties.options) {
      const newOptions = selectedElement.properties.options.filter((_: any, i: number) => i !== index);
      handlePropertyChange('properties.options', newOptions);
    }
  };

  const renderElementProperties = () => {
    if (!selectedElement) return null;

    const commonProps = (
      <div className="space-y-4">
        <Input
          label="Label"
          value={selectedElement.label || ''}
          onChange={(e) => handlePropertyChange('label', e.target.value)}
        />
        
        <Input
          label="Placeholder"
          value={selectedElement.placeholder || ''}
          onChange={(e) => handlePropertyChange('placeholder', e.target.value)}
        />
        
        <Input
          label="Help Text"
          value={selectedElement.helpText || ''}
          onChange={(e) => handlePropertyChange('helpText', e.target.value)}
        />
        
        <div className="flex items-center">
          <input
            type="checkbox"
            id="required"
            checked={selectedElement.isRequired || false}
            onChange={(e) => handlePropertyChange('isRequired', e.target.checked)}
            className="mr-2"
          />
          <label htmlFor="required" className="text-sm font-medium text-gray-700">
            Required field
          </label>
        </div>
      </div>
    );

    const specificProps = (() => {
      switch (selectedElement.type) {
        case FormElementType.TEXT_INPUT:
          return (
            <div className="space-y-4 mt-6 pt-6 border-t border-gray-200">
              <h4 className="font-medium text-gray-900">Text Input Settings</h4>
              <Input
                label="Maximum Length"
                type="number"
                value={selectedElement.properties.maxLength || ''}
                onChange={(e) => handlePropertyChange('properties.maxLength', parseInt(e.target.value) || undefined)}
              />
              <Input
                label="Minimum Length"
                type="number"
                value={selectedElement.properties.minLength || ''}
                onChange={(e) => handlePropertyChange('properties.minLength', parseInt(e.target.value) || undefined)}
              />
              <Input
                label="Pattern (Regex)"
                value={selectedElement.properties.pattern || ''}
                onChange={(e) => handlePropertyChange('properties.pattern', e.target.value)}
                helperText="Regular expression for validation"
              />
            </div>
          );

        case FormElementType.NUMBER_INPUT:
          return (
            <div className="space-y-4 mt-6 pt-6 border-t border-gray-200">
              <h4 className="font-medium text-gray-900">Number Input Settings</h4>
              <Input
                label="Minimum Value"
                type="number"
                value={selectedElement.properties.min || ''}
                onChange={(e) => handlePropertyChange('properties.min', parseFloat(e.target.value) || undefined)}
              />
              <Input
                label="Maximum Value"
                type="number"
                value={selectedElement.properties.max || ''}
                onChange={(e) => handlePropertyChange('properties.max', parseFloat(e.target.value) || undefined)}
              />
              <Input
                label="Step"
                type="number"
                value={selectedElement.properties.step || ''}
                onChange={(e) => handlePropertyChange('properties.step', parseFloat(e.target.value) || 1)}
              />
            </div>
          );

        case FormElementType.TEXTAREA:
          return (
            <div className="space-y-4 mt-6 pt-6 border-t border-gray-200">
              <h4 className="font-medium text-gray-900">Text Area Settings</h4>
              <Input
                label="Rows"
                type="number"
                value={selectedElement.properties.rows || ''}
                onChange={(e) => handlePropertyChange('properties.rows', parseInt(e.target.value) || 4)}
              />
              <Input
                label="Maximum Length"
                type="number"
                value={selectedElement.properties.maxLength || ''}
                onChange={(e) => handlePropertyChange('properties.maxLength', parseInt(e.target.value) || undefined)}
              />
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="resizable"
                  checked={selectedElement.properties.resizable || false}
                  onChange={(e) => handlePropertyChange('properties.resizable', e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="resizable" className="text-sm font-medium text-gray-700">
                  Resizable
                </label>
              </div>
            </div>
          );

        case FormElementType.PICKLIST:
        case FormElementType.RADIO_GROUP:
          return (
            <div className="space-y-4 mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900">Options</h4>
                <Button size="sm" onClick={addOption}>
                  Add Option
                </Button>
              </div>
              
              {selectedElement.properties.options?.map((option: PicklistOption, index: number) => (
                <div key={index} className="flex space-x-2 items-end">
                  <Input
                    label="Label"
                    value={option.label}
                    onChange={(e) => handleOptionChange(index, 'label', e.target.value)}
                  />
                  <Input
                    label="Value"
                    value={option.value}
                    onChange={(e) => handleOptionChange(index, 'value', e.target.value)}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeOption(index)}
                    className="mb-1"
                  >
                    Remove
                  </Button>
                </div>
              ))}
              
              {selectedElement.type === FormElementType.RADIO_GROUP && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Layout</label>
                  <select
                    value={selectedElement.properties.layout || 'vertical'}
                    onChange={(e) => handlePropertyChange('properties.layout', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="vertical">Vertical</option>
                    <option value="horizontal">Horizontal</option>
                  </select>
                </div>
              )}
            </div>
          );

        case FormElementType.CHECKBOX:
          return (
            <div className="space-y-4 mt-6 pt-6 border-t border-gray-200">
              <h4 className="font-medium text-gray-900">Checkbox Settings</h4>
              <Input
                label="Checkbox Text"
                value={selectedElement.properties.text || ''}
                onChange={(e) => handlePropertyChange('properties.text', e.target.value)}
              />
              <Input
                label="Checked Value"
                value={selectedElement.properties.checkedValue || ''}
                onChange={(e) => handlePropertyChange('properties.checkedValue', e.target.value)}
              />
              <Input
                label="Unchecked Value"
                value={selectedElement.properties.uncheckedValue || ''}
                onChange={(e) => handlePropertyChange('properties.uncheckedValue', e.target.value)}
              />
            </div>
          );

        case FormElementType.DATE_PICKER:
          return (
            <div className="space-y-4 mt-6 pt-6 border-t border-gray-200">
              <h4 className="font-medium text-gray-900">Date Picker Settings</h4>
              <Input
                label="Date Format"
                value={selectedElement.properties.format || ''}
                onChange={(e) => handlePropertyChange('properties.format', e.target.value)}
                placeholder="MM/DD/YYYY"
              />
              <Input
                label="Minimum Date"
                type="date"
                value={selectedElement.properties.minDate || ''}
                onChange={(e) => handlePropertyChange('properties.minDate', e.target.value)}
              />
              <Input
                label="Maximum Date"
                type="date"
                value={selectedElement.properties.maxDate || ''}
                onChange={(e) => handlePropertyChange('properties.maxDate', e.target.value)}
              />
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="showTime"
                  checked={selectedElement.properties.showTime || false}
                  onChange={(e) => handlePropertyChange('properties.showTime', e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="showTime" className="text-sm font-medium text-gray-700">
                  Include time picker
                </label>
              </div>
            </div>
          );

        case FormElementType.FILE_UPLOAD:
          return (
            <div className="space-y-4 mt-6 pt-6 border-t border-gray-200">
              <h4 className="font-medium text-gray-900">File Upload Settings</h4>
              <Input
                label="Accepted File Types"
                value={selectedElement.properties.acceptedTypes?.join(', ') || ''}
                onChange={(e) => handlePropertyChange('properties.acceptedTypes', e.target.value.split(',').map(s => s.trim()))}
                placeholder="pdf, jpg, png, doc"
              />
              <Input
                label="Maximum File Size (MB)"
                type="number"
                value={selectedElement.properties.maxFileSize ? (selectedElement.properties.maxFileSize / (1024 * 1024)) : ''}
                onChange={(e) => handlePropertyChange('properties.maxFileSize', parseFloat(e.target.value) * 1024 * 1024 || undefined)}
              />
              <Input
                label="Maximum Files"
                type="number"
                value={selectedElement.properties.maxFiles || ''}
                onChange={(e) => handlePropertyChange('properties.maxFiles', parseInt(e.target.value) || 1)}
              />
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="allowMultiple"
                  checked={selectedElement.properties.allowMultiple || false}
                  onChange={(e) => handlePropertyChange('properties.allowMultiple', e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="allowMultiple" className="text-sm font-medium text-gray-700">
                  Allow multiple files
                </label>
              </div>
            </div>
          );

        default:
          return null;
      }
    })();

    return (
      <div>
        {commonProps}
        {specificProps}
      </div>
    );
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
      {/* Canvas Controls */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Canvas Controls</h3>
        
        <div className="space-y-3">
          {/* Undo/Redo */}
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={undo}
              disabled={!canUndo()}
            >
              Undo
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={redo}
              disabled={!canRedo()}
            >
              Redo
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={clearCanvas}
            >
              Clear
            </Button>
          </div>
          
          {/* Zoom */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Zoom: {Math.round(zoom * 100)}%
            </label>
            <input
              type="range"
              min="0.25"
              max="2"
              step="0.25"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
          
          {/* Grid Settings */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="snapToGrid"
              checked={snapToGrid}
              onChange={toggleSnapToGrid}
              className="mr-2"
            />
            <label htmlFor="snapToGrid" className="text-sm font-medium text-gray-700">
              Snap to grid
            </label>
          </div>
          
          {snapToGrid && (
            <Input
              label="Grid Size"
              type="number"
              value={gridSize}
              onChange={(e) => setGridSize(parseInt(e.target.value) || 20)}
              min="5"
              max="50"
            />
          )}
        </div>
      </div>

      {/* Element Properties */}
      <div className="p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          {selectedElement ? 'Element Properties' : 'Select an Element'}
        </h3>
        
        {selectedElement ? (
          <div>
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-blue-900">
                {selectedElement.type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
              </p>
              <p className="text-xs text-blue-700">ID: {selectedElement.id}</p>
            </div>
            
            {renderElementProperties()}
          </div>
        ) : (
          <div className="text-center py-8">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
              />
            </svg>
            <p className="mt-2 text-sm text-gray-500">
              Click on an element to edit its properties
            </p>
          </div>
        )}
      </div>
    </div>
  );
};