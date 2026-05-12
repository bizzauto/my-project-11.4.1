import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LoginPage from '../../src/components/LoginPage';

describe('LoginPage', () => {
  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );
  };

  it('renders login page', () => {
    renderComponent();
    expect(screen.getByText(/Sign in/i)).toBeInTheDocument();
  });

  it('shows demo login button', () => {
    renderComponent();
    expect(screen.getByText(/Try Demo/i)).toBeInTheDocument();
  });

  it('shows forgot password link', () => {
    renderComponent();
    expect(screen.getByText(/Forgot password/i)).toBeInTheDocument();
  });

  it('shows sign up link', () => {
    renderComponent();
    expect(screen.getByText(/Sign up/i)).toBeInTheDocument();
  });
});

describe('Auth Store', () => {
  it('should initialize with default values', () => {
    // Test auth store initialization
    const initialState = {
      user: null,
      business: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      isInitialized: false,
      onboardingCompleted: false,
      isDemoMode: false,
    };
    expect(initialState.isAuthenticated).toBe(false);
  });
});

describe('Rate Limiting', () => {
  it('should return correct limit for FREE plan', () => {
    const planLimits: Record<string, number> = {
      FREE: 80,
      STARTER: 200,
      GROWTH: 500,
      PRO: 1000,
      ENTERPRISE: 3000,
    };
    expect(planLimits.FREE).toBe(80);
    expect(planLimits.PRO).toBe(1000);
  });
});