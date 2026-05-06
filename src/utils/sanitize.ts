import DOMPurify from 'dompurify'

/**
 * Sanitizes a string that will be rendered as HTML (dangerouslySetInnerHTML).
 * Never render user-supplied or external content as HTML without calling this first.
 *
 * Usage:
 *   <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(userContent) }} />
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'strong', 'i', 'em', 'u', 'br', 'p', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: [],
  })
}

/**
 * Strips ALL HTML — use for plain text contexts (input values, attributes, etc.)
 */
export function sanitizeText(dirty: string): string {
  return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })
}
