import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  startAfter,
  where,
} from "firebase/firestore";
import { db } from "@/utils/Firebase";
import { useEffect, useState } from "react";
import { fileToJson } from "@/utils/Utils";
import { AuthoringFile, SavedFile } from "@/utils/Types";
import { migrateFile } from "@/utils/Migration";
import { User } from "firebase/auth";

export const usePaginatedFiles = (
  user: User,
  page: number = 0,
  pageSize: number = 10
): [files: AuthoringFile[], allLoaded: boolean, loading: boolean] => {
  const [files, setExhibits] = useState<AuthoringFile[]>([]);
  const [lastVisible, setLastVisible] = useState({});
  const [allLoaded, setAllLoaded] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  function formatFile(file: any) {
    return fileToJson(migrateFile(file) as SavedFile);
  }

  useEffect(() => {
    let unsubscribe;

    setLoading(true);

    const firstPage = query(
      collection(db, "files"),
      where("uid", "==", user.uid),
      orderBy("modified", "desc"),
      limit(pageSize)
    );

    unsubscribe = onSnapshot(firstPage, (results) => {
      setLoading(false);
      const newExhibits: any = results.docs.map((doc) =>
        formatFile({ ...doc.data(), id: doc.id })
      );
      setExhibits(newExhibits);
      setLastVisible(results.docs[results.docs.length - 1]);
    });

    return () => {
      // unsubscribe();
    };
  }, []);

  useEffect(() => {
    let unsubscribe;

    if (page > 0) {
      setLoading(true);

      const nextPage = query(
        collection(db, "files"),
        where("uid", "==", user.uid),
        orderBy("modified", "desc"),
        startAfter(lastVisible),
        limit(pageSize)
      );

      unsubscribe = onSnapshot(nextPage, (results) => {
        setLoading(false);
        if (results.docs.length === 0) {
          setAllLoaded(true);
        } else {
          const newFiles: any = [
            ...files,
            ...results.docs.map((doc) =>
              formatFile({ ...doc.data(), id: doc.id })
            ),
          ];
          setExhibits(newFiles);
          setLastVisible(results.docs[results.docs.length - 1]);
        }
      });
    }

    return () => {
      // unsubscribe();
    };
  }, [page]);

  return [files, allLoaded, loading];
};
