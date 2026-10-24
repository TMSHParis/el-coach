"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { DEFAULT_LANG, LANG_COOKIE, type Lang } from "./lang";
import { makeT, type Translate } from "./index";

type Ctx = { lang: Lang; t: Translate; setLang: (l: Lang) => void };
const LangContext = createContext<Ctx>({ lang: DEFAULT_LANG, t: makeT(DEFAULT_LANG), setLang: () => {} });

const YEAR = 60 * 60 * 24 * 365;

export function LangProvider({ initial, children }: { initial: Lang; children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initial);
  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    document.cookie = `${LANG_COOKIE}=${l}; path=/; max-age=${YEAR}; samesite=lax`;
    document.documentElement.lang = l;
  }, []);
  const value = useMemo(() => ({ lang, t: makeT(lang), setLang }), [lang, setLang]);
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export const useLang = () => useContext(LangContext);
export const useT = () => useContext(LangContext).t;
