import React, { useState } from 'react';
import { useFormBuilderStore } from '../../state/formBuilder';
import { FormElement, FormElementType } from '../../types/form-builder';
import { Button } from '../ui/Button';

interface FormPreviewProps {
  onClose: () => void;
}

export const FormPreview: React.FC<FormPreviewProps> = ({ onClose }) => {
  const { elements } = useFormBuilderStore();
  const [formData, setFormData] = useState<Record<string, any>>({});

  const handleInputChange = (elementId: string, value: any) => {
    setFormData(prev => ({ ...prev, [elementId]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submission:', formData);
    alert('Form submitted! Check console for data.');
  };

  // Sort elements by position (top to bottom, left to right)
  const sortedElements = [...elements].sort((a, b) => {
    if (Math.abs(a.position.y - b.position.y) < 10) {
      return a.position.x - b.position.x;
    }
    return a.position.y - b.position.y;
  });

  const renderPreviewElement = (element: FormElement) => {
    const value = formData[element.id] || '';
    
    const commonProps = {
      id: element.id,
      name: element.id,
      required: element.isRequired,
      placeholder: element.placeholder || '',
      className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
    };

    const renderInput = () => {
      switch (element.type) {
        case FormElementType.TEXT_INPUT:
          return (
            <input
              {...commonProps}
              type="text"
              value={value}
              onChange={(e) => handleInputChange(element.id, e.target.value)}
              maxLength={element.properties.maxLength}
              minLength={element.properties.minLength}
              pattern={element.properties.pattern}
            />
          );

        case FormElementType.EMAIL_INPUT:
          return (
            <input
              {...commonProps}
              type="email"
              value={value}
              onChange={(e) => handleInputChange(element.id, e.target.value)}
            />
          );

        case FormElementType.NUMBER_INPUT:
          return (
            <input
              {...commonProps}
              type="number"
              value={value}
              onChange={(e) => handleInputChange(element.id, parseFloat(e.target.value) || '')}
              min={element.properties.min}
              max={element.properties.max}
              step={element.properties.step}
            />
          );

        case FormElementType.TEXTAREA:
          return (
            <textarea
              {...commonProps}
              value={value}
              onChange={(e) => handleInputChange(element.id, e.target.value)}
              rows={element.properties.rows || 4}
              maxLength={element.properties.maxLength}
              style={{ resize: element.properties.resizable ? 'vertical' : 'none' }}
            />
          );

        case FormElementType.PICKLIST:
          return (
            <select
              {...commonProps}
              value={value}
              onChange={(e) => handleInputChange(element.id, e.target.value)}
            >
              <option value="">{element.placeholder || 'Select an option'}</option>
              {element.properties.options?.map((option: any, index: number) => (
                <option key={index} value={option.value} disabled={option.disabled}>
                  {option.label}
                </option>
              ))}
            </select>
          );

        case FormElementType.RADIO_GROUP:
          return (
            <div className={`space-${element.properties.layout === 'horizontal' ? 'x' : 'y'}-3 ${element.properties.layout === 'horizontal' ? 'flex' : ''}`}>
              {element.properties.options?.map((option: any, index: number) => (
                <label key={index} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name={element.id}
                    value={option.value}
                    checked={value === option.value}
                    onChange={(e) => handleInputChange(element.id, e.target.value)}
                    required={element.isRequired}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>
          );

        case FormElementType.CHECKBOX:
          return (
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name={element.id}
                checked={value === (element.properties.checkedValue || 'true')}
                onChange={(e) => handleInputChange(
                  element.id, 
                  e.target.checked 
                    ? (element.properties.checkedValue || 'true')
                    : (element.properties.uncheckedValue || 'false')
                )}
                required={element.isRequired}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                {element.properties.text || 'Checkbox option'}
              </span>
            </label>
          );

        case FormElementType.DATE_PICKER:
          return (
            <input
              {...commonProps}
              type={element.properties.showTime ? 'datetime-local' : 'date'}
              value={value}
              onChange={(e) => handleInputChange(element.id, e.target.value)}
              min={element.properties.minDate}
              max={element.properties.maxDate}
            />
          );

        case FormElementType.FILE_UPLOAD:
          return (
            <input
              {...commonProps}
              type="file"
              onChange={(e) => handleInputChange(element.id, e.target.files)}
              accept={element.properties.acceptedTypes?.join(',')}
              multiple={element.properties.allowMultiple}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          );

        case FormElementType.SECTION_HEADER:
          return (
            <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-4">
              {element.label || 'Section Header'}
            </h3>
          );

        case FormElementType.DIVIDER:
          return <hr className="border-gray-300 my-6" />;

        default:
          return (
            <div className="p-4 bg-gray-100 border border-gray-300 rounded-lg text-center">
              <p className="text-sm text-gray-600">Unsupported element type</p>
            </div>
          );
      }
    };

    return (
      <div key={element.id} className="mb-6">
        {element.label && element.type !== FormElementType.SECTION_HEADER && element.type !== FormElementType.DIVIDER && (
          <label htmlFor={element.id} className="block text-sm font-medium text-gray-700 mb-2">
            {element.label}
            {element.isRequired && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        
        {renderInput()}
        
        {element.helpText && (
          <p className="mt-1 text-sm text-gray-500">{element.helpText}</p>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Form Preview</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {sortedElements.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="mt-4 text-gray-500">No form elements to preview</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {sortedElements.map(renderPreviewElement)}
              
              <div className="mt-8 pt-6 border-t border-gray-200">
                <Button type="submit" size="lg">
                  Submit Form
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};