'use client';

import { auth, db, googleAuthProvider } from '@/lib/firebase';
import { useCallback, useEffect, useState } from 'react';
import { useUserStore } from '@/store/user-store';
import { doc, getDoc, writeBatch } from 'firebase/firestore';
import { signInWithPopup } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import debounce from 'lodash.debounce';
import { useTranslation } from 'react-i18next';
import { AgreeToPolicies } from '@/components/AgreeToPolicies';
import { AvailabilityMessage } from '@/components/AvailabilityMessage';
import { SigningInMessage } from '@/components/SigningInMessage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormItem } from '@/components/ui/form';

export default function EnterPage() {
  const { user, username, loaded } = useUserStore();
  const { t } = useTranslation();
  const router = useRouter();

  useEffect(() => {
    if (username) {
      router.push('/admin');
    }
  }, [username, router]);

  function SignInState() {
    if (!loaded) {
      return (
        <div className="flex h-64 items-center justify-center">
          <>{t('loading')}</>
        </div>
      );
    }

    if (!user) {
      return <SignInWithGoogle />;
    }

    if (user && !username) {
      return <UsernameForm />;
    }

    return <SigningInMessage />;
  }

  return (
    <section className="container mx-auto max-w-lg py-12">
      <SignInState />
    </section>
  );
}

function SignInWithGoogle() {
  const [agreedToPolicies, setAgreedToPolicies] = useState<boolean>(false);
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (agreedToPolicies) {
      signInWithPopup(auth, googleAuthProvider);
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">{t('signIn')}</h1>

      <div className="space-y-6">
        <AgreeToPolicies
          onAgreeToPolicies={(agreed: boolean) => {
            setAgreedToPolicies(agreed);
          }}
        />
        <Button onClick={handleSubmit} disabled={!agreedToPolicies} className="w-full py-6 text-lg" variant="outline">
          <img src="/google.png" className="mr-3 h-6 w-6" alt="Google" />
          {t('signInWithGoogle')}
        </Button>
      </div>
    </div>
  );
}

function UsernameForm() {
  const [username, setUsername] = useState('');
  const [isUsernameValid, setUsernameIsValid] = useState(false);
  const [usernameExists, setUsernameExists] = useState(false);
  const [checkingUsernameExists, setCheckingUsernameExists] = useState(false);
  const { user } = useUserStore();
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    if (user && user.email) {
      const defaultUsername = user.email.split('@')[0];
      validateUsername(defaultUsername);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isUsernameValid && !usernameExists && user) {
      const userDoc = doc(db, `users/${user.uid}`);
      const usernameDoc = doc(db, `usernames/${username}`);

      const batch = writeBatch(db);
      batch.set(userDoc, { username });
      batch.set(usernameDoc, { uid: user.uid });
      await batch.commit();

      router.push('/admin');
    }
  };

  const reservedWords = ['admin', 'files'];

  const validateUsername = (uname: string) => {
    uname = uname.toLowerCase();
    const regex = /^(?=[a-z0-9._]{2,15}$)(?!.*[_.]{2})[^_.].*[^_.]$/;

    if (uname.length < 2 || reservedWords.includes(uname)) {
      setUsername(uname);
      setUsernameIsValid(false);
    } else {
      setUsername(uname);
      if (regex.test(uname)) {
        setCheckingUsernameExists(true);
        setUsernameIsValid(true);
        checkUsernameExists(uname);
      } else {
        setUsernameIsValid(false);
      }
    }
  };

  const checkUsernameExists = useCallback(
    debounce(async (username: string) => {
      if (username.length >= 2) {
        const docRef = doc(db, `usernames/${username}`);
        const docSnap = await getDoc(docRef);
        setUsernameExists(docSnap.exists());
        setCheckingUsernameExists(false);
      }
    }, 500),
    [],
  );

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">{t('chooseAUsername')}</h2>
        <p className="text-muted-foreground">{t('usernameHelpText')}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <FormItem>
          <Label htmlFor="username">{t('username')}</Label>
          <Input
            id="username"
            placeholder={t('username')}
            value={username}
            onChange={(e) => validateUsername(e.target.value)}
            className="py-6 text-lg"
          />
          <AvailabilityMessage
            item={username}
            exists={usernameExists}
            checkingExists={checkingUsernameExists}
            isValid={isUsernameValid}
            invalidMessage={t('usernameInvalid')}
          />
        </FormItem>

        <Button type="submit" disabled={!isUsernameValid || usernameExists} className="w-full py-6 text-lg">
          {t('createAccount')}
        </Button>
      </form>
    </div>
  );
}
