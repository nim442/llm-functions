import { Inspector as ReactInspector } from 'react-inspector';
import { inspectorTheme } from './inspectorTheme';

export const Inspector: typeof ReactInspector = (props) => {
  return <ReactInspector theme={inspectorTheme as any} {...props} />;
};
