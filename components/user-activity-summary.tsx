"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { motion } from "framer-motion"

export function UserActivitySummary() {
  const activities = [
    {
      id: 1,
      user: {
        name: "John Doe",
        avatar: "/placeholder-user.jpg",
        role: "Operator",
      },
      action: "Membuat entri jurnal baru",
      target: "JE-2023-0046",
      time: "10 menit yang lalu",
    },
    {
      id: 2,
      user: {
        name: "Jane Smith",
        avatar: "/placeholder-user.jpg",
        role: "Operator",
      },
      action: "Memperbarui bagan akun",
      target: "Menambahkan akun pengeluaran baru",
      time: "1 jam yang lalu",
    },
    {
      id: 3,
      user: {
        name: "Mike Johnson",
        avatar: "/placeholder-user.jpg",
        role: "Admin",
      },
      action: "Menyetujui entri jurnal",
      target: "JE-2023-0042",
      time: "2 jam yang lalu",
    },
    {
      id: 4,
      user: {
        name: "Sarah Williams",
        avatar: "/placeholder-user.jpg",
        role: "Operator",
      },
      action: "Membuat laporan",
      target: "Laporan Laba Rugi Q2",
      time: "3 jam yang lalu",
    },
    {
      id: 5,
      user: {
        name: "Robert Brown",
        avatar: "/placeholder-user.jpg",
        role: "Admin",
      },
      action: "Memposting entri jurnal ke buku besar",
      target: "Batch #2023-06-15",
      time: "5 jam yang lalu",
    },
  ]

  return (
    <div className="space-y-4">
      {activities.map((activity, index) => (
        <motion.div
          key={activity.id}
          className="flex items-start space-x-4 p-3 rounded-xl bg-white dark:bg-black/40 hover:bg-primary/5 transition-colors"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ scale: 1.02 }}
        >
          <Avatar className="border-2 border-primary">
            <AvatarImage src={activity.user.avatar || "/placeholder.svg"} alt={activity.user.name} />
            <AvatarFallback className="bg-primary text-white">{activity.user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <p className="text-sm">
              <span className="font-semibold">{activity.user.name}</span>{" "}
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{activity.user.role}</span>{" "}
              {activity.action}
            </p>
            <p className="text-xs text-muted-foreground">
              {activity.target} • {activity.time}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
