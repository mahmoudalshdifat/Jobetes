import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { App } from './App.js';
import { i18n } from './i18n.js';

describe('App', () => {
  it('renders brand and emergency banner', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <App />
      </I18nextProvider>,
    );
    expect(screen.getAllByText(/جوبيتس|Jobetes/iu).length).toBeGreaterThan(0);
    expect(
      screen.getByText(/911|112|Notfall|emergency|طوارئ/iu),
    ).toBeInTheDocument();
  });
});
