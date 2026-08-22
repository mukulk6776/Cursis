/**
 * Utility to format Firebase Authentication errors into user-friendly messages.
 */

export function formatAuthError(error: unknown): string {
  if (!error) return "An unexpected error occurred. Please try again.";

  if (typeof error === "string") {
    return parseErrorMessage(error);
  }

  if (error instanceof Error) {
    // Check error code or message
    const firebaseErrorCode = (error as { code?: string }).code;
    if (firebaseErrorCode) {
      const formatted = mapAuthErrorCode(firebaseErrorCode);
      if (formatted) return formatted;
    }
    return parseErrorMessage(error.message);
  }

  return "An unexpected error occurred. Please try again.";
}

function parseErrorMessage(message: string): string {
  // Extract error code from messages like "Firebase: Error (auth/configuration-not-found)."
  const match = message.match(/\(auth\/([a-zA-Z0-9-]+)\)/);
  if (match && match[1]) {
    const code = `auth/${match[1]}`;
    const mapped = mapAuthErrorCode(code);
    if (mapped) return mapped;
  }

  return message.replace(/^Firebase:\s*/i, "").replace(/^Error\s*\((.*?)\)\.?/i, "$1");
}

function mapAuthErrorCode(code: string): string | null {
  switch (code) {
    case "auth/configuration-not-found":
      return "Google Sign-In is not enabled in your Firebase Console. Please go to Firebase Console > Authentication > Sign-in method, enable Google, and set your support email.";

    case "auth/operation-not-allowed":
      return "This sign-in provider is disabled in Firebase Console. Please enable it under Authentication > Sign-in method.";

    case "auth/unauthorized-domain":
      return "This domain is not authorized for OAuth. Please add it to Authorized Domains in Firebase Console > Authentication > Settings.";

    case "auth/popup-closed-by-user":
      return "The sign-in popup was closed before completing authentication.";

    case "auth/cancelled-popup-request":
      return "Another authentication popup is already open. Please complete or close it.";

    case "auth/popup-blocked":
      return "The sign-in popup was blocked by your browser. Please allow popups for this site.";

    case "auth/invalid-api-key":
      return "Invalid Firebase API key. Please check your Firebase project configuration.";

    case "auth/user-not-found":
      return "No account found with this email address.";

    case "auth/wrong-password":
      return "Incorrect password. Please try again or reset your password.";

    case "auth/invalid-credential":
      return "Invalid login credentials. Please check your email and password.";

    case "auth/email-already-in-use":
      return "An account with this email already exists. Please log in instead.";

    case "auth/weak-password":
      return "Password is too weak. Please use at least 6 characters.";

    case "auth/user-disabled":
      return "This account has been disabled. Please contact support.";

    case "auth/network-request-failed":
      return "Network error. Please check your internet connection and try again.";

    case "auth/too-many-requests":
      return "Too many failed attempts. Please wait a moment before trying again.";

    case "auth/account-exists-with-different-credential":
      return "An account already exists with this email using a different sign-in method.";

    default:
      return null;
  }
}
