import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WhatsAppButton } from './WhatsAppButton.js';

describe('WhatsAppButton', () => {
  it('builds a wa.me link with cleaned phone + encoded message', () => {
    render(
      <WhatsAppButton
        phone="+962 79 912 3456"
        message="مرحباً"
        label="Talk on WhatsApp"
        sublabel="Free, in Arabic"
      />,
    );
    const link = screen.getByRole('link', { name: 'Talk on WhatsApp' });
    const href = link.getAttribute('href');
    expect(href).toMatch(/^https:\/\/wa\.me\/962799123456\?text=/);
    expect(href).toMatch(encodeURIComponent('مرحباً'));
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('omits ?text= when no message given', () => {
    render(<WhatsAppButton phone="+4923231234567" label="Chat" />);
    const link = screen.getByRole('link', { name: 'Chat' });
    expect(link.getAttribute('href')).toBe('https://wa.me/4923231234567');
  });

  it('renders the sublabel when provided', () => {
    render(
      <WhatsAppButton phone="+1234567" label="WA" sublabel="No app needed" />,
    );
    expect(screen.getByText('No app needed')).toBeInTheDocument();
  });
});
