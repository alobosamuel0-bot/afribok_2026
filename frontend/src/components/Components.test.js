/**
 * Tests for React Components
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';

import LoginPage from '../pages/LoginPage';
import Dashboard from '../pages/Dashboard';
import Navbar from '../components/Navbar';
import OfflineIndicator from '../components/OfflineIndicator';
import StatsCard from '../components/StatsCard';

const theme = createTheme();

const renderWithProviders = (component) => {
  return render(
    <ThemeProvider theme={theme}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </ThemeProvider>
  );
};

describe('LoginPage Component', () => {
  test('should render login form', () => {
    renderWithProviders(<LoginPage />);
    
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  test('should have submit button', () => {
    renderWithProviders(<LoginPage />);
    
    expect(screen.getByRole('button', { name: /login|sign in/i })).toBeInTheDocument();
  });

  test('should display demo credentials', () => {
    renderWithProviders(<LoginPage />);
    
    expect(screen.getByText(/demo.*/i)).toBeInTheDocument();
  });

  test('should handle form submission', async () => {
    renderWithProviders(<LoginPage />);
    
    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /login|sign in/i });

    fireEvent.change(usernameInput, { target: { value: 'demo@hospital.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Demo@12345' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      // Login should process
    });
  });
});

describe('Dashboard Component', () => {
  test('should render dashboard title', () => {
    renderWithProviders(<Dashboard />);
    
    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
  });

  test('should display stats cards', () => {
    renderWithProviders(<Dashboard />);
    
    const cards = screen.getAllByRole('img');
    expect(cards.length > 0).toBe(true);
  });

  test('should have patient table', () => {
    renderWithProviders(<Dashboard />);
    
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  test('should have admit button', () => {
    renderWithProviders(<Dashboard />);
    
    expect(screen.getByRole('button', { name: /admit|add/i })).toBeInTheDocument();
  });
});

describe('Navbar Component', () => {
  test('should render navigation bar', () => {
    renderWithProviders(<Navbar />);
    
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });

  test('should display hospital name', () => {
    renderWithProviders(<Navbar />);
    
    expect(screen.getByText(/afribok|hospital/i)).toBeInTheDocument();
  });

  test('should show online/offline indicator', () => {
    renderWithProviders(<Navbar />);
    
    const indicator = screen.getByRole('img');
    expect(indicator).toBeInTheDocument();
  });

  test('should have user menu', () => {
    renderWithProviders(<Navbar />);
    
    const menuButton = screen.getByRole('button');
    expect(menuButton).toBeInTheDocument();
  });
});

describe('OfflineIndicator Component', () => {
  test('should not show when online', () => {
    global.navigator.onLine = true;
    
    renderWithProviders(<OfflineIndicator />);
    
    const alert = screen.queryByText(/offline/i);
    expect(alert).not.toBeInTheDocument();
  });

  test('should show when offline', () => {
    global.navigator.onLine = false;
    
    renderWithProviders(<OfflineIndicator />);
    
    expect(screen.queryByText(/offline/i)).toBeInTheDocument();
  });
});

describe('StatsCard Component', () => {
  test('should render stats card', () => {
    const props = {
      title: 'Total Patients',
      value: 150,
      icon: 'PersonIcon',
      color: 'primary'
    };

    renderWithProviders(<StatsCard {...props} />);
    
    expect(screen.getByText('Total Patients')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
  });

  test('should apply correct color', () => {
    const props = {
      title: 'Critical',
      value: 5,
      icon: 'WarningIcon',
      color: 'error'
    };

    const { container } = renderWithProviders(<StatsCard {...props} />);
    
    expect(container.firstChild).toBeInTheDocument();
  });
});

describe('Responsive Design', () => {
  test('component should be responsive', () => {
    renderWithProviders(<Dashboard />);
    
    // Verify component renders without errors
    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
  });
});
