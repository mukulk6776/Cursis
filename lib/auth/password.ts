export function passwordValidationError(password: string): string | null {
  if (password.length < 8) return 'Password must be at least 8 characters long';
  if (password.length > 128) return 'Password must not exceed 128 characters';
  const commonPasswords = [
    'password', 'password123', 'admin123', '12345678', '123456789', '1234567890',
    'qwerty123', 'welcome123', 'cursis123', 'letmein123', 'iloveyou123',
    'p@ssword1', 'p@ssword123', 'password@1', 'password@123', 'admin123456',
    'admin@123', 'admin@1234', 'cursis@123', 'cursis@2026', 'pass@1234',
  ];
  if (commonPasswords.includes(password.toLowerCase())) {
    return 'Password is too common or appears on breached password lists. Please choose a more secure password.';
  }
  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password) || !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password)) {
    return 'Password must include uppercase, lowercase, number, and special character (!@#$%^&* etc.)';
  }
  return null;
}
