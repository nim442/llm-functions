import dynamic from "next/dynamic";

const DynamicComponentWithNoSSR = dynamic(
  () => import("@/components/playground"),
  {
    ssr: false,
  }
);

// eslint-disable-next-line import/no-anonymous-default-export, react/display-name
export default () => <DynamicComponentWithNoSSR />;
