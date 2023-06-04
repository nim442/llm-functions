"use client";
import { assertAiFn } from "llm-functions-ts";
import "@llm-functions/react/index.css";
import { registry } from "./examples";
import { FunctionStore, Main } from "@llm-functions/react";
import { useTheme } from "nextra-theme-docs";
import { useEffect, useState } from "react";


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
        registry={registry}
        selectedTab={selectedTab}
        setSelectedTab={setSelectedTab}
        setSelectedFunctionId={setId}
        functionId={id}
      />
    </main>
  );
};
export default Playground;
