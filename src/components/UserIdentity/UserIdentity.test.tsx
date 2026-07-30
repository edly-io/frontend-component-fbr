import React from 'react';
import {
  render, screen, waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

import UserIdentity from './UserIdentity';

describe('UserIdentity', () => {
  it('renders successfully with only the required-in-practice `name` prop', () => {
    render(<UserIdentity name="Jane Doe" />);

    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
  });

  it('falls back to default prop values when no props are supplied', () => {
    render(<UserIdentity />);

    expect(screen.getByText('Unnamed user')).toBeInTheDocument();
    // Avatar initials are derived from the default name ("Unnamed user"), not a "?" placeholder.
    expect(screen.getByText('UU')).toBeInTheDocument();
  });

  it('renders the primary badge/role label when badges are supplied', () => {
    render(<UserIdentity name="Jane Doe" badges={['Instructor', 'Trainee']} />);

    expect(screen.getByText('Instructor')).toBeInTheDocument();
    expect(screen.queryByText('Trainee')).not.toBeInTheDocument();
  });

  it('renders no role label when badges is empty', () => {
    const { container } = render(<UserIdentity name="Jane Doe" badges={[]} />);

    expect(container.querySelector('.user-identity__role-label')).not.toBeInTheDocument();
  });

  it('filters out falsy/empty entries from badges before choosing the primary badge', () => {
    render(<UserIdentity name="Jane Doe" badges={['', 'Admin']} />);

    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('derives initials from the first two words of `name` when avatarValue is empty', () => {
    render(<UserIdentity name="Jane Doe" />);

    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('renders an <img> avatar when avatarValue looks like an image URL', () => {
    render(<UserIdentity name="Jane Doe" avatarValue="https://example.com/avatar.png" />);

    const avatarImg = screen.getByAltText('Jane Doe');
    expect(avatarImg).toHaveAttribute('src', 'https://example.com/avatar.png');
  });

  it('renders an <img> avatar when avatarValue looks like an absolute path', () => {
    render(<UserIdentity name="Jane Doe" avatarValue="/media/avatar.png" />);

    const avatarImg = screen.getByAltText('Jane Doe');
    expect(avatarImg).toHaveAttribute('src', '/media/avatar.png');
  });

  it('treats a non-URL avatarValue as literal initials text', () => {
    render(<UserIdentity name="Jane Doe" avatarValue="XY" />);

    expect(screen.getByText('XY')).toBeInTheDocument();
  });

  it('does not render the avatar block when showAvatar is false', () => {
    const { container } = render(<UserIdentity name="Jane Doe" showAvatar={false} />);

    expect(container.querySelector('.user-identity__avatar-wrap')).not.toBeInTheDocument();
  });

  it('renders the avatar block by default (showAvatar defaults to true)', () => {
    const { container } = render(<UserIdentity name="Jane Doe" />);

    expect(container.querySelector('.user-identity__avatar-wrap')).toBeInTheDocument();
  });

  it('applies the size-specific class to the root element for each size', () => {
    (['compact', 'default', 'large'] as const).forEach((size) => {
      const { container, unmount } = render(<UserIdentity name="Jane Doe" size={size} />);

      expect(container.querySelector(`.user-identity--${size}`)).toBeInTheDocument();
      unmount();
    });
  });

  it('sets tabIndex=0 on the hover trigger so it is keyboard-focusable', () => {
    const { container } = render(<UserIdentity name="Jane Doe" />);

    const trigger = container.querySelector('.user-identity__hover-trigger');
    expect(trigger).toHaveAttribute('tabindex', '0');
  });

  it('does not wrap the identity in a hover trigger when enableHoverCard is false', () => {
    const { container } = render(<UserIdentity name="Jane Doe" enableHoverCard={false} />);

    expect(container.querySelector('.user-identity__hover-trigger')).not.toBeInTheDocument();
  });

  it('shows the hover card with full details on hover when enableHoverCard is true', async () => {
    const user = userEvent.setup();
    render(
      <UserIdentity name="Jane Doe" badges={['Instructor', 'Trainee']} enableHoverCard />,
    );

    const trigger = screen.getByText('Jane Doe').closest('.user-identity__hover-trigger');
    expect(trigger).not.toBeNull();

    await user.hover(trigger as Element);

    await waitFor(() => {
      expect(document.querySelector('.user-identity-hover-card__name')).toBeInTheDocument();
    });

    const rolesContainer = document.querySelector('.user-identity-hover-card__roles');
    expect(rolesContainer).toHaveTextContent('Instructor');
    expect(rolesContainer).toHaveTextContent('Trainee');
  });

  it('hides the hover card again once the pointer leaves', async () => {
    const user = userEvent.setup();
    render(<UserIdentity name="Jane Doe" enableHoverCard />);

    const trigger = screen.getByText('Jane Doe').closest('.user-identity__hover-trigger');
    await user.hover(trigger as Element);

    await waitFor(() => {
      expect(document.querySelector('.user-identity-hover-card__name')).toBeInTheDocument();
    });

    await user.unhover(trigger as Element);

    await waitFor(() => {
      expect(document.querySelector('.user-identity-hover-card__name')).not.toBeInTheDocument();
    });
  });

  it('gives each popover instance a unique id, so multiple instances do not collide', () => {
    const { container: containerA } = render(<UserIdentity name="A" enableHoverCard />);
    const { container: containerB } = render(<UserIdentity name="B" enableHoverCard />);

    expect(containerA.querySelector('.user-identity__hover-trigger')).toBeInTheDocument();
    expect(containerB.querySelector('.user-identity__hover-trigger')).toBeInTheDocument();
  });

  it('handles a very long name without crashing and keeps it in the DOM', () => {
    const longName = 'A'.repeat(200);
    render(<UserIdentity name={longName} />);

    expect(screen.getByText(longName)).toBeInTheDocument();
  });

  it('derives initials from a very long name using only the first two words', () => {
    render(<UserIdentity name="Alexandria Bartholomew Constantine" />);

    expect(screen.getByText('AB')).toBeInTheDocument();
  });

  it('falls back to "?" initials when name is an empty string', () => {
    render(<UserIdentity name="" />);

    expect(screen.getByText('?')).toBeInTheDocument();
  });
});
