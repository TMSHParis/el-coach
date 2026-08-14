import { Bebas_Neue, DM_Sans } from "next/font/google";

export const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
});

export const dmSans = DM_Sans({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

export const checkinFontVariables = `${bebasNeue.variable} ${dmSans.variable}`;
