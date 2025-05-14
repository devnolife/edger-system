"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { getCurrentUser } from "@/app/actions/auth-actions"

type UserRole = "SUPERVISOR" | "OPERATOR"

type User = {
  id: string
  name?: string
  username?: string
  email?: string
  role: UserRole
}

type UserRoleContextType = {
  role: UserRole
  user: User | null
  setRole: (role: UserRole) => void
}

const UserRoleContext = createContext<UserRoleContextType>({
  role: "OPERATOR",
  user: null,
  setRole: () => { },
})

export function UserRoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<UserRole>("OPERATOR")
  const [user, setUser] = useState<User | null>(null)

  // Fetch actual user data from the API
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await getCurrentUser()

        if (userData) {
          setUser({
            id: userData.id,
            username: userData.username,
            role: userData.role as UserRole
          })
          setRole(userData.role as UserRole)
        }
      } catch (error) {
        console.error("Error fetching user data:", error)
      }
    }

    fetchUser()
  }, [])

  useEffect(() => {
    if (user && user.role !== role) {
      setUser({
        ...user,
        role: role
      })
    }
  }, [role, user])

  return <UserRoleContext.Provider value={{ role, user, setRole }}>{children}</UserRoleContext.Provider>
}

export function useUserRole() {
  const context = useContext(UserRoleContext)

  if (context === undefined) {
    throw new Error("useUserRole harus digunakan dalam UserRoleProvider")
  }

  return context
}
