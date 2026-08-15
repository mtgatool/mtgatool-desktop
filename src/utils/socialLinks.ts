/**
 * Social links on a public profile.
 *
 * These are user-supplied strings that end up as `href`s on a page other
 * people load, so nothing is stored as typed. Every value is matched against
 * the one pattern its platform allows and then *rebuilt* from the captured
 * handle — the stored string is ours, not the visitor's. A link that does not
 * match is rejected outright rather than sanitized into something adjacent.
 *
 * The same patterns are enforced again by a CHECK constraint on the column, so
 * a value that never went through this module still cannot land in the table.
 */

export type SocialPlatform = "twitch" | "youtube" | "instagram";

export const SOCIAL_PLATFORMS: SocialPlatform[] = [
  "twitch",
  "youtube",
  "instagram",
];

export interface SocialLink {
  platform: SocialPlatform;
  /** Canonical URL, rebuilt from the handle. */
  url: string;
  /** What the profile shows instead of the URL. */
  name: string;
}

/** Stored shape: platform -> canonical URL. */
export type SocialLinks = Partial<Record<SocialPlatform, string>>;

interface PlatformSpec {
  label: string;
  /**
   * Matches a bare handle or a full link, and captures the handle. Anchored at
   * both ends: without that, `evil.com/twitch.tv/name` would match on the tail
   * and we would rebuild a link to a host we never checked.
   */
  pattern: RegExp;
  /** The URL we store, built from the captured handle. */
  build: (handle: string) => string;
  /** What to show as the link's text. */
  display: (handle: string) => string;
  /** Shown under the input as a hint. */
  example: string;
}

const SPECS: Record<SocialPlatform, PlatformSpec> = {
  twitch: {
    label: "Twitch",
    pattern:
      /^(?:(?:https?:\/\/)?(?:www\.)?twitch\.tv\/)?@?([A-Za-z0-9_]{3,25})\/?$/i,
    build: (h) => `https://www.twitch.tv/${h}`,
    display: (h) => h,
    example: "twitch.tv/yourname",
  },
  youtube: {
    // Four shapes are in the wild and all of them are canonical to YouTube:
    // the modern @handle, the immutable /channel/UC… id, and the legacy /c/
    // and /user/ vanity paths. A bare word is read as an @handle.
    label: "YouTube",
    pattern:
      /^(?:(?:https?:\/\/)?(?:www\.)?youtube\.com\/)?(@[A-Za-z0-9._-]{3,30}|channel\/UC[A-Za-z0-9_-]{22}|c\/[A-Za-z0-9._-]{1,80}|user\/[A-Za-z0-9._-]{1,80}|[A-Za-z0-9._-]{3,30})\/?$/i,
    build: (h) => `https://www.youtube.com/${h}`,
    display: (h) => {
      if (h.startsWith("@")) return h;
      if (h.startsWith("c/") || h.startsWith("user/")) return h.split("/")[1];
      // A raw channel id names nothing a person would recognize, and the name
      // behind it is only knowable through the API. The platform stands in.
      return "YouTube";
    },
    example: "youtube.com/@yourname",
  },
  instagram: {
    label: "Instagram",
    pattern:
      /^(?:(?:https?:\/\/)?(?:www\.)?instagram\.com\/)?@?([A-Za-z0-9._]{1,30})\/?$/i,
    build: (h) => `https://www.instagram.com/${h}`,
    display: (h) => h,
    example: "instagram.com/yourname",
  },
};

export function socialLabel(platform: SocialPlatform): string {
  return SPECS[platform].label;
}

export function socialExample(platform: SocialPlatform): string {
  return SPECS[platform].example;
}

/**
 * Validate one input and return the link to store, or null if it cannot be
 * read as a profile on that platform. An empty input is "cleared", also null —
 * callers tell the two apart by whether the input was blank.
 */
export function parseSocialLink(
  platform: SocialPlatform,
  input: string
): SocialLink | null {
  const spec = SPECS[platform];
  // Query strings and fragments carry tracking, not identity; a link pasted
  // from a share sheet is otherwise perfectly valid.
  const trimmed = (input || "").trim().split(/[?#]/)[0].trim();
  if (!trimmed) return null;

  const match = spec.pattern.exec(trimmed);
  if (!match) return null;

  let handle = match[1];
  // A bare word on YouTube means the @handle form; the pattern accepts it
  // without the sigil so people can type just their name.
  if (
    platform === "youtube" &&
    !handle.startsWith("@") &&
    !handle.includes("/")
  )
    handle = `@${handle}`;

  return {
    platform,
    url: spec.build(handle),
    name: spec.display(handle),
  };
}

/**
 * Read a stored `socials` object into renderable links.
 *
 * Values are re-validated on the way out, not trusted because they were
 * trusted once: the column predates any given version of this code, and a row
 * written by an older client (or by hand) still has to clear the same bar
 * before it becomes an href.
 */
export function readSocialLinks(
  socials: SocialLinks | null | undefined
): SocialLink[] {
  if (!socials) return [];
  return SOCIAL_PLATFORMS.map((platform) => {
    const raw = socials[platform];
    return raw ? parseSocialLink(platform, raw) : null;
  }).filter((l): l is SocialLink => !!l);
}
