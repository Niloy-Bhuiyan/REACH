/**
 * Five destinations, permanently. A new capability joins an existing one or becomes
 * contextual. Jobs and Internships are Discover filter values; Resources live inside
 * Roadmap; the assistant is a URL parameter, never a nav item.
 *
 * The nav is where terminology is enforced, so these labels are the canonical terms.
 */
export const NAV_ITEMS = [
  { href: "/", label: "Focus", glyph: "g-nav-focus", icon: "focus" as const, match: ["/"] },
  {
    href: "/discover",
    label: "Discover",
    glyph: "g-nav-discover", icon: "discover" as const,
    match: ["/discover", "/jobs", "/one-fix"],
  },
  { href: "/roadmap", label: "Roadmap", glyph: "g-nav-roadmap", icon: "roadmap" as const, match: ["/roadmap"] },
  { href: "/resume", label: "Resume", glyph: "g-nav-resume", icon: "resume" as const, match: ["/resume"] },
  { href: "/profile", label: "Profile", glyph: "g-nav-profile", icon: "profile" as const, match: ["/profile"] },
] as const;

export function isActive(pathname: string, match: readonly string[]): boolean {
  return match.some((prefix) =>
    prefix === "/" ? pathname === "/" : pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
