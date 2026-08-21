export type SignupFormValues = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export const signupFormFields = ["Name", "Email", "Password", "Confirm Password"] as const;
