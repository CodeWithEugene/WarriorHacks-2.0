import { Flag } from "lucide-react"
import Link from "next/link"

export function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2 rounded-md font-semibold tracking-tight focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none">
      <span aria-hidden className="heat-ribbon flex size-7 items-center justify-center rounded-md ring-1 ring-zone-edge">
        <Flag className="size-4 text-white" />
      </span>
      <span>Flagline</span>
    </Link>
  )
}
