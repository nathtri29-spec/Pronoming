import type React from "react"

type RankLike = {
  name: string
  color: string
  borderGradient?: [string, string]
}

type Props = {
  rank: RankLike
  className?: string
}

export function RankName({ rank, className = "" }: Props) {
  if (rank.borderGradient) {
    return (
      <span
        className={`rank-gradient-text ${className}`}
        style={
          {
            "--border-color-a": rank.borderGradient[0],
            "--border-color-b": rank.borderGradient[1],
          } as React.CSSProperties
        }
      >
        {rank.name}
      </span>
    )
  }

  return <span className={`${rank.color} ${className}`}>{rank.name}</span>
}
