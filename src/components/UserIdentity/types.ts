export type UserIdentitySize = 'compact' | 'default' | 'large';

export type RoleTone =
  | 'super-admin'
  | 'admin'
  | 'middle-admin'
  | 'data-admin'
  | 'instructor'
  | 'trainee'
  | 'pending-approval'
  | 'default';

export interface UserIdentityProps {
  name?: string;
  badges?: string[];
  size?: UserIdentitySize;
  /**
   * Either an image URL/path (e.g. starting with "/") to use as the avatar, or a
   * pre-computed initials string. When omitted, initials are derived from `name`.
   */
  avatarValue?: string;
  showAvatar?: boolean;
  enableHoverCard?: boolean;
}
