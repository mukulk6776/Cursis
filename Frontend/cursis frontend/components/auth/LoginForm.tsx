export type LoginFormValues = {
  email: string;
  password: string;
};

export const loginFormFields = ["Email", "Password"] as const;
