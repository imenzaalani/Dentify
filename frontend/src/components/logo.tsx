import * as React from "react"

interface LogoProps extends React.SVGProps<SVGSVGElement> {
  size?: number
}

export function Logo({ size = 24, className, ...props }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <path
        d="M16 4
           C12 4 8.5 5.75 7.75 9.5
           C7.25 12 7.75 14.5 9.25 16.25
           C8.25 19 8.25 22.5 9.5 25.25
           C10.15 26.65 11.5 26.9 12.15 25.25
           C12.75 23.75 13.25 21.75 14.25 20.75
           C14.85 20.15 15.4 20 16 20
           C16.6 20 17.15 20.15 17.75 20.75
           C18.75 21.75 19.25 23.75 19.85 25.25
           C20.5 26.9 21.85 26.65 22.5 25.25
           C23.75 22.5 23.75 19 22.75 16.25
           C24.25 14.5 24.75 12 24.25 9.5
           C23.5 5.75 20 4 16 4 Z"
        fill="currentColor"
      />
    </svg>
  )
}