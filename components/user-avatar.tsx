import { avatarEmblems } from "@/lib/avatars"

type Props = {
  username?: string | null
  avatarKey?: string | null
  size?: number
  className?: string
}

export function UserAvatar({ username, avatarKey, size = 96, className = "" }: Props) {
  const emblem = avatarKey ? avatarEmblems[avatarKey] : null

  if (emblem) {
    const { Svg } = emblem
    return (
      <div
        className={`flex items-center justify-center rounded-full border border-white/10 ${className}`}
        style={{ width: size, height: size, background: emblem.bg, boxShadow: emblem.glow }}
      >
        <Svg size={size * 0.72} />
      </div>
    )
  }

  return (
    <div
      className={`flex items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-red-600 font-bold text-white ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {username?.slice(0, 2).toUpperCase() ?? "??"}
    </div>
  )
}
