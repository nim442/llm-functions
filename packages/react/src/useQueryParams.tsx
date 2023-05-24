import qs from 'qs';

export type SetterFunction<T> = (d: T) => T;

function isSetterFunction<T>(s: SetterFunction<T> | T): s is SetterFunction<T> {
  return typeof s === 'function';
}

export function useQueryParams<T>(
  key: string,
  defaultData?: T,
  setter?: (a: T) => void
): [T, (setter: T | SetterFunction<T>) => void] {
  const qsSearch = typeof location === 'undefined' ? '' : location.search;
  const existingQueries = qs.parse(qsSearch, {
    ignoreQueryPrefix: true,
    comma: true,
    arrayLimit: Infinity,
  });
  // TODO use ZOD instead of assertion
  const existingQuery = existingQueries[key] as unknown as T;

  const data = existingQuery;
  const setRoute = (o: T): void => {
    const existingQueries = qs.parse(location.search, {
      ignoreQueryPrefix: true,
    });
    const queryString = qs.stringify(
      { ...existingQueries, [key]: o },
      { skipNulls: true }
    );
    console.log(queryString);
    window.history.replaceState(null, null, '?' + queryString);

    if (setter) {
      setter(o);
    }
  };

  const setData = (setter: T | SetterFunction<T>): void => {
    if (isSetterFunction(setter)) {
      setRoute(setter(data as T));
    } else {
      setRoute(setter);
    }
  };
  if (!data && defaultData) {
    setData(defaultData);
  }
  return [data, setData];
}
