import React, { useRef, useState } from 'react';
import { useDrag } from 'react-dnd';
import { FormElement, FormElementType, Position } from '../../types/form-builder';
import { useFormBuilderStore } from '../../state/formBuilder';

interface FormElementRendererProps {
  element: FormElement;
  isSelected: boolean;
  onSelect: () => void;
  onMove: (position: Position) => void;
  zoom: number;
  snapToGrid: boolean;
  gridSize: number;
}

const snapToGrid = (position: Position, gridSize: number): Position => {
  return {
    x: Math.round(position.x / gridSize) * gridSize,
    y: Math.round(position.y / gridSize) * gridSize,
  };
};

export const FormElementRenderer: React.FC<FormElementRendererProps> = ({
  element,
  isSelected,
  onSelect,
  onMove,
  zoom,
  snapToGrid: shouldSnapToGrid,
  gridSize,
}) => {
  const { removeElement, duplicateElement } = useFormBuilderStore();
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });
  const elementRef = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag({
    type: 'EXISTING_ELEMENT',
    item: () => {
      const rect = elementRef.current?.getBoundingClientRect();
      if (rect) {
        return { 
          elementId: element.id,
          element,
          offset: dragOffset 
        };
      }
      return { elementId: element.id, element };
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) { // Left click only
      onSelect();
      const rect = elementRef.current?.getBoundingClientRect();
      if (rect) {
        setDragOffset({
          x: (e.clientX - rect.left) / zoom,
          y: (e.clientY - rect.top) / zoom,
        });
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isSelected) {
      switch (e.key) {
        case 'Delete':
        case 'Backspace':
          removeElement(element.id);
          break;
        case 'c':
          if (e.ctrlKey || e.metaKey) {
            duplicateElement(element.id);
          }
          break;
      }
    }
  };

  const renderElementContent = () => {
    const baseProps = {
      placeholder: element.placeholder || '',
      disabled: true, // Preview mode
      className: 'w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm',
    };

    switch (element.type) {
      case FormElementType.TEXT_INPUT:
        return <input type="text" {...baseProps} />;
      
      case FormElementType.EMAIL_INPUT:
        return <input type="email" {...baseProps} />;
      
      case FormElementType.NUMBER_INPUT:
        return <input type="number" {...baseProps} />;
      
      case FormElementType.TEXTAREA:
        return (
          <textarea
            {...baseProps}
            rows={element.properties.rows || 4}
            style={{ resize: element.properties.resizable ? 'vertical' : 'none' }}
          />
        );
      
      case FormElementType.PICKLIST:
        return (
          <select {...baseProps}>
            <option value="">{element.placeholder || 'Select an option'}</option>
            {element.properties.options?.map((option: any, index: number) => (
              <option key={index} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      
      case FormElementType.RADIO_GROUP:
        return (
          <div className="space-y-2">
            {element.properties.options?.map((option: any, index: number) => (
              <label key={index} className="flex items-center space-x-2">
                <input
                  type="radio"
                  name={element.id}
                  value={option.value}
                  disabled
                  className="text-blue-600"
                />
                <span className="text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        );
      
      case FormElementType.CHECKBOX:
        return (
          <label className="flex items-center space-x-2">
            <input type="checkbox" disabled className="text-blue-600" />
            <span className="text-sm text-gray-700">
              {element.properties.text || 'Checkbox option'}
            </span>
          </label>
        );
      
      case FormElementType.DATE_PICKER:
        return <input type="date" {...baseProps} />;
      
      case FormElementType.FILE_UPLOAD:
        return (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="mt-2 text-sm text-gray-600">Click to upload or drag and drop</p>
          </div>
        );
      
      case FormElementType.SIGNATURE:
        return (
          <div className="border border-gray-300 rounded-lg p-4 bg-gray-50 text-center">
            <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            <p className="mt-2 text-sm text-gray-600">Signature Pad</p>
          </div>
        );
      
      case FormElementType.SECTION_HEADER:
        return (
          <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
            {element.label || 'Section Header'}
          </h3>
        );
      
      case FormElementType.DIVIDER:
        return <hr className="border-gray-300" />;
      
      default:
        return (
          <div className="p-4 bg-gray-100 border border-gray-300 rounded-lg text-center">
            <p className="text-sm text-gray-600">Unknown Element Type</p>
          </div>
        );
    }
  };

  return (
    <div
      ref={(node) => {
        elementRef.current = node;
        drag(node);
      }}
      className={`
        absolute cursor-move select-none
        ${isDragging ? 'opacity-50' : 'opacity-100'}
        ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
      `}
      style={{
        left: element.position.x,
        top: element.position.y,
        width: element.size.width,
        minHeight: element.size.height,
        zIndex: isSelected ? 10 : 1,
      }}
      onMouseDown={handleMouseDown}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Element Label */}
      {element.label && element.type !== FormElementType.SECTION_HEADER && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {element.label}
          {element.isRequired && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      {/* Element Content */}
      <div className="relative">
        {renderElementContent()}
        
        {/* Selection Overlay */}
        {isSelected && (
          <div className="absolute inset-0 pointer-events-none">
            {/* Resize Handles */}
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 border border-white rounded-sm"></div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 border border-white rounded-sm"></div>
            <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 border border-white rounded-sm"></div>
            <div className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 border border-white rounded-sm"></div>
          </div>
        )}
      </div>
      
      {/* Help Text */}
      {element.helpText && (
        <p className="mt-1 text-xs text-gray-500">{element.helpText}</p>
      )}
      
      {/* Element Actions (visible on hover when selected) */}
      {isSelected && (
        <div className="absolute -top-8 -right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              duplicateElement(element.id);
            }}
            className="p-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
            title="Duplicate"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              removeElement(element.id);
            }}
            className="p-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
            title="Delete"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};