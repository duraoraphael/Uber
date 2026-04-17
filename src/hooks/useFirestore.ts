import { useCallback } from 'react';
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  type WhereFilterOp,
  type QueryConstraint,
  type DocumentData,
  type Unsubscribe,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface QueryFilter {
  field: string;
  operator: WhereFilterOp;
  value: unknown;
}

export function useFirestore() {
  const addDocument = useCallback(async <T extends DocumentData>(
    collectionPath: string,
    data: T,
  ): Promise<string> => {
    try {
      const ref = await addDoc(collection(db, collectionPath), {
        ...data,
        createdAt: serverTimestamp(),
      });
      return ref.id;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro ao adicionar documento';
      throw new Error(msg);
    }
  }, []);

  const getDocument = useCallback(async <T>(
    collectionPath: string,
    docId: string,
  ): Promise<(T & { id: string }) | null> => {
    try {
      const snap = await getDoc(doc(db, collectionPath, docId));
      if (!snap.exists()) return null;
      return { id: snap.id, ...snap.data() } as T & { id: string };
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro ao buscar documento';
      throw new Error(msg);
    }
  }, []);

  const getDocuments = useCallback(async <T>(
    collectionPath: string,
    filters: QueryFilter[] = [],
    sortField?: string,
    sortDirection: 'asc' | 'desc' = 'desc',
  ): Promise<(T & { id: string })[]> => {
    try {
      const constraints: QueryConstraint[] = filters.map((f) => where(f.field, f.operator, f.value));
      if (sortField) constraints.push(orderBy(sortField, sortDirection));
      const q = query(collection(db, collectionPath), ...constraints);
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T & { id: string });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro ao listar documentos';
      throw new Error(msg);
    }
  }, []);

  const updateDocument = useCallback(async (
    collectionPath: string,
    docId: string,
    data: Partial<DocumentData>,
  ): Promise<void> => {
    try {
      await updateDoc(doc(db, collectionPath, docId), {
        ...data,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro ao atualizar documento';
      throw new Error(msg);
    }
  }, []);

  const deleteDocument = useCallback(async (
    collectionPath: string,
    docId: string,
  ): Promise<void> => {
    try {
      await deleteDoc(doc(db, collectionPath, docId));
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro ao deletar documento';
      throw new Error(msg);
    }
  }, []);

  const subscribeToCollection = useCallback(<T>(
    collectionPath: string,
    callback: (docs: (T & { id: string })[]) => void,
    filters: QueryFilter[] = [],
    sortField?: string,
    sortDirection: 'asc' | 'desc' = 'desc',
  ): Unsubscribe => {
    const constraints: QueryConstraint[] = filters.map((f) => where(f.field, f.operator, f.value));
    if (sortField) constraints.push(orderBy(sortField, sortDirection));
    const q = query(collection(db, collectionPath), ...constraints);
    return onSnapshot(q, (snap) => {
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T & { id: string });
      callback(docs);
    });
  }, []);

  return {
    addDocument,
    getDocument,
    getDocuments,
    updateDocument,
    deleteDocument,
    subscribeToCollection,
  };
}
