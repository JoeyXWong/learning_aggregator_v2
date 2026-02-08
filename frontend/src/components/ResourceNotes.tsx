import { useState, useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { progressApi } from '../services/progress';

interface ResourceNotesProps {
  planId: string;
  resourceId: string;
  resourceTitle: string;
  initialNotes: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const MAX_NOTES_LENGTH = 2000;

export function ResourceNotes({
  planId,
  resourceId,
  resourceTitle,
  initialNotes,
  isOpen,
  onClose,
}: ResourceNotesProps) {
  const [notes, setNotes] = useState(initialNotes || '');
  const queryClient = useQueryClient();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setNotes(initialNotes || '');
  }, [initialNotes, isOpen]);

  // Focus trap and escape key handling
  useEffect(() => {
    if (!isOpen) return;

    // Focus the textarea when modal opens
    textareaRef.current?.focus();

    // Handle escape key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    // Lock body scroll
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const saveMutation = useMutation({
    mutationFn: (notesText: string) =>
      progressApi.updateProgress(planId, resourceId, { notes: notesText }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progress', planId] });
      onClose();
    },
  });

  const handleSave = () => {
    if (notes.length > MAX_NOTES_LENGTH) {
      return;
    }
    saveMutation.mutate(notes);
  };

  const handleClose = () => {
    setNotes(initialNotes || '');
    onClose();
  };

  if (!isOpen) return null;

  const remainingChars = MAX_NOTES_LENGTH - notes.length;
  const isOverLimit = remainingChars < 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 id="modal-title" className="text-xl font-semibold text-gray-900">
                Resource Notes
              </h2>
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {resourceTitle}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4 flex-1 overflow-y-auto">
          <textarea
            ref={textareaRef}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes about this resource (optional)..."
            aria-label="Resource notes"
            className={`w-full h-64 px-3 py-2 border rounded-lg resize-none focus:outline-none focus:ring-2 transition-colors ${
              isOverLimit
                ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
            }`}
            maxLength={MAX_NOTES_LENGTH + 100} // Allow typing beyond to show error
          />
          <div className="mt-2 flex items-center justify-between">
            <p className="text-xs text-gray-500">
              Notes are private and only visible to you
            </p>
            <p
              className={`text-sm font-medium ${
                isOverLimit
                  ? 'text-red-600'
                  : remainingChars < 100
                  ? 'text-yellow-600'
                  : 'text-gray-600'
              }`}
            >
              {remainingChars} characters remaining
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
          <button
            onClick={handleClose}
            disabled={saveMutation.isPending}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saveMutation.isPending || isOverLimit}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saveMutation.isPending ? 'Saving...' : 'Save Notes'}
          </button>
        </div>
      </div>
    </div>
  );
}
