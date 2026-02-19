import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UpgradeAccountPanel } from './UpgradeAccountPanel';

describe('UpgradeAccountPanel', () => {
  it('renders email input and send-link button', () => {
    render(<UpgradeAccountPanel onSent={() => {}} />);
    expect(screen.getByPlaceholderText(/email/i)).not.toBeNull();
    expect(screen.getByRole('button', { name: /send magic link/i })).not.toBeNull();
  });
});
