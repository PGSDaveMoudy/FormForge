import React, { useCallback, useState, useEffect } from 'react';
import { useDrop } from 'react-dnd';
import { useFormBuilderStore } from '../../state/formBuilder';
import { FormElement, FormElementType, Position } from '../../types/form-builder';
import { FormElementRenderer } from './FormElementRenderer';

interface CanvasProps {
  className?: string;
}

export const FormCanvas: React.FC<CanvasProps> = ({ className = '' }) => {
  const {
    elements,
    selectedElementId,
    canvasSize,
    gridSize,
    snapToGrid,
    zoom,
    addElement,
    selectElement,
    moveElement,
  } = useFormBuilderStore();

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: 'ELEMENT',
    drop: (item: { elementType: FormElementType }, monitor) => {
      const offset = monitor.getClientOffset();
      const canvasRect = canvasRef.current?.getBoundingClientRect();
      
      if (offset && canvasRect) {
        const position: Position = {
          x: (offset.x - canvasRect.left) / zoom,
          y: (offset.y - canvasRect.top) / zoom,
        };
        addElement(item.elementType, position);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  const canvasRef = React.useRef<HTMLDivElement>(null);

  // Handle canvas click to deselect elements
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      selectElement(null);
    }
  }, [selectElement]);

  // Grid pattern for visual grid
  const gridPattern = snapToGrid ? (
    <defs>
      <pattern
        id="grid"
        width={gridSize * zoom}
        height={gridSize * zoom}
        patternUnits="userSpaceOnUse"
      >
        <path
          d={`M ${gridSize * zoom} 0 L 0 0 0 ${gridSize * zoom}`}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="0.5"
        />
      </pattern>
    </defs>
  ) : null;

  return (
    <div className={`flex-1 overflow-auto bg-gray-100 ${className}`}>
      <div className="p-8">
        <div
          ref={drop}
          className={`
            relative bg-white border-2 border-dashed transition-colors duration-200
            ${isOver && canDrop ? 'border-blue-400 bg-blue-50' : 'border-gray-300'}
            ${canDrop ? 'border-blue-200' : ''}
          `}
          style={{
            width: canvasSize.width * zoom,
            height: canvasSize.height * zoom,
            minHeight: '600px',
            transform: `scale(${zoom})`,
            transformOrigin: 'top left',
          }}
          onClick={handleCanvasClick}
        >
          {/* Grid Background */}
          {snapToGrid && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {gridPattern}
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          )}

          {/* Drop Zone Indicator */}
          {isOver && canDrop && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-blue-100 border-2 border-blue-400 border-dashed rounded-lg p-8">
                <div className="text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  <p className="mt-2 text-sm font-medium text-blue-600">
                    Release to add element
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Form Elements */}
          {elements.map((element) => (
            <FormElementRenderer
              key={element.id}
              element={element}
              isSelected={selectedElementId === element.id}
              onSelect={() => selectElement(element.id)}
              onMove={(position) => moveElement(element.id, position)}
              zoom={zoom}
              snapToGrid={snapToGrid}
              gridSize={gridSize}
            />
          ))}

          {/* Empty State */}
          {elements.length === 0 && !isOver && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
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
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  Start building your form
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Drag elements from the palette to get started
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};