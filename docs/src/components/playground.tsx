import { assertAiFn } from "llm-functions-ts";
import "@llm-functions-ts/react/index.css";
import { examples } from "./examples";
import { Main } from "@llm-functions-ts/react";
import { useTheme } from "nextra-theme-docs";
import { useEffect } from "react";

const Playground: React.FC = () => {
  const { setTheme } = useTheme();
  useEffect(() => {
    setTheme("light");
  }, [setTheme]);

  return (
    <main className="flex h-screen bg-white">
      <Main aiFunctions={examples.map((e) => assertAiFn(e).__internal_def)} />
    </main>
  );
};
export default Playground;
