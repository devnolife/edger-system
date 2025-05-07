"use server";

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { z } from "zod";
import { redirect } from "next/navigation";
import { sign, verify } from "jsonwebtoken";
import { SignOptions } from "jsonwebtoken";

const prisma = new PrismaClient();

const loginFormSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginFormSchema>;

export async function login(formData: FormData) {
  try {
    const validatedFields = loginFormSchema.safeParse({
      username: formData.get("username"),
      password: formData.get("password"),
    });

    if (!validatedFields.success) {
      return {
        error: "Invalid credentials",
        success: false,
      };
    }

    const { username, password } = validatedFields.data;

    // Find user by username
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return {
        error: "User not found",
        success: false,
      };
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return {
        error: "Invalid password",
        success: false,
      };
    }
    // Generate JWT token
    const token = sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
      },
      process.env.JWT_SECRET || "your-fallback-secret-key",
      { expiresIn: "8h" }
    );

    // Set HTTP-only cookie
    (await cookies()).set({
      name: "auth-token",
      value: token,
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 3, // 3 hours
    });

    return {
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    };
  } catch (error) {
    console.error("Login error:", error);
    return {
      error: "An error occurred during login",
      success: false,
    };
  }
}

export async function logout() {
  (await cookies()).delete("auth-token");
  redirect("/");
}

export async function getCurrentUser() {
  try {
    const token = (await cookies()).get("auth-token")?.value;

    if (!token) {
      return null;
    }

    const decoded = verify(
      token,
      process.env.JWT_SECRET || "your-fallback-secret-key"
    ) as {
      id: string;
      username: string;
      role: string;
    };

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        username: true,
        role: true,
      },
    });

    return user;
  } catch (error) {
    (await cookies()).delete("auth-token");
    return null;
  }
}

export async function requireAuth() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/");
  }

  return user;
}

export async function isAdmin() {
  const user = await getCurrentUser();

  if (!user || user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return user;
} 
