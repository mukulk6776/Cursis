"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { setSession, clearSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isAllowedEmailDomain, EMAIL_RESTRICTION_MESSAGE } from "@/lib/email-validation";

export async function login(formData: FormData) {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  if (!isAllowedEmailDomain(email)) {
    return { error: EMAIL_RESTRICTION_MESSAGE };
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || !user.password) {
    return { error: "Invalid email or password" };
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    return { error: "Invalid email or password" };
  }

  await setSession(user.id);
  return { success: true };
}

export async function signup(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const organizationName = formData.get("organization") as string;

  if (!name || !email || !password || !organizationName) {
    return { error: "All fields are required" };
  }

  if (!isAllowedEmailDomain(email.trim())) {
    return { error: EMAIL_RESTRICTION_MESSAGE };
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return { error: "User with this email already exists" };
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  
  // Create an org slug
  const slug = organizationName.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).substring(2, 6);

  try {
    const org = await prisma.organization.create({
      data: {
        name: organizationName,
        slug,
      },
    });

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        organizationId: org.id,
        role: "owner",
        title: "Founder",
      },
    });

    // Create a default project for the new org
    await prisma.project.create({
      data: {
        name: "General Operations",
        description: "Default project for general tasks.",
        organizationId: org.id,
        status: "ACTIVE",
      }
    });

    await setSession(user.id);
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Failed to create account" };
  }
}

export async function logout() {
  await clearSession();
  redirect("/login");
}
