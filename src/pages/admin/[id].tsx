import AuthCheck from "@/components/AuthCheck";
import { EditFile } from "@/components/files/EditFile";
import { useRouter } from "next/router";

export default function EditFilePage(_props: any) {
  const router = useRouter();
  const { id } = router.query;

  return (
    <AuthCheck signedInContent={<EditFile id={id as string} />}></AuthCheck>
  );
}
