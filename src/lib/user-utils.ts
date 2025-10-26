/**
 * User Utility Functions
 * Helper functions for user-related operations
 */

/**
 * Format full name from titlePrefix, firstName, and lastName
 * Title prefix is attached to firstName without space (Thai convention)
 *
 * @example
 * formatFullName("นาย", "สมชาย", "ใจดี") // "นายสมชาย ใจดี"
 * formatFullName(null, "สมชาย", "ใจดี") // "สมชาย ใจดี"
 * formatFullName("ดร.", "John", "Doe") // "ดร.John Doe"
 */
export function formatFullName(
  titlePrefix: string | null | undefined,
  firstName: string,
  lastName: string
): string {
  if (!firstName || !lastName) {
    throw new Error('firstName and lastName are required');
  }

  if (titlePrefix && titlePrefix.trim()) {
    return `${titlePrefix.trim()}${firstName.trim()} ${lastName.trim()}`;
  }

  return `${firstName.trim()} ${lastName.trim()}`;
}

/**
 * Validate Thai title prefix
 * Returns true if the title is a recognized Thai prefix
 */
export function isValidTitlePrefix(title: string | null | undefined): boolean {
  if (!title) return false;

  const validPrefixes = [
    // Royal & Noble
    'ฯพณฯ', 'พระ', 'สมเด็จพระ',

    // Military
    'พล.อ.', 'พล.ต.', 'พล.ท.', 'พล.ร.อ.', 'พล.ร.ต.', 'พล.ร.ท.',
    'พ.อ.', 'พ.ต.', 'พ.ท.',
    'ร.อ.', 'ร.ต.', 'ร.ท.',
    'น.อ.', 'น.ต.', 'น.ท.',
    'ร.ต.อ.', 'ร.ต.ต.', 'ร.ต.ท.',
    'จ.ส.อ.', 'จ.ส.ต.', 'จ.ส.ท.',

    // Academic
    'ศ.ดร.', 'รศ.ดร.', 'ผศ.ดร.',
    'ศ.', 'รศ.', 'ผศ.',
    'ดร.', 'นพ.', 'พญ.', 'ทพ.', 'ทพญ.',

    // Common
    'นาย', 'นาง', 'นางสาว', 'เด็กชาย', 'เด็กหญิง',

    // English
    'Mr.', 'Mrs.', 'Miss', 'Ms.', 'Dr.', 'Prof.',
  ];

  return validPrefixes.includes(title.trim());
}

/**
 * Get common title prefixes for dropdown
 */
export function getCommonTitlePrefixes(): { value: string; label: string }[] {
  return [
    { value: 'นาย', label: 'นาย' },
    { value: 'นาง', label: 'นาง' },
    { value: 'นางสาว', label: 'นางสาว' },
    { value: 'ดร.', label: 'ดร.' },
    { value: 'นพ.', label: 'นพ.' },
    { value: 'พญ.', label: 'พญ.' },
    { value: 'ทพ.', label: 'ทพ.' },
    { value: 'ทพญ.', label: 'ทพญ.' },
    { value: 'ศ.ดร.', label: 'ศ.ดร.' },
    { value: 'รศ.ดร.', label: 'รศ.ดร.' },
    { value: 'ผศ.ดร.', label: 'ผศ.ดร.' },
    { value: 'ศ.', label: 'ศ.' },
    { value: 'รศ.', label: 'รศ.' },
    { value: 'ผศ.', label: 'ผศ.' },
  ];
}
