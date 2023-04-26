import UploadFilesButton from "@/components/UploadFilesButton";
import Metatags from "@/components/Metatags";
import { title, description } from "../utils/Config";

export default function Home() {
  return (
    <>
      <Metatags title={title} description={description} />
      <p className="text-xl font-semibold">
        NIIIFTY simplifies the sharing of IIIF-formatted high-resolution images,
        3D models, and audiovisual content via IPFS.
      </p>
      <br />
      <p className="text-md">
        This platform improves the reliability of{" "}
        <a href="https://iiif.io">IIIF</a> content by leveraging the
        content-addressed immutability and decentralized retrieval properties of{" "}
        <a href="https://ipfs.io/">IPFS</a>. This makes it ideal for use in
        third-party applications such as{" "}
        <a href="https://exhibit.so">Exhibit</a>. It is built on top of{" "}
        <a href="https://web3.storage/">web3.storage</a>, and{" "}
        <a href="https://firebase.google.com/">Firebase</a>.
      </p>
      <br />
      <p className="text-md">
        <a href="https://github.com/NIIIFTY">NIIIFTY</a> is a project funded by{" "}
        <a href="https://github.com/filecoin-project/devgrants/issues/504">
          Protocol Labs Dev Grant #504
        </a>{" "}
        and built by <a href="https://twitter.com/edsilv">Edward Silverton</a>{" "}
        at <a href="https://mnemoscene.io">Mnemoscene</a>. Please contact{" "}
        <a href="https://twitter.com/edsilv">Edward</a> for details of how to
        access this online demo, or refer to the <a href="/docs">docs</a> to set
        up your own instance.
      </p>
      <div className="mx-auto mt-8 max-w-sm">
        <UploadFilesButton.Large href="/admin" />
      </div>
    </>
  );
}
