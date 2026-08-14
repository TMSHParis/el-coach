import { Bebas_Neue, Barlow, Barlow_Condensed } from "next/font/google";

export const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
});

export const barlow = Barlow({
  weight: ["300", "400", "500"],
  subsets: ["latin"],
  variable: "--font-barlow",
});

export const barlowCondensed = Barlow_Condensed({
  weight: ["300", "400", "600", "700"],
  subsets: ["latin"],
  variable: "--font-barlow-condensed",
});

export const ecmFontVariables = `${bebasNeue.variable} ${barlow.variable} ${barlowCondensed.variable}`;
