import React from 'react';

export const focusCell = (rowIndex: number, colIndex: number) => {
  const el = document.querySelector(`input[data-row="${rowIndex}"][data-col="${colIndex}"]`) as HTMLInputElement | null;
  if (el) {
    el.focus();
    setTimeout(() => {
      el.select();
    }, 10);
  }
};

export const handleGridKeyDown = (
  e: React.KeyboardEvent<HTMLInputElement>,
  rowIndex: number,
  colIndex: number,
  totalRows: number,
  maxCols: number,
  addRow: () => void
) => {
  if (e.key === 'ArrowRight' || e.key === 'Enter') {
    e.preventDefault();
    if (colIndex < maxCols) {
      focusCell(rowIndex, colIndex + 1);
    } else {
      if (rowIndex + 1 >= totalRows) {
        addRow();
      }
      setTimeout(() => {
        focusCell(rowIndex + 1, 1);
      }, 50);
    }
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault();
    if (colIndex > 1) {
      focusCell(rowIndex, colIndex - 1);
    } else if (rowIndex > 0) {
      focusCell(rowIndex - 1, maxCols);
    }
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (rowIndex + 1 < totalRows) {
      focusCell(rowIndex + 1, colIndex);
    }
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (rowIndex > 0) {
      focusCell(rowIndex - 1, colIndex);
    }
  }
};
