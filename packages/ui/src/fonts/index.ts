import "./fonts.css"

export const fontSans = {
  variable: "font-variable-sans",
} as const

export const fontHeading = {
  variable: "font-variable-heading",
} as const

export const fontMono = {
  variable: "font-variable-mono",
} as const

export const fontVariables = [
  fontSans.variable,
  fontHeading.variable,
  fontMono.variable,
].join(" ")
