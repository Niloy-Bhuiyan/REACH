type ClassValue = string | number | false | null | undefined | ClassValue[];

/** Small class joiner. No `clsx` dependency for something this size. */
export function cn(...parts: ClassValue[]): string {
  const out: string[] = [];
  const walk = (value: ClassValue) => {
    if (!value) return;
    if (Array.isArray(value)) value.forEach(walk);
    else out.push(String(value));
  };
  parts.forEach(walk);
  return out.join(" ");
}
