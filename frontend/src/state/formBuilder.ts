import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  FormBuilderState, 
  FormElement, 
  FormElementType, 
  Position, 
  Size 
} from '../types/form-builder';

interface FormBuilderStore extends FormBuilderState {
  // Actions
  addElement: (elementType: FormElementType, position: Position) => string;
  updateElement: (elementId: string, updates: Partial<FormElement>) => void;
  removeElement: (elementId: string) => void;
  selectElement: (elementId: string | null) => void;
  moveElement: (elementId: string, position: Position) => void;
  resizeElement: (elementId: string, size: Size) => void;
  duplicateElement: (elementId: string) => string;
  clearCanvas: () => void;
  setCanvasSize: (size: Size) => void;
  setZoom: (zoom: number) => void;
  toggleSnapToGrid: () => void;
  setGridSize: (size: number) => void;
  
  // Undo/Redo
  history: FormBuilderState[];
  historyIndex: number;
  undo: () => void;
  redo: () => void;
  saveToHistory: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

const createDefaultElement = (
  elementType: FormElementType, 
  position: Position, 
  id: string
): FormElement => {
  const baseElement = {
    id,
    type: elementType,
    position,
    size: { width: 200, height: 40 },
    properties: {},
    isRequired: false,
    label: getDefaultLabel(elementType),
    placeholder: getDefaultPlaceholder(elementType),
  };

  switch (elementType) {
    case FormElementType.TEXT_INPUT:
      return {
        ...baseElement,
        properties: {
          maxLength: 255,
        },
      };
    
    case FormElementType.NUMBER_INPUT:
      return {
        ...baseElement,
        properties: {
          step: 1,
        },
      };
    
    case FormElementType.TEXTAREA:
      return {
        ...baseElement,
        size: { width: 300, height: 100 },
        properties: {
          rows: 4,
          resizable: true,
        },
      };
    
    case FormElementType.PICKLIST:
      return {
        ...baseElement,
        properties: {
          options: [
            { label: 'Option 1', value: 'option1' },
            { label: 'Option 2', value: 'option2' },
            { label: 'Option 3', value: 'option3' },
          ],
          searchable: false,
        },
      };
    
    case FormElementType.RADIO_GROUP:
      return {
        ...baseElement,
        size: { width: 200, height: 120 },
        properties: {
          options: [
            { label: 'Option 1', value: 'option1' },
            { label: 'Option 2', value: 'option2' },
            { label: 'Option 3', value: 'option3' },
          ],
          layout: 'vertical' as const,
        },
      };
    
    case FormElementType.CHECKBOX:
      return {
        ...baseElement,
        size: { width: 200, height: 30 },
        properties: {
          text: 'Check this option',
          checkedValue: 'true',
          uncheckedValue: 'false',
        },
      };
    
    case FormElementType.DATE_PICKER:
      return {
        ...baseElement,
        properties: {
          format: 'MM/DD/YYYY',
          showTime: false,
        },
      };
    
    case FormElementType.FILE_UPLOAD:
      return {
        ...baseElement,
        size: { width: 300, height: 80 },
        properties: {
          maxFileSize: 10 * 1024 * 1024, // 10MB
          maxFiles: 1,
          allowMultiple: false,
        },
      };
    
    default:
      return baseElement;
  }
};

const getDefaultLabel = (elementType: FormElementType): string => {
  const labels: Record<FormElementType, string> = {
    [FormElementType.TEXT_INPUT]: 'Text Input',
    [FormElementType.NUMBER_INPUT]: 'Number Input',
    [FormElementType.EMAIL_INPUT]: 'Email Address',
    [FormElementType.TEXTAREA]: 'Text Area',
    [FormElementType.PICKLIST]: 'Select Option',
    [FormElementType.MULTI_PICKLIST]: 'Select Multiple',
    [FormElementType.DATE_PICKER]: 'Select Date',
    [FormElementType.TIME_PICKER]: 'Select Time',
    [FormElementType.CHECKBOX]: 'Checkbox',
    [FormElementType.RADIO_GROUP]: 'Radio Group',
    [FormElementType.FILE_UPLOAD]: 'File Upload',
    [FormElementType.SIGNATURE]: 'Signature',
    [FormElementType.EMAIL_VERIFY]: 'Email Verification',
    [FormElementType.RICH_TEXT]: 'Rich Text Editor',
    [FormElementType.ADDRESS]: 'Address',
    [FormElementType.PHONE]: 'Phone Number',
    [FormElementType.SECTION_HEADER]: 'Section Header',
    [FormElementType.DIVIDER]: 'Divider',
  };
  
  return labels[elementType] || 'Form Element';
};

const getDefaultPlaceholder = (elementType: FormElementType): string => {
  const placeholders: Record<FormElementType, string> = {
    [FormElementType.TEXT_INPUT]: 'Enter text...',
    [FormElementType.NUMBER_INPUT]: 'Enter number...',
    [FormElementType.EMAIL_INPUT]: 'Enter email address...',
    [FormElementType.TEXTAREA]: 'Enter detailed text...',
    [FormElementType.PICKLIST]: 'Select an option',
    [FormElementType.MULTI_PICKLIST]: 'Select options',
    [FormElementType.DATE_PICKER]: 'Select date',
    [FormElementType.TIME_PICKER]: 'Select time',
    [FormElementType.PHONE]: 'Enter phone number...',
    [FormElementType.ADDRESS]: 'Enter address...',
    [FormElementType.EMAIL_VERIFY]: 'Enter verification code...',
    [FormElementType.CHECKBOX]: '',
    [FormElementType.RADIO_GROUP]: '',
    [FormElementType.FILE_UPLOAD]: '',
    [FormElementType.SIGNATURE]: '',
    [FormElementType.RICH_TEXT]: 'Enter rich text...',
    [FormElementType.SECTION_HEADER]: 'Section Title',
    [FormElementType.DIVIDER]: '',
  };
  
  return placeholders[elementType] || '';
};

const snapToGrid = (position: Position, gridSize: number): Position => {
  return {
    x: Math.round(position.x / gridSize) * gridSize,
    y: Math.round(position.y / gridSize) * gridSize,
  };
};

export const useFormBuilderStore = create<FormBuilderStore>()(
  persist(
    (set, get) => ({
      // Initial state
      elements: [],
      selectedElementId: null,
      canvasSize: { width: 800, height: 600 },
      gridSize: 20,
      snapToGrid: true,
      zoom: 1,
      history: [],
      historyIndex: -1,

      // Actions
      addElement: (elementType: FormElementType, position: Position) => {
        const id = `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const state = get();
        const finalPosition = state.snapToGrid ? snapToGrid(position, state.gridSize) : position;
        
        const newElement = createDefaultElement(elementType, finalPosition, id);
        
        set((state) => ({
          elements: [...state.elements, newElement],
          selectedElementId: id,
        }));
        
        get().saveToHistory();
        return id;
      },

      updateElement: (elementId: string, updates: Partial<FormElement>) => {
        set((state) => ({
          elements: state.elements.map(element =>
            element.id === elementId
              ? { ...element, ...updates }
              : element
          ),
        }));
        get().saveToHistory();
      },

      removeElement: (elementId: string) => {
        set((state) => ({
          elements: state.elements.filter(element => element.id !== elementId),
          selectedElementId: state.selectedElementId === elementId ? null : state.selectedElementId,
        }));
        get().saveToHistory();
      },

      selectElement: (elementId: string | null) => {
        set({ selectedElementId: elementId });
      },

      moveElement: (elementId: string, position: Position) => {
        const state = get();
        const finalPosition = state.snapToGrid ? snapToGrid(position, state.gridSize) : position;
        
        set((state) => ({
          elements: state.elements.map(element =>
            element.id === elementId
              ? { ...element, position: finalPosition }
              : element
          ),
        }));
      },

      resizeElement: (elementId: string, size: Size) => {
        set((state) => ({
          elements: state.elements.map(element =>
            element.id === elementId
              ? { ...element, size }
              : element
          ),
        }));
        get().saveToHistory();
      },

      duplicateElement: (elementId: string) => {
        const state = get();
        const element = state.elements.find(e => e.id === elementId);
        if (!element) return '';
        
        const newId = `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newPosition = {
          x: element.position.x + 20,
          y: element.position.y + 20,
        };
        
        const duplicatedElement = {
          ...element,
          id: newId,
          position: newPosition,
          label: `${element.label} (Copy)`,
        };
        
        set((state) => ({
          elements: [...state.elements, duplicatedElement],
          selectedElementId: newId,
        }));
        
        get().saveToHistory();
        return newId;
      },

      clearCanvas: () => {
        set({
          elements: [],
          selectedElementId: null,
        });
        get().saveToHistory();
      },

      setCanvasSize: (size: Size) => {
        set({ canvasSize: size });
      },

      setZoom: (zoom: number) => {
        set({ zoom: Math.max(0.1, Math.min(3, zoom)) });
      },

      toggleSnapToGrid: () => {
        set((state) => ({ snapToGrid: !state.snapToGrid }));
      },

      setGridSize: (size: number) => {
        set({ gridSize: Math.max(5, Math.min(50, size)) });
      },

      // History management
      saveToHistory: () => {
        const state = get();
        const currentState: FormBuilderState = {
          elements: state.elements,
          selectedElementId: state.selectedElementId,
          canvasSize: state.canvasSize,
          gridSize: state.gridSize,
          snapToGrid: state.snapToGrid,
          zoom: state.zoom,
        };
        
        const newHistory = state.history.slice(0, state.historyIndex + 1);
        newHistory.push(currentState);
        
        // Limit history to 50 states
        if (newHistory.length > 50) {
          newHistory.shift();
        }
        
        set({
          history: newHistory,
          historyIndex: newHistory.length - 1,
        });
      },

      undo: () => {
        const state = get();
        if (state.historyIndex > 0) {
          const previousState = state.history[state.historyIndex - 1];
          set({
            ...previousState,
            history: state.history,
            historyIndex: state.historyIndex - 1,
          });
        }
      },

      redo: () => {
        const state = get();
        if (state.historyIndex < state.history.length - 1) {
          const nextState = state.history[state.historyIndex + 1];
          set({
            ...nextState,
            history: state.history,
            historyIndex: state.historyIndex + 1,
          });
        }
      },

      canUndo: () => {
        const state = get();
        return state.historyIndex > 0;
      },

      canRedo: () => {
        const state = get();
        return state.historyIndex < state.history.length - 1;
      },
    }),
    {
      name: 'form-builder-storage',
      partialize: (state) => ({
        elements: state.elements,
        canvasSize: state.canvasSize,
        gridSize: state.gridSize,
        snapToGrid: state.snapToGrid,
        zoom: state.zoom,
      }),
    }
  )
);