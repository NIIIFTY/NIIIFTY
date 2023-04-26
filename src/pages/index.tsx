import UploadFilesButton from "@/components/UploadFilesButton";
import Metatags from "@/components/Metatags";
import { title, description } from "../utils/Config";

export default function Home() {
  return (
    <>
      <Metatags title={title} description={description} />
      <p className="text-lg font-semibold">
        <a href="https://github.com/NIIIFTY">NIIIFTY</a> is a project funded by{" "}
        <a href="https://github.com/filecoin-project/devgrants/issues/504">
          Protocol Labs Dev Grant #504
        </a>{" "}
        and built by <a href="https://twitter.com/edsilv">Edward Silverton</a>{" "}
        at <a href="https://mnemoscene.io">Mnemoscene</a>.
      </p>
      <br />
      <p className="text-md">
        NIIIFTY makes it easy to share <a href="https://iiif.io">IIIF</a>
        -formatted high resolution images, 3d models, and audiovisual content
        via <a href="https://ipfs.io/">IPFS</a>. Therefore increasing the
        reliability of this data for use in third-party apps such as{" "}
        <a href="https://exhibit.so">Exhibit</a>.
      </p>
      <br />
      <p className="text-md">
        It is built on top of <a href="https://web3.storage/">web3.storage</a>,
        and <a href="https://firebase.google.com/">Firebase</a>.
      </p>
      <br />
      <p className="text-md">
        Please contact <a href="https://twitter.com/edsilv">Edward Silverton</a>{" "}
        for details of how to access this online demo, or refer to the{" "}
        <a href="/docs">docs</a> to set up your own instance.
      </p>
      <br />
      <div className="mx-auto mt-8 max-w-sm">
        <UploadFilesButton.Large href="/admin" />
      </div>
    </>
  );
}
