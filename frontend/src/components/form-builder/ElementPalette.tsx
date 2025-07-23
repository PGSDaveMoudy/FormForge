import React from 'react';
import { useDrag } from 'react-dnd';
import { FormElementType } from '../../types/form-builder';

interface ElementPaletteItemProps {
  elementType: FormElementType;
  icon: React.ReactNode;
  label: string;
  description: string;
}

const ElementPaletteItem: React.FC<ElementPaletteItemProps> = ({
  elementType,
  icon,
  label,
  description
}) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'ELEMENT',
    item: { elementType },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <div
      ref={drag}
      className={`
        p-3 border border-gray-200 rounded-lg cursor-move hover:border-blue-300 hover:bg-blue-50
        transition-colors duration-200 bg-white
        ${isDragging ? 'opacity-50' : 'opacity-100'}
      `}
    >
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0 text-gray-600">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900">{label}</p>
          <p className="text-xs text-gray-500 truncate">{description}</p>
        </div>
      </div>
    </div>
  );
};

export const ElementPalette: React.FC = () => {
  const elements = [
    {
      type: FormElementType.TEXT_INPUT,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
        </svg>
      ),
      label: 'Text Input',
      description: 'Single line text field'
    },
    {
      type: FormElementType.TEXTAREA,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
      ),
      label: 'Text Area',
      description: 'Multi-line text field'
    },
    {
      type: FormElementType.NUMBER_INPUT,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
        </svg>
      ),
      label: 'Number Input',
      description: 'Numeric input field'
    },
    {
      type: FormElementType.EMAIL_INPUT,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
        </svg>
      ),
      label: 'Email Input',
      description: 'Email address field'
    },
    {
      type: FormElementType.PICKLIST,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      ),
      label: 'Dropdown',
      description: 'Select from options'
    },
    {
      type: FormElementType.RADIO_GROUP,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      label: 'Radio Group',
      description: 'Choose one option'
    },
    {
      type: FormElementType.CHECKBOX,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      label: 'Checkbox',
      description: 'Yes/no option'
    },
    {
      type: FormElementType.DATE_PICKER,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      label: 'Date Picker',
      description: 'Select a date'
    },
    {
      type: FormElementType.FILE_UPLOAD,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      ),
      label: 'File Upload',
      description: 'Upload files'
    },
    {
      type: FormElementType.SIGNATURE,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      ),
      label: 'Signature',
      description: 'Digital signature pad'
    }
  ];

  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 p-4 overflow-y-auto">
      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Form Elements</h3>
        <p className="text-sm text-gray-600">Drag elements to the canvas to build your form</p>
      </div>
      
      <div className="space-y-2">
        {elements.map((element) => (
          <ElementPaletteItem
            key={element.type}
            elementType={element.type}
            icon={element.icon}
            label={element.label}
            description={element.description}
          />
        ))}
      </div>
      
      <div className="mt-8 pt-4 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Layout Elements</h4>
        <div className="space-y-2">
          <ElementPaletteItem
            elementType={FormElementType.SECTION_HEADER}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8m-8 6h16" />
              </svg>
            }
            label="Section Header"
            description="Organize form sections"
          />
          <ElementPaletteItem
            elementType={FormElementType.DIVIDER}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            }
            label="Divider"
            description="Visual separator"
          />
        </div>
      </div>
    </div>
  );
};