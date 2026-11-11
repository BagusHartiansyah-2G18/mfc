import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { App } from './App';

if (typeof window !== 'undefined' && !window.ResizeObserver) {
  class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  window.ResizeObserver = ResizeObserver as any;
  (global as any).ResizeObserver = ResizeObserver;
}

describe('CompUI App', () => {
  it('renders overview page by default in standalone mode', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App basePath="" />
      </MemoryRouter>,
    );

    expect(screen.getByTestId('compUI')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Component UI' })).toBeTruthy();
    expect(screen.getByText('Playground komponen @org/ui — contoh pakai nyata.')).toBeTruthy();
    expect(screen.getByText(/Mode Standalone/i)).toBeTruthy();
  });

  it('renders widgets page when route matches widgets', () => {
    render(
      <MemoryRouter initialEntries={['/widgets']}>
        <App basePath="" />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Widgets' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Akun' })).toBeTruthy();
  });

  it('renders forms page when route matches forms', () => {
    render(
      <MemoryRouter initialEntries={['/forms']}>
        <App basePath="" />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: /Forms & Specialized Inputs/i })).toBeTruthy();
    expect(screen.getByText(/InputWithIcon/i)).toBeTruthy();
    expect(screen.getByText(/InputWithBtnPopUp/i)).toBeTruthy();
  });

  it('renders data page with modern DataTable when route matches data', () => {
    render(
      <MemoryRouter initialEntries={['/data']}>
        <App basePath="" />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: /Data & Table Components/i })).toBeTruthy();
    expect(screen.getByText(/Live Preview Komponen/i)).toBeTruthy();
  });

  it('renders without duplicate SubNav in integrated portal mode', () => {
    render(
      <MemoryRouter initialEntries={['/compUI']}>
        <App basePath="/compUI" />
      </MemoryRouter>,
    );

    expect(screen.getByTestId('compUI')).toBeTruthy();
    expect(screen.getByText(/Terintegrasi Portal Host/i)).toBeTruthy();
    // SubNav should not exist
    expect(screen.queryByText(/Sub-feature terintegrasi/i)).toBeNull();
  });
});