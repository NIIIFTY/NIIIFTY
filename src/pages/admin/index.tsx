import AuthCheck from "@/components/AuthCheck";
import { FileList } from "@/components/files/FileList";

export default function AdminPage(_props: any) {
  return <AuthCheck signedInContent={<Admin />}></AuthCheck>;
}

function Admin() {
  return <FileList />;
}
