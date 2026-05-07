import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Dialog } from './Dialog.js';

describe('Dialog', () => {
  it('renders nothing when closed', () => {
    const { container } = render(<Dialog open={false} onClose={vi.fn()} title="Test" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders title, description, and children when open', () => {
    render(
      <Dialog open onClose={vi.fn()} title="Dialog Title" description="Dialog description">
        <p>Content</p>
      </Dialog>,
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Dialog Title')).toBeInTheDocument();
    expect(screen.getByText('Dialog description')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<Dialog open onClose={onClose} title="Test" />);
    fireEvent.click(screen.getByLabelText('Close dialog'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn();
    const { container } = render(<Dialog open onClose={onClose} title="Test" />);
    const backdrop = container.querySelector('[role="presentation"]');
    if (backdrop) fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose when persistent and backdrop is clicked', () => {
    const onClose = vi.fn();
    const { container } = render(<Dialog open onClose={onClose} title="Test" persistent />);
    const backdrop = container.querySelector('[role="presentation"]');
    if (backdrop) fireEvent.click(backdrop);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('does not show close button when persistent', () => {
    render(<Dialog open onClose={vi.fn()} title="Test" persistent />);
    expect(screen.queryByLabelText('Close dialog')).not.toBeInTheDocument();
  });

  it('renders footer when provided', () => {
    render(
      <Dialog open onClose={vi.fn()} title="Test" footer={<button>Action</button>}>
        Content
      </Dialog>,
    );
    expect(screen.getByText('Action')).toBeInTheDocument();
  });
});
