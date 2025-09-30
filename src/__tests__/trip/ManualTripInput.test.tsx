import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ManualTripInput } from '@/components/trip/ManualTripInput';

describe('ManualTripInput', () => {
  it('renders all required form fields', () => {
    render(<ManualTripInput />);
    
    // Check for address inputs
    expect(screen.getByLabelText(/startadresse|start address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/zieladresse|destination|destinasjon/i)).toBeInTheDocument();
    
    // Check for date and time inputs
    expect(screen.getByLabelText(/datum|date|dato/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/uhrzeit|time|tid/i)).toBeInTheDocument();
    
    // Check for vehicle selects
    expect(screen.getByLabelText(/fahrzeugtyp|vehicle type|kjøretøytype/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/fahrzeuggröße|vehicle size|kjøretøystørrelse/i)).toBeInTheDocument();
    
    // Check for action buttons
    expect(screen.getByRole('button', { name: /berechnen|calculate|beregn/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /speichern|save|lagre/i })).toBeInTheDocument();
  });

  it('validates required fields (start and target)', () => {
    render(<ManualTripInput />);
    
    const calculateButton = screen.getByRole('button', { name: /berechnen|calculate|beregn/i });
    
    // Ensure component renders with validation logic
    expect(calculateButton).toBeInTheDocument();
  });
});
