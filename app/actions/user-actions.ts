"use server";

import { PrismaClient } from "@prisma/client";
import { getCurrentUser } from "./auth-actions";

const prisma = new PrismaClient();

// Function to get all users
export async function getAllUsers() {
  try {
    // Check current user's permissions first
    const currentUser = await getCurrentUser();

    if (!currentUser || (currentUser.role !== "SUPERVISOR" && currentUser.role !== "OPERATOR")) {
      return {
        success: false,
        error: "Unauthorized access",
        users: [],
      };
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        role: true,
        last_login: true,
        is_active: true,
        created_at: true,
        updated_at: true,
      },
      orderBy: {
        created_at: "desc",
      },
    });

    // Format the users for display
    const formattedUsers = users.map(user => ({
      id: user.id,
      name: user.username, // Using username as name since there's no separate name field
      email: `${user.username.toLowerCase().replace(/\s+/g, '.')}@example.com`, // Generate placeholder email
      role: user.role,
      department: "Keuangan", // Default department (could be stored in a separate table in a real app)
      lastActive: user.last_login ? formatLastActive(user.last_login) : "Belum pernah login",
      status: user.is_active ? "active" : "inactive",
    }));

    return {
      success: true,
      users: formattedUsers,
    };
  } catch (error) {
    console.error("Error fetching users:", error);
    return {
      success: false,
      error: "Failed to fetch users",
      users: [],
    };
  }
}

// Helper function to format the last active time
function formatLastActive(lastLoginDate: Date) {
  const now = new Date();
  const diffMs = now.getTime() - lastLoginDate.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) {
    return "Baru saja";
  } else if (diffMins < 60) {
    return `${diffMins} menit yang lalu`;
  } else if (diffHours < 24) {
    return `${diffHours} jam yang lalu`;
  } else {
    return `${diffDays} hari yang lalu`;
  }
} 
