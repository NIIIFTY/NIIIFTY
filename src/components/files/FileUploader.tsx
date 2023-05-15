import React, { useContext, useEffect, useRef, useState } from "react";
import { useDropzone, FileWithPath } from "react-dropzone";
import cx from "classnames";
import { formatBytes } from "@/utils/Utils";
import { db, storage } from "../../utils/Firebase";
import { ref, uploadBytesResumable, UploadTask } from "firebase/storage";
import { add } from "@/hooks/useFile";
import { UserContext } from "@/utils/UserContext";
import { collection, doc } from "firebase/firestore";
import { MimeType } from "@/utils/Types";
import path from "path";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { t } from "i18next";
import * as HoverCard from "@radix-ui/react-hover-card";
import { maxFileSize } from "@/utils/Config";

type FileExtended = FileWithPath & { preview: string; errorMessage: string };

export function FileUploader(_props: any) {
  const [files, setFiles] = useState<FileExtended[]>([]);

  const acceptedFileTypes = [
    // "audio/mpeg",
    "image/jpeg",
    "image/png",
    "image/tif",
    "image/tiff",
    "image/x-png",
    "model/gltf-binary",
    "video/mp4",
  ];

  function isFileAccepted(file: FileWithPath) {
    return (
      acceptedFileTypes.includes(file.type.toLowerCase()) ||
      file.path!.split(".").pop() === "glb"
    );
  }

  // function isPreviewSupported(file: FileWithPath) {
  //   return file.type.startsWith("image/") && !file.type.includes("tiff");
  // }

  const {
    // acceptedFiles,
    // fileRejections,
    getRootProps,
    getInputProps,
    // isFocused,
    // isDragAccept,
    // isDragReject,
  } = useDropzone({
    // can't use this because model/gltf-binary file type is not supported by browsers
    // https://github.com/react-dropzone/react-dropzone/issues/962
    // validate inside onDrop instead
    // accept: {
    //   'audio/mpeg': [],
    //   'image/jpeg': [],
    //   'image/png': [],
    //   'image/tif': [],
    //   'image/tiff': [],
    //   'image/x-png': [],
    //   'model/gltf-binary': [],
    //   'video/mp4': [],
    // },
    maxFiles: 10,
    maxSize: maxFileSize, // 100MB
    multiple: true,
    onDrop: (files, rejections) => {
      let validatedeFiles: FileExtended[] = [];

      files.forEach((file: FileWithPath) => {
        // is file type supported?
        if (!isFileAccepted(file)) {
          (file as FileExtended).errorMessage = t("fileTypeNotSupported");
          // only shows preview for images - looks odd alongside other icons
          // if (isPreviewSupported(file)) {
          //   Object.assign(file, {
          //     preview: URL.createObjectURL(file)
          //   });
          // }
        }

        validatedeFiles.push(file as FileExtended);
      });

      rejections.forEach((rejection) => {
        // is file size too large?
        if (rejection.errors[0].code === "file-too-large") {
          (rejection.file as FileExtended).errorMessage = t("fileTooLarge", {
            val: 100,
          });
        }

        validatedeFiles.push(rejection.file as FileExtended);
      });

      setFiles(validatedeFiles);
    },
  });

  const AudioIcon = () => {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06zM18.584 5.106a.75.75 0 011.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 11-1.06-1.06 8.25 8.25 0 000-11.668.75.75 0 010-1.06z" />
        <path d="M15.932 7.757a.75.75 0 011.061 0 6 6 0 010 8.486.75.75 0 01-1.06-1.061 4.5 4.5 0 000-6.364.75.75 0 010-1.06z" />
      </svg>
    );
  };

  const CubeIcon = () => {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M12.378 1.602a.75.75 0 00-.756 0L3 6.632l9 5.25 9-5.25-8.622-5.03zM21.75 7.93l-9 5.25v9l8.628-5.032a.75.75 0 00.372-.648V7.93zM11.25 22.18v-9l-9-5.25v8.57a.75.75 0 00.372.648l8.628 5.033z" />
      </svg>
    );
  };

  const ImageIcon = () => {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path
          fillRule="evenodd"
          d="M1.5 6a2.25 2.25 0 012.25-2.25h16.5A2.25 2.25 0 0122.5 6v12a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 18V6zM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0021 18v-1.94l-2.69-2.689a1.5 1.5 0 00-2.12 0l-.88.879.97.97a.75.75 0 11-1.06 1.06l-5.16-5.159a1.5 1.5 0 00-2.12 0L3 16.061zm10.125-7.81a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0z"
          clipRule="evenodd"
        />
      </svg>
    );
  };

  const VideoIcon = () => {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M4.5 4.5a3 3 0 00-3 3v9a3 3 0 003 3h8.25a3 3 0 003-3v-9a3 3 0 00-3-3H4.5zM19.94 18.75l-2.69-2.69V7.94l2.69-2.69c.944-.945 2.56-.276 2.56 1.06v11.38c0 1.336-1.616 2.005-2.56 1.06z" />
      </svg>
    );
  };

  const ErrorIcon = ({ message }: { message: string }) => {
    return (
      <HoverCard.Root>
        <HoverCard.Trigger asChild>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z"
              clipRule="evenodd"
            />
          </svg>
        </HoverCard.Trigger>
        <HoverCard.Portal>
          <HoverCard.Content
            className="data-[side=bottom]:animate-slideUpAndFade data-[side=right]:animate-slideLeftAndFade data-[side=left]:animate-slideRightAndFade data-[side=top]:animate-slideDownAndFade data-[state=open]:transition-all w-[300px] rounded-md bg-white p-5 shadow-[hsl(206_22%_7%_/_35%)_0px_10px_38px_-10px,hsl(206_22%_7%_/_20%)_0px_10px_20px_-15px]"
            sideOffset={5}
          >
            <div className="flex flex-col gap-[7px]">
              <div className="flex flex-col gap-[15px] text-sm dark:text-black">
                {message}
              </div>
            </div>
            <HoverCard.Arrow className="fill-white" />
          </HoverCard.Content>
        </HoverCard.Portal>
      </HoverCard.Root>
    );
  };

  const Thumbnail = ({ file }: { file: FileExtended }) => {
    if (file.errorMessage) {
      return <ErrorIcon message={file.errorMessage} />;
    }

    // preview thumbnails are available for images
    // if (file.preview) {
    //   return <img src={file.preview} className="w-16 h-16" />;
    // }

    if (!file.type && file.path!.split(".").pop() === "glb") {
      return <CubeIcon />;
    }

    if (file.type.startsWith("image/")) {
      return <ImageIcon />;
    }

    if (file.type.startsWith("audio/")) {
      return <AudioIcon />;
    }

    if (file.type.startsWith("video/")) {
      return <VideoIcon />;
    }

    return null;

    // model/gltf-binary mime type not supported by browsers yet
    // if (file.type.startsWith("model/")) {
    //   return <CubeIcon />;
    // }
  };

  const FileItems = () => {
    return (
      <>
        {files.map((file: FileExtended) => (
          <tr key={file.path}>
            <td
              className={cx(
                "hidden h-20 w-20 pr-4 text-gray-400 sm:table-cell",
                file.errorMessage ? "text-red-500" : "text-gray-400"
              )}
            >
              <Thumbnail file={file} />
            </td>
            <td className="max-w-[60vw] overflow-hidden text-ellipsis whitespace-nowrap">
              <span className="text-sm font-bold">{file.path}</span>
              <br />
              <span className="text-sm text-gray-400">
                {formatBytes(file.size, 1)}
              </span>
            </td>
            <td className="overflow-hidden whitespace-nowrap">
              {!file.errorMessage && <FileUpload file={file} />}
            </td>
          </tr>
        ))}
      </>
    );
  };

  return (
    // <section className={cx(
    //   "bg-gray-200",
    //   isFocused ? "bg-gray-300" : "",
    //   isDragAccept ? "bg-green-300" : "",
    //   isDragReject ? "bg-red-300" : ""
    // )}>
    <section>
      {/* drop zone */}
      {!files.length && (
        <div
          {...getRootProps({
            className:
              "flex justify-center w-full h-32 px-4 transition bg-white border-2 border-gray-300 border-dashed rounded-md appearance-none cursor-pointer hover:border-gray-400 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:hover:border-gray-500 dark:focus:border-gray-500",
          })}
        >
          <span className="flex items-center space-x-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="hidden h-6 w-6 text-gray-600 dark:text-white sm:block"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <span className="font-medium text-gray-600 dark:text-white">
              <>{t("dragAndDropFiles")}&nbsp;</>
              <span className="text-blue-600 underline dark:text-white">
                <>{t("browse")}</>
              </span>
            </span>
          </span>
          <input {...getInputProps()} />
        </div>
      )}

      {files.length > 0 && (
        <table className="mt-4 min-w-full">
          <thead>
            <tr>
              <th scope="col" className="hidden sm:table-cell"></th>
              <th scope="col"></th>
              <th scope="col"></th>
            </tr>
          </thead>
          <tbody>
            <FileItems />
          </tbody>
        </table>
      )}

      {/* for testing styles */}
      {/* <table className="mt-4 min-w-full">
        <thead>
          <tr>
            <th scope="col" className="hidden sm:table-cell"></th>
            <th scope="col"></th>
            <th scope="col"></th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="hidden h-20 w-20 border pr-4 text-gray-400 sm:table-cell">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M1.5 6a2.25 2.25 0 012.25-2.25h16.5A2.25 2.25 0 0122.5 6v12a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 18V6zM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0021 18v-1.94l-2.69-2.689a1.5 1.5 0 00-2.12 0l-.88.879.97.97a.75.75 0 11-1.06 1.06l-5.16-5.159a1.5 1.5 0 00-2.12 0L3 16.061zm10.125-7.81a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0z"
                  clip-rule="evenodd"
                ></path>
              </svg>
            </td>
            <td className="max-w-[60vw] overflow-hidden text-ellipsis whitespace-nowrap border">
              <span className="text-sm font-bold">
                mitchell-orr-tqduB9EwoY8-unsplash.jpg
              </span>
              <br />
              <span className="text-sm text-gray-400">4 MB</span>
            </td>
            <td className="overflow-hidden whitespace-nowrap border">
              <div className="mr-2 flex">
                <div className="ml-auto hidden text-right sm:block">
                  <span className="text-sm font-bold">Uploading 59%</span>
                  <br />
                  <span className="text-sm text-gray-400">Cancel</span>
                </div>
                <div className="align-center ml-auto flex w-8 sm:ml-4">
                  <svg
                    className="CircularProgressbar"
                    viewBox="0 0 100 100"
                    data-test-id="CircularProgressbar"
                  >
                    <path
                      className="CircularProgressbar-trail"
                      d="
        M 50,50
        m 0,-45
        a 45,45 0 1 1 0,90
        a 45,45 0 1 1 0,-90
      "
                      strokeWidth="10"
                      fillOpacity="0"
                      style={{
                        strokeLinecap: "butt",
                        strokeDasharray: "282.743px, 282.743px",
                        strokeDashoffset: "0px",
                      }}
                    ></path>
                    <path
                      className="CircularProgressbar-path"
                      d="
        M 50,50
        m 0,-45
        a 45,45 0 1 1 0,90
        a 45,45 0 1 1 0,-90
      "
                      strokeWidth="10"
                      fillOpacity="0"
                      style={{
                        stroke: "emerald",
                        strokeLinecap: "butt",
                        strokeDasharray: "282.743px, 282.743px",
                        strokeDashoffset: "240.332px",
                      }}
                    ></path>
                  </svg>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table> */}
    </section>
  );
}

const FileUpload = ({ file }: { file: FileExtended }) => {
  const [uploadComplete, setUploadComplete] = useState(false);
  const [progress, setProgress] = useState(0);
  const { user, userAdapter } = useContext<UserContext>(UserContext);

  const id = doc(collection(db, "files")).id;

  const uploadTaskRef = useRef<UploadTask>();

  useEffect(() => {
    const uid: string = user!.uid;
    const title: string = path.basename(file.name, path.extname(file.name));

    let extension: string;

    if (file.type) {
      extension = file.type.split("/")[1];
    } else {
      // fall back to getting the extension from the file name
      extension = file.name.split(".").pop() as string;
    }

    // use jpg instead of jpeg for consistency with other derivative files
    if (extension === "jpeg") {
      extension = "jpg";
    }

    let type: MimeType;

    if (file.type) {
      type = file.type as MimeType;
    } else if (extension === "glb") {
      // glb files aren't recognised in browsers yet
      type = "model/gltf-binary";
    }

    const fileName: string = `${id}/original.${extension}`;
    const storageRef = ref(storage, fileName);

    // Starts the upload
    uploadTaskRef.current = uploadBytesResumable(storageRef, file);

    uploadTaskRef.current.on(
      "state_changed",
      (snapshot) => {
        // Observe state change events such as progress, pause, and resume
        // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
        const pct = (
          (snapshot.bytesTransferred / snapshot.totalBytes) *
          100
        ).toFixed(0) as any;

        setProgress(pct);

        switch (snapshot.state) {
          case "paused":
            // console.log('Upload is paused');
            break;
          case "running":
            // console.log('Upload is running');
            break;
        }
      },
      (error) => {
        // Handle unsuccessful uploads
        console.error(error);
      },
      async () => {
        setUploadComplete(true);
        // onComplete(file);
        // file is now in cloud storage
        // create a file record in firestore (triggers fileCreated cloud function to generate derivatives)
        await add(userAdapter!, id, {
          uid,
          type,
          title,
        });
      }
    );
  }, [file]);

  const onCancel = () => {
    uploadTaskRef.current!.cancel();
  };

  return (
    <div className="mr-2 flex">
      <div className="ml-auto hidden text-right sm:block">
        {!uploadComplete && (
          <>
            {/* <span className="text-sm font-bold">
              {t("uploadProgress", { progress: progress })}
            </span> */}
            {/* cancel broken - waiting for fix:
            https://github.com/firebase/firebase-tools/issues/5412#issuecomment-1382228460 */}
            {/* <br />
            <button
              type="button"
              onClick={onCancel}
              className="hover:black text-sm text-gray-400"
            >
              {t("cancel")}
            </button> */}
          </>
        )}
      </div>
      <div className="align-center ml-auto flex w-8 text-green-600 sm:ml-4">
        {uploadComplete ? (
          // green checkmark
          <svg
            width="40"
            height="40"
            viewBox="0 0 40 40"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M0 20C0 8.95385 8.95385 0 20 0C31.0462 0 40 8.95385 40 20C40 31.0462 31.0462 40 20 40C8.95385 40 0 31.0462 0 20ZM27.4051 16.279C27.5282 16.115 27.6173 15.928 27.6671 15.7291C27.7168 15.5302 27.7264 15.3234 27.6951 15.1207C27.6638 14.9181 27.5923 14.7237 27.4848 14.5491C27.3774 14.3745 27.2361 14.2231 27.0692 14.1039C26.9024 13.9847 26.7135 13.9 26.5135 13.8548C26.3134 13.8097 26.1064 13.805 25.9046 13.8409C25.7027 13.8769 25.5101 13.9529 25.338 14.0644C25.1659 14.1759 25.0179 14.3207 24.9026 14.4903L18.2646 23.7826L14.9333 20.4513C14.6417 20.1795 14.256 20.0316 13.8574 20.0386C13.4588 20.0456 13.0785 20.2071 12.7967 20.489C12.5148 20.7709 12.3533 21.1511 12.3463 21.5497C12.3393 21.9483 12.4872 22.334 12.759 22.6256L17.3744 27.241C17.5323 27.3988 17.7227 27.5204 17.9323 27.5972C18.1419 27.6741 18.3657 27.7044 18.5882 27.686C18.8107 27.6677 19.0266 27.6011 19.2208 27.491C19.415 27.3808 19.5829 27.2298 19.7128 27.0482L27.4051 16.279Z"
              fill="currentColor"
            />
          </svg>
        ) : (
          // https://codesandbox.io/s/vymm4oln6y?file=/index.js:1580-1632
          <CircularProgressbar
            value={progress}
            strokeWidth={10}
            styles={buildStyles({
              strokeLinecap: "butt",
              pathColor: "green",
              // trailColor: "white"
            })}
          />
        )}
      </div>
    </div>
  );
};
