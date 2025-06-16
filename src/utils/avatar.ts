import { createAvatar } from '@dicebear/core';
import { funEmoji } from '@dicebear/collection';

type AvatarOptions = {
  /**
   * The name or text used to generate the avatar
   * @default 'User'
   */
  name?: string;
  
  /**
   * Size of the avatar in pixels
   * @default 64
   */
  size?: number;
  
  /**
   * Background color in hex format (without #)
   * @default '6C63FF' (purple)
   */
  backgroundColor?: string;
  
  /**
   * Text color in hex format (without #)
   * @default 'FFFFFF' (white)
   */
  textColor?: string;
};

/**
 * Generates an SVG avatar URL using DiceBear's initials generator
 * @param options Avatar generation options
 * @returns SVG data URL of the generated avatar
 */
export function generateAvatar(options: AvatarOptions = {}): string {
  const {
    name = 'User',
    size = 64,
    backgroundColor = 'rgb(195, 248, 92)',
    textColor = 'FFFFFF',
  } = options;

  // Create avatar with initials
  const avatar = createAvatar(funEmoji, {
    size,
    seed: name,
    radius: 999, // Makes it a circle
  });

  return avatar.toDataUri();
}

/**
 * Extracts initials from a name
 * @param name Full name to extract initials from
 * @returns Uppercased initials (1-2 characters)
 */
export function getInitials(name: string): string {
  if (!name) return 'U';
  
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  
  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
}
