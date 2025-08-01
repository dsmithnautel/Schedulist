import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import List from '../../components/List';

describe('List Component', () => {
    it('shows login message when user is not logged in', () => {
        render(<List events={[]} setEvents={vi.fn()} />);
        expect(screen.getByText(/please log in to view your todo list/i)).toBeInTheDocument();
    });

    it('shows empty list message when logged in but no events', () => {
        const user = { _id: '123' };
        render(<List user={user} events={[]} setEvents={vi.fn()} />);
        expect(screen.getByText(/nothing to do!/i)).toBeInTheDocument();
    });

    it('renders events when provided', () => {
        const mockEvents = [
            { id: '1', title: 'Test Event 1', date: '2025-08-01T10:00:00' },
            { id: '2', title: 'Test Event 2', date: '2025-08-02T11:00:00' }
        ];
        const user = { _id: '123' };

        render(<List user={user} events={mockEvents} setEvents={vi.fn()} />);

        expect(screen.getByText('Test Event 1')).toBeInTheDocument();
        expect(screen.getByText('Test Event 2')).toBeInTheDocument();
    });

    it('calls setEvents when creating new event', async () => {
        const user = { _id: '123' };
        const mockSetEvents = vi.fn();

        render(<List user={user} events={[]} setEvents={mockSetEvents} />);

        const createButton = screen.getByText('+ Create Event');
        fireEvent.click(createButton);

        expect(screen.getByText(/create event/i)).toBeInTheDocument();
    });
});