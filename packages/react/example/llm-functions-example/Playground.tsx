'use client';

// import '@llm-functions/react/index.css';
import { registry } from './scrapeWebsite';
import { Main } from '../../src/index';

const Playground: React.FC = () => {
  return <Main registry={registry} />;
};
export default Playground;
