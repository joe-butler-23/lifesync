import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Sidebar from './Sidebar';

// Helper to render with required props
const setup = (props = {}) => {
  const defaultProps = {
    activeView: 'dashboard',
    setActiveView: jest.fn(),
    isCollapsed: false,
    setIsCollapsed: jest.fn()
  };
  return render(<Sidebar {...defaultProps} {...props} />);
};

test('shows heading when expanded and triggers menu click', () => {
  const setActiveView = jest.fn();
  setup({ setActiveView });
  expect(screen.getByText(/Life Dashboard/i)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /Tasks/i }));
  expect(setActiveView).toHaveBeenCalledWith('tasks');
});

test('hides heading when collapsed', () => {
  setup({ isCollapsed: true });
  expect(screen.queryByText(/Life Dashboard/i)).toBeNull();
});
