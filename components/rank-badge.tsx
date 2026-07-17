import Image from "next/image"

type Props = {
  rank: string
}

const badges: Record<string, string> = {
  Bronze: "/ranks/bronze.png",
  Silver: "/ranks/silver.png",
  Gold: "/ranks/gold.png",
  Platinum: "/ranks/platinum.png",
  Diamond: "/ranks/diamond.png",
  Master: "/ranks/master.png",
  Grandmaster: "/ranks/grandmaster.png",
  Legend: "/ranks/legend.png",
}

export function RankBadge({ rank }: Props) {
  return (
    <Image
      src={badges[rank] ?? "/ranks/bronze.png"}
      alt={rank}
      width={200}
      height={200}
      className="h-32 w-32 object-contain drop-shadow-[0_0_20px_rgba(255,255,255,.2)]"
      priority
    />
  )
}