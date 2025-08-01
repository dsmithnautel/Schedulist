
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import List from '../../components/List';

describe('List Component', () => {
    it('shows login message when user is not logged in', () => {
        render(<List events={[]} setEvents={() => {}} />);
        expect(screen.getByText(/please log in to view your todo list/i)).toBeInTheDocument();
    });

    it('shows empty list message when there are no events', () => {
        const user = { _id: '123' };
        render(<List user={user} events={[]} setEvents={() => {}} />);
        expect(screen.getByText(/nothing to do!/i)).toBeInTheDocument();
    });
});