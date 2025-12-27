import { createContext } from "react";
import zhCN from "../../../lang/zh_CN.json";

interface Props {
  children: React.ReactNode;
  lang?: Record<string, string>;
}

export const I18nContext = createContext<{
  lang?: Record<string, any>;
}>({});

export const t = (key: string, i18n: Record<string, any>) => {
  if (!i18n) return key;
  return i18n[key] || key;
};

export default function TableConfig({ children, lang = zhCN }: Props) {
  return (
    <I18nContext.Provider
      value={{
        lang,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
}
