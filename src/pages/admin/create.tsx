import AuthCheck from "@/components/AuthCheck";
import { FileUploader } from "@/components/files/FileUploader";

export default function CreateFilePage(_props: any) {
  return <AuthCheck signedInContent={<CreateFile />}></AuthCheck>;
}

function CreateFile() {
  return (
    <div>
      <FileUploader />
    </div>
  );
}
