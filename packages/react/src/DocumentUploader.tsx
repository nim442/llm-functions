import { FunctionArgs, DocumentWithoutInput } from 'llm-functions-ts';
import { FileWithPath, useDropzone } from 'react-dropzone';

import { FormField, Input } from './FormField';
export type DocumentUploaderProps = {
  documents: DocumentWithoutInput[];
  runtimeArgs: FunctionArgs;
  setRuntimeArgs: (a: FunctionArgs) => void;
};
export const DocumentUploader: React.FC<DocumentUploaderProps> = ({
  runtimeArgs,
  documents,
  setRuntimeArgs,
}) => {
  const { acceptedFiles, getRootProps, getInputProps } = useDropzone({
    onDropAccepted: (files) => {
      const file = files[0];

      if (!file) return;
      const reader = new FileReader();
      const dataUrlReader = new FileReader();

      reader.readAsArrayBuffer(file);

      dataUrlReader.readAsDataURL(file);
      dataUrlReader.onloadend = () => {
        if (dataUrlReader.result) {
          console.log(dataUrlReader.result);
          setRuntimeArgs({
            ...runtimeArgs,
            documents: [
              (dataUrlReader.result as string)
                .replace('data:', '')
                .replace(/^.+,/, ''),
            ],
          });
        }
      };
    },
  });

  const files = acceptedFiles.map((file: FileWithPath) => {
    return (
      <li key={file.path}>
        {file.path} - {file.size} bytes
      </li>
    );
  });

  return (
    <>
      {documents.map((d, i) => {
        switch (d.type) {
          case 'pdf':
            return (
              <section key={i} className="mt-2">
                <div className="text-sm text-neutral-500 mb-1">Attach pdf</div>
                {files.length === 0 ? (
                  <div {...getRootProps({ className: 'dropzone' })}>
                    <input {...getInputProps()} />
                    <p className="text-sm p-4 border-neutral-500 rounded border-2 border-dashed text-neutral-500">
                      {`Drag 'n' drop your pdf here, or click to select files`}
                    </p>
                  </div>
                ) : (
                  <aside>
                    <ul className="text-sm text-neutral-500">{files}</ul>
                  </aside>
                )}
              </section>
            );
          case 'url':
            return (
              <FormField
                label="Url"
                control={
                  <Input
                    value={runtimeArgs?.documents?.[i] || ('' as any)}
                    onChange={(e) =>
                      setRuntimeArgs({
                        ...runtimeArgs,
                        //@ts-ignore
                        documents: runtimeArgs?.documents
                          ? runtimeArgs?.documents.map((d, idx) =>
                              idx === i ? e.target.value : d
                            )
                          : [e.target.value],
                      })
                    }
                  />
                }
              />
            );
          case 'text':
            return (
              <FormField
                label="Text"
                control={
                  <Input
                    value={runtimeArgs?.documents?.[i] || ('' as any)}
                    onChange={(e) =>
                      setRuntimeArgs({
                        ...runtimeArgs,
                        //@ts-ignore
                        documents: runtimeArgs?.documents
                          ? runtimeArgs?.documents.map((d, idx) =>
                              idx === i ? e.target.value : d
                            )
                          : [e.target.value],
                      })
                    }
                  />
                }
              />
            );
        }
      })}
    </>
  );
};
