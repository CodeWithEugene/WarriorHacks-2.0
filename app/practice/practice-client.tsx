"use client"

import dynamic from "next/dynamic"

import { Skeleton } from "@/components/ui/skeleton"

/** Practice Mode runs client-only: it restores the session from this device's storage. */
export const PracticeClient = dynamic(() => import("./practice-app"), {
  ssr: false,
  loading: () => <Skeleton className="mx-auto h-96 w-full max-w-xl rounded-xl" />,
})
