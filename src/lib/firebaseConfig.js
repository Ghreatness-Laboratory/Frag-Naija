export const firebaseConfig = {
  apiKey: 'AIzaSyC5ogLf-T8RSp-R4QRiGH6X8iwR09F-L7k',
  authDomain: 'frag-naija-21727.firebaseapp.com',
  projectId: 'frag-naija-21727',
  storageBucket: 'frag-naija-21727.firebasestorage.app',
  messagingSenderId: '1048178503639',
  appId: '1:1048178503639:web:25eed49e40924d16e92592',
  measurementId: 'G-8Z62HFQMR2',
};

export const firebaseVapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || '';
export const firebaseConfigScript = `self.FN_FIREBASE_CONFIG=${JSON.stringify(firebaseConfig)};`;
