export interface VerifiedFirebaseUser {
  uid: string;
  email?: string;
}

interface FirebaseAccountLookupResponse {
  users?: Array<{
    localId?: string;
    email?: string;
  }>;
}

export const verifyFirebaseIdToken = async (idToken: string): Promise<VerifiedFirebaseUser | null> => {
  const firebaseApiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

  if (!firebaseApiKey) {
    throw new Error('Firebase token verification is not configured.');
  }

  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseApiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ idToken }),
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json() as FirebaseAccountLookupResponse;
  const user = data.users?.[0];

  if (!user?.localId) {
    return null;
  }

  return {
    uid: user.localId,
    email: user.email,
  };
};
