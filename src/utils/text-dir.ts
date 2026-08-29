/**
 * Direction for editable fields.
 *
 * `dir="auto"` looks at the value, not the placeholder, so an empty field is
 * treated as LTR even when the UI language is Arabic. Inherit the document
 * direction while empty; use `auto` once there is text so mixed scripts still
 * look right.
 */
export function resolveEditableDir(
  isEmpty: boolean,
  dir?: string,
): 'ltr' | 'rtl' | 'auto' | undefined {
  if (dir === 'ltr' || dir === 'rtl') return dir
  if (isEmpty) return undefined
  return 'auto'
}
