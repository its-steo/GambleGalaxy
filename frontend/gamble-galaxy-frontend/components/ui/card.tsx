import React from "react"

export const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-lg shadow-md p-6 ${className}`}>{children}</div>
)

export const CardHeader = ({ children, className = "" }: any) => (
  <div className={`mb-4 ${className}`}>{children}</div>
)

export const CardTitle = ({ children, className = "" }: any) => (
  <h2 className={`text-lg font-semibold ${className}`}>{children}</h2>
)

export const CardContent = ({ children, className = "" }: any) => (
  <div className={`${className}`}>{children}</div>
)
