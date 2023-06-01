"use client";
import { assertAiFn } from "llm-functions-ts";
import "@llm-functions/react/index.css";
import { examples } from "./examples";
import { FunctionStore, Main } from "@llm-functions/react";
import { useTheme } from "nextra-theme-docs";
import { useEffect, useState } from "react";
import { exampleLogs } from "./exampleLogs";

const Playground: React.FC = () => {
  const { setTheme } = useTheme();
  useEffect(() => {
    setTheme("light");
  }, [setTheme]);
  const [id, setId] = useState<string>();
  const [selectedTab, setSelectedTab] =
    useState<FunctionStore["selectedTab"]>("PLAYGROUND");
  return (
    <main className="flex h-screen bg-white">
      <Main
        logs={exampleLogs}
        selectedTab={selectedTab}
        setSelectedTab={setSelectedTab}
        setSelectedFunctionId={setId}
        functionId={id}
        aiFunctions={examples.map((e) => assertAiFn(e).__internal_def)}
      />
    </main>
  );
};
export default Playground;
