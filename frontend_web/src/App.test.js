import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

describe('LandingPage integration', () => {
  test('LandingPage is shown on initial load and hides after Start Cooking is pressed', () => {
    // Force sessionStorage to simulate fresh visit (no "started" key)
    window.sessionStorage.removeItem('started');
    render(<App />);

    // Landing should be visible
    expect(screen.getByText(/Welcome to/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Start Cooking/i })).toBeInTheDocument();

    // Simulate Start Cooking click
    fireEvent.click(screen.getByRole('button', { name: /Start Cooking/i }));

    // Now, the app main interface should be shown (header, ingredient input, etc.)
    expect(screen.getByText(/Enter Your Ingredients/i)).toBeInTheDocument();
    // LandingPage elements should be gone
    expect(screen.queryByText(/Welcome to/i)).not.toBeInTheDocument();
  });
});
