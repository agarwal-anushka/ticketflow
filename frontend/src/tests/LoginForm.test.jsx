import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, test, expect, vi } from 'vitest';
import LoginForm from '../components/auth/LoginForm';
import * as AuthContext from '../context/AuthContext';

describe('LoginForm', () => {
  test('renders email and password fields', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      login: vi.fn(),
      loading: false,
      error: null,
    });

    render(
      <MemoryRouter>
        <LoginForm />
      </MemoryRouter>
    );

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  test('calls login with entered credentials on submit', async () => {
    const mockLogin = vi.fn().mockResolvedValue({});
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      login: mockLogin,
      loading: false,
      error: null,
    });

    render(
      <MemoryRouter>
        <LoginForm />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'secret123' } });
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('a@b.com', 'secret123');
    });
  });

  test('displays an error message when login fails', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      login: vi.fn(),
      loading: false,
      error: 'Invalid email or password',
    });

    render(
      <MemoryRouter>
        <LoginForm />
      </MemoryRouter>
    );

    expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
  });
});
