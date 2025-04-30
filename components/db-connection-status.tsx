"use client"

import { useState, useEffect } from "react"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function DbConnectionStatus() {
  const [connectionStatus, setConnectionStatus] = useState<"checking" | "connected" | "error">("checking")
  const [errorMessage, setErrorMessage] = useState<string>("")

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await fetch("/api/check-db-connection")
        const data = await response.json()

        if (data.connected) {
          setConnectionStatus("connected")
        } else {
          setConnectionStatus("error")
          setErrorMessage(data.message || "Database connection failed")
        }
      } catch (error) {
        setConnectionStatus("error")
        setErrorMessage("Could not verify database connection")
      }
    }

    checkConnection()
  }, [])

  if (connectionStatus === "checking") {
    return null
  }

  if (connectionStatus === "connected") {
    return null // Don't show anything when connected
  }

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Database Connection Error</AlertTitle>
      <AlertDescription>
        {errorMessage || "There was an error connecting to the database. Please check your environment variables."}
      </AlertDescription>
    </Alert>
  )
}
