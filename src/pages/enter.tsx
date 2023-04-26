import { auth, db, googleAuthProvider } from "@/utils/Firebase";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { UserContext } from "@/utils/UserContext";
import { doc, getDoc, writeBatch } from "firebase/firestore";
import { signInWithPopup } from "firebase/auth";
import { useRouter } from "next/router";
import { Button, FormItem, Label, TextInput } from "@/components/FormControls";
import debounce from "lodash.debounce";
import { useTranslation } from "react-i18next";
import { AgreeToPolicies } from "@/components/AgreeToPolicies";
import { AvailabilityMessage } from "@/components/AvailabilityMessage";
import { SigningInMessage } from "@/components/SigningInMessage";
import cx from "classnames";

export default function Enter(_props) {
  const { user, username, loaded } = useContext(UserContext);
  const { t } = useTranslation();
  const router = useRouter();

  // if the username has been successfully created, redirect to the admin page.
  useEffect(() => {
    if (username) {
      router.push({
        pathname: "/admin",
      });
    }
  }, [username]);

  function SignInState() {
    if (!loaded) {
      return (
        <div>
          <>{t("loading")}</>
        </div>
      );
    }

    if (!user) {
      // show sign in form
      return <SignInWithGoogle />;
    }

    if (user && !username) {
      // show create username form
      return <UsernameForm />;
    }

    return <SigningInMessage />;
  }

  return (
    <section className="py-8">
      <SignInState />
    </section>
  );
}

type ErrorType = "agreedToPolicies";

type Errors = {
  [key in ErrorType]?: boolean;
};

function SignInWithGoogle() {
  const [errors, setErrors] = useState<Errors>({});
  const [agreedToPolicies, setAgreedToPolicies] = useState<boolean>(false);
  const { t } = useTranslation();

  const handleValidation = () => {
    let tempErrors: Errors = {};
    let isValid = true;

    if (!agreedToPolicies) {
      tempErrors["agreedToPolicies"] = true;
      isValid = false;
    }

    setErrors({ ...tempErrors });
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let isValidForm = handleValidation();

    if (isValidForm) {
      signInWithPopup(auth, googleAuthProvider);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="">
      <h1 className="block text-xl font-semibold">
        <>{t("signIn")}</>
      </h1>

      <div className="pt-8">
        <div className="pb-8">
          <AgreeToPolicies
            onAgreeToPolicies={(agreed: boolean) => {
              setAgreedToPolicies(agreed);
            }}
          />
        </div>
        <button
          type="submit"
          className={cx("", {
            "opacity-50": !agreedToPolicies,
          })}
        >
          <img src="/google.png" className="mr-2 inline-block w-8" />
          {t("signInWithGoogle")}
        </button>
      </div>
    </form>
  );
}

// Username form
function UsernameForm() {
  const [username, setUsername] = useState("");
  // const [displayName, setDisplayName] = useState("");
  const [isUsernameValid, setUsernameIsValid] = useState(false);
  const [usernameExists, setUsernameExists] = useState(false);
  const [checkingUsernameExists, setCheckingUsernameExists] = useState(false);
  const { user, username: existingUsername } = useContext(UserContext);
  const [errors, setErrors] = useState<Errors>({});
  const router = useRouter();
  const { t } = useTranslation();

  type Errors = {
    [key in "username"]?: string | boolean;
  };

  useEffect(() => {
    if (user) {
      // get first part of email before @
      const defaultUsername = user.email.split("@")[0];
      validateUsername(defaultUsername);
    }
  }, [user]);

  const handleValidation = () => {
    let tempErrors: Errors = {};
    let isValid = true;

    if (!isUsernameValid) {
      tempErrors["username"] = true;
      isValid = false;
    }

    // if (displayName.length <= 0) {
    //   tempErrors["displayName"] = String(t("fullNameCannotBeEmpty"));
    //   isValid = false;
    // }

    setErrors({ ...tempErrors });
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let isValidForm = handleValidation();

    if (isValidForm) {
      window.localStorage.removeItem("defaultUsername");

      // Create refs for both documents
      const userDoc = doc(db, `users/${user.uid}`);
      const usernameDoc = doc(db, `usernames/${username}`);

      // Commit both docs together as a batch write.
      const batch = writeBatch(db);

      batch.set(userDoc, {
        username,
      });

      batch.set(usernameDoc, { uid: user.uid });
      await batch.commit();

      // update displayName
      // await updateProfile(user, {
      //   displayName,
      // });

      router.push({
        pathname: "/admin",
      });
    }
  };

  const reservedWords = ["admin", "files"];

  function validateUsername(uname) {
    uname = uname.toLowerCase();

    // accept between 2 and 15 chars, numbers, underscores, and periods
    const regex = /^(?=[a-z0-9._]{2,15}$)(?!.*[_.]{2})[^_.].*[^_.]$/;

    if (uname.length < 2) {
      setUsername(uname);
      setUsernameIsValid(false);
    }

    if (reservedWords.includes(uname)) {
      setUsername(uname);
      setUsernameIsValid(false);
    } else {
      if (regex.test(uname)) {
        setUsername(uname);
        setCheckingUsernameExists(true);
        setUsernameIsValid(true);
      } else {
        setUsername(uname);
        setUsernameIsValid(false);
      }
    }
  }

  const onChange = (e: any) => {
    validateUsername(e.target.value);
  };

  useEffect(() => {
    if (username) {
      checkUsernameExists(username);
    }
  }, [username]);

  // Hit the database for username match after each debounced change
  // useCallback is required for debounce to work
  const checkUsernameExists = useCallback(
    debounce(async (username) => {
      if (username.length >= 2) {
        console.log("checking username exists");
        const docRef = doc(db, `usernames/${username}`);
        const docSnap = await getDoc(docRef);
        const exists: boolean = docSnap.exists();
        // if (isMountedRef.current) {
        setUsernameExists(exists);
        setCheckingUsernameExists(false);
        //}
      }
    }, 500),
    []
  );

  return (
    !existingUsername && (
      <form onSubmit={handleSubmit} className="mx-auto w-full lg:w-1/2">
        {/* <FormItem>
          <Label value={t("fullName")} />
          <TextInput
            id="displayName"
            maxLength={70} // https://stackoverflow.com/a/30509
            value={displayName}
            onChange={(e: any) => {
              setDisplayName(e.target.value);
            }}
            errors={errors}
          />
        </FormItem> */}

        <FormItem>
          <Label value={t("chooseAUsername")} />
          <TextInput
            type="text"
            id="username"
            placeholder={t("username")}
            value={username}
            onChange={onChange}
          />
          <AvailabilityMessage
            item={username}
            exists={usernameExists}
            checkingExists={checkingUsernameExists}
            isValid={isUsernameValid}
            invalidMessage={t("usernameInvalid")}
          />
        </FormItem>

        <div className="mt-4">
          <Button
            type="submit"
            disabled={!isUsernameValid}
            classes="w-full"
            text={t("createAccount")}
          />
        </div>
      </form>
    )
  );
}
