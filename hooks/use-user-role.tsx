"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

type UserRole = "supervisor" | "users" | "operator"

type User = {
  id: string
  name: string
  email: string
  role: UserRole
}

type UserRoleContextType = {
  role: UserRole
  user: User | null
  setRole: (role: UserRole) => void
}

const UserRoleContext = createContext<UserRoleContextType>({
  role: "operator",
  user: null,
  setRole: () => { },
})

export function UserRoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<UserRole>("supervisor")
  const [user, setUser] = useState<User | null>(null)

  // Simulasi pengambilan data pengguna
  useEffect(() => {
    // Dalam aplikasi nyata, ini akan menjadi panggilan API
    const mockUser: User = {
      id: "1",
      name: "Supervisor",
      email: "admin@example.com",
      role: role,
    }

    setUser(mockUser)
  }, [role])

  return <UserRoleContext.Provider value={{ role, user, setRole }}>{children}</UserRoleContext.Provider>
}

export function useUserRole() {
  const context = useContext(UserRoleContext)

  if (context === undefined) {
    throw new Error("useUserRole harus digunakan dalam UserRoleProvider")
  }

  return context
}
