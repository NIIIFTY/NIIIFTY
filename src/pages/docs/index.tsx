import CodeInline from "@/components/CodeInline";
import CodeBlock from "@/components/CodeBlock";
import Figure from "@/components/Figure";
import DocsLayout from "@/layouts/DocsLayout";

export async function getStaticProps(_context) {
  return {
    props: {},
  };
}

export default function Doc(_props) {
  return (
    <DocsLayout title="Setup">
      <p className="pt-4 pb-16">
        This is a step-by-step guide to setting up your own NIIIFTY instance
        using{" "}
        <a href="https://firebase.google.com/" target="_blank">
          Firebase
        </a>{" "}
        and{" "}
        <a href="https://vercel.com" target="_blank">
          Vercel
        </a>
        .
      </p>
      <Figure img="/images/docs/Fig.1.png" title="fig 1">
        <p className="pt-4 pb-16">
          First, fork the{" "}
          <a href="https://github.com/NIIIFTY/NIIIFTY" target="_blank">
            NIIIFTY github repository
          </a>{" "}
          to your own github profile.
        </p>
      </Figure>
      <Figure img="/images/docs/Fig.2.png" title="fig 2">
        <p className="pt-4 pb-16">
          <CodeInline>git clone</CodeInline> your NIIIFTY fork to your local
          filesystem
        </p>
      </Figure>
      <Figure img="/images/docs/Fig.3.png" title="fig 3">
        <p className="pt-4 pb-16">
          Go to your{" "}
          <a href="https://console.firebase.google.com/" target="_blank">
            Firebase console
          </a>{" "}
          and click <strong>Add project</strong>.
        </p>
      </Figure>
      <Figure img="/images/docs/Fig.4.png" title="fig 4">
        <p className="pt-4 pb-16">
          Give your project a name and click <strong>Continue</strong>
          <br />
          Leave Google Analytics enabled.
          <br />
          Click <strong>Create Project</strong>.<br />
          Once your project is created, click <strong>Continue</strong>.
        </p>
      </Figure>
      <Figure img="/images/docs/Fig.5.png" title="fig 5">
        <p className="pt-4 pb-16">
          In your firebase console, click the cog icon next to{" "}
          <strong>Project Overview</strong> and select{" "}
          <strong>Usage and Billing</strong>. <br />
          Under the <strong>Details and Settings</strong> tab, select{" "}
          <strong>Modify Plan</strong>. Select the <strong>Blaze Plan</strong>.
        </p>
      </Figure>
      <Figure img="/images/docs/Fig.6.png" title="fig 6">
        <p className="pt-4 pb-16">
          Click the cog icon next to <strong>Project Overview</strong> and
          select <strong>Project settings</strong>. Scroll down to{" "}
          <strong>Your apps</strong>, and select <strong>Web App</strong>.
        </p>
      </Figure>
      <Figure img="/images/docs/Fig.7.png" title="fig 7">
        <p className="pt-4 pb-16">
          Give your app a nickname and click <strong>Register app</strong>.
          We'll be using{" "}
          <a href="https://vercel.com" target="_blank">
            Vercel
          </a>{" "}
          for hosting, so leave <strong>Firebase Hosting</strong> unchecked.
        </p>
      </Figure>
      <Figure img="/images/docs/Fig.8.png" title="fig 8">
        <p className="pt-4 pb-16">
          Copy the <CodeInline>firebaseConfig</CodeInline> object values to your
          clipboard and click <strong>Continue to console</strong>.
        </p>
      </Figure>
      <Figure img="/images/docs/Fig.9.png" title="fig 9">
        <p className="pt-4 pb-16">
          Open your locally-cloned NIIIFTY project in{" "}
          <a href="https://code.visualstudio.com/" target="_blank">
            VSCode
          </a>
          . <br />
          Find the <CodeInline>niiifty.config.ts</CodeInline> file and paste in
          your Firebase config values.
        </p>
      </Figure>
      <Figure img="/images/docs/Fig.10.png" title="fig 10">
        <p className="pt-4 pb-16">
          Set <CodeInline>basicAuthDisabled</CodeInline> to true
        </p>
      </Figure>
      <Figure img="/images/docs/Fig.11.png" title="fig 11">
        <p className="pt-4 pb-16">
          Browse to{" "}
          <a href="https://web3.storage" target="_blank">
            Web3.storage
          </a>{" "}
          and create an account. Once your account is created, navigate to{" "}
          <strong>Account</strong> and <strong>Create an API Token</strong>.
        </p>
      </Figure>
      <Figure img="/images/docs/Fig.12.png" title="fig 12">
        <p className="pt-4 pb-16">
          Give your token a name, e.g. "NIIIFTY Tutorial" and click{" "}
          <strong>Create</strong>.<br />
          Copy your newly created API token to the clipboard.
        </p>
      </Figure>
      <Figure img="/images/docs/Fig.13.png" title="fig 13">
        <p className="pt-4 pb-16">
          In vscode, add a <CodeInline>.env</CodeInline> file to your functions
          folder. Add{" "}
          <CodeInline>
            WEB3_STORAGE_API_KEY=[pasted key from clipboard]
          </CodeInline>
        </p>
      </Figure>
      <Figure img="/images/docs/Fig.14.png" title="fig 14">
        <p className="pt-4 pb-16">
          Click the cog icon next to <strong>Project Overview</strong> and
          select <strong>Project settings</strong>.<br /> Under the{" "}
          <strong>General</strong> tab, find the <strong>Project ID</strong> and
          copy it.
        </p>
      </Figure>
      <Figure img="/images/docs/Fig.15.png" title="fig 15">
        <p className="pt-4">
          In vscode, open the <CodeInline>.firebaserc</CodeInline> file. <br />
          Paste your project ID into the <CodeInline>
            default
          </CodeInline> value. <br />
          If you do not already have the{" "}
          <a href="https://firebase.google.com/docs/cli" target="_blank">
            Firebase CLI
          </a>{" "}
          installed, please install it. <br />
          Once installed, open a command prompt in the root of your firebase
          project and type:
        </p>
        <CodeBlock>firebase use default</CodeBlock>
        You should see a message similar to{" "}
        <CodeInline>Now using alias default (niiifty-tutorial)</CodeInline>{" "}
        <p>In your command prompt, now type: </p>
        <CodeBlock>
          cd functions
          <br />
          npm i
        </CodeBlock>
        <p>Once the node modules are installed, type: </p>
        <CodeBlock>
          cd ../ <br />
          npm run deploy
        </CodeBlock>{" "}
        <p className="pb-16">
          Once deployed to Firebase, you should see a success message.
        </p>
      </Figure>
      <Figure img="/images/docs/Fig.16.png" title="fig 16">
        <p className="pt-4 pb-16">
          In your Vercel account, select <strong>Add New</strong> then{" "}
          <strong>Project</strong>.
        </p>
      </Figure>
      <Figure img="/images/docs/Fig.17.png" title="fig 17">
        <p className="pt-4 pb-16">
          Find your NIIIFTY fork and select <strong>Import</strong>
        </p>
      </Figure>
      <Figure img="/images/docs/Fig.18.png" title="fig 18">
        <p className="pt-4 pb-16">
          Name your project e.g. <CodeInline>niiifty-tutorial</CodeInline> and
          select <strong>Deploy</strong>. <br />
          Once deployed, select <strong>Continue to Dashboard</strong>. <br />
          Here you can see the domain assigned to your project e.g.
          <CodeInline>niiifty-tutorial.vercel.app</CodeInline> <br />
          In vscode, add this domain to the site section of your{" "}
          <CodeInline>niiifty.config.ts</CodeInline> file.
        </p>
      </Figure>
      <Figure img="/images/docs/Fig.19.png" title="fig 19">
        <p className="pt-4 pb-16">
          In your Firebase console, expand <strong>Build</strong> in the
          left-hand menu and select <strong>Authentication</strong>. <br />
          Under <strong>Additional providers</strong>, select{" "}
          <strong>Google</strong>. <br />
          Select <strong>enable</strong>. <br />
          Under <strong>Project public-facing name</strong>, enter
          "niiifty-tutorial" (or another name of your choice). <br />
          Under <strong>Project support email</strong>, enter an email address
          (e.g. your gmail address). <br />
          Click <strong>Save</strong>.
        </p>
      </Figure>
      <Figure img="/images/docs/Fig.20.png" title="fig 20">
        <p className="pt-4 pb-16">
          Under <strong>Authentication &gt; Settings</strong>, select{" "}
          <strong>Authorised domains</strong> <br />
          Add your vercel project domain, e.g. "niiifty-tutorial.vercel.app"
          (this can be found on your vercel project dashboard).
        </p>
      </Figure>
      <Figure img="/images/docs/Fig.21.png" title="fig 21">
        <p className="pt-4 pb-16">
          In your Firebase console, expand <strong>Build</strong> in the
          left-hand menu and select <strong>Firestore Database</strong>.<br />
          Select <strong>Create Database</strong>.<br />
          Leave the settings on their default values and click{" "}
          <strong>Next</strong>.<br />
          Choose a region for your database and click <strong>Enable</strong>.
        </p>
      </Figure>
      <Figure img="/images/docs/Fig.22.png" title="fig 22">
        <p className="pt-4 pb-16">
          In your Firebase console, expand <strong>Build</strong> in the
          left-hand menu and select <strong>Firestore Database</strong>.<br />
          Select <strong>Create Database</strong>. <br />
          Leave the settings on their default values and click{" "}
          <strong>Next</strong>. <br />
          Choose a region for your database and click <strong>Enable</strong>
        </p>
      </Figure>
      <Figure img="/images/docs/Fig.23.png" title="fig 23">
        <p className="pt-4 pb-16">
          In your Firebase console, expand <strong>Build</strong> in the
          left-hand menu and select <strong>Storage</strong>.<br />
          Click <strong>Get Started</strong>. <br />
          Leave the settings on their default values and click{" "}
          <strong>Next</strong>, then <strong>Done</strong>.
        </p>
      </Figure>
      <Figure img="/images/docs/Fig.24.png" title="fig 24">
        <p className="pt-4 pb-16">
          In your Firebase console, expand <strong>Build</strong> in the
          left-hand menu and select <strong>Functions</strong>. <br />
          Click <strong>Get Started</strong>, <strong>Continue</strong>, and{" "}
          <strong>Finish</strong>.
        </p>
      </Figure>
      <Figure img="/images/docs/Fig.25.png" title="fig 25">
        <p className="pt-4 pb-16">
          Browse to your{" "}
          <a href="https://console.cloud.google.com/" target="_blank">
            Google Cloud console
          </a>
          <br />
          Select your project in the drop down menu at the top. <br />
          Expand the left menu and select <strong>Cloud Storage</strong>.<br />
          Select your project's public bucket, e.g. niiifty-tutorial.appspot.com
        </p>
      </Figure>
      <Figure img="/images/docs/Fig.26.png" title="fig 26">
        <p className="pt-4 pb-16">
          Select the <strong>Permission</strong> tab, then{" "}
          <strong>Grant Access</strong>.
        </p>
      </Figure>
      <Figure img="/images/docs/Fig.27.png" title="fig 27">
        <p className="pt-4 pb-16">
          In the expanded side panel, add <strong>New principles</strong>{" "}
          <CodeInline>allUsers</CodeInline>, with a <strong>Role</strong> of{" "}
          <CodeInline>Storage Object Viewer</CodeInline>.<br />
          Click <strong>Save</strong>. <br />
          Confirm <strong>Allow Public Access.</strong>
        </p>
      </Figure>
      <Figure img="/images/docs/Fig.28.png" title="fig 28">
        <p className="pt-4 pb-16">
          Now select the <strong>Configuration</strong> tab in your bucket
          settings and copy the <CodeInline>gsUtil</CodeInline> vale.
        </p>
      </Figure>
      <Figure img="/images/docs/Fig.29.png" title="fig 29">
        <p className="pt-4">Activate Cloud Shell and type in</p>
        <CodeBlock>{`printf '[{"origin": ["*"],"responseHeader": ["*"],"method": ["GET","POST","HEAD"],"maxAgeSeconds": 86400}]' > cors.json 
gsutil cors set cors.json [gsUtil]`}</CodeBlock>
        <p className="pb-16">
          replacing <CodeInline>[gsUtil]</CodeInline> with your{" "}
          <CodeInline>gsUtil</CodeInline> value.
          <br />
          You may be prompted to authorise Cloud Shell, click{" "}
          <strong>Authorise</strong>.<br />
          You can now access the files generated by NIIIFTY via CORS.
        </p>
      </Figure>
      <p>
        Congratulations! If you now visit your Vercel project's URL e.g.
        https://niiifty-tutorial.vercel.app/ you will be able to create an
        account associated with your Gmail address and start uploading files!
      </p>
    </DocsLayout>
  );
}
