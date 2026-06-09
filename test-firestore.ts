import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkPath(path) {
  try {
    const snaps = await getDocs(collection(db, path));
    console.log(`Path: ${path} -> Found ${snaps.size} docs`);
    if(snaps.size > 0){
        let i = 0;
        snaps.forEach(s => {
            if(i++ < 2) console.log(` - ${s.id}: ${JSON.stringify(s.data()).substring(0, 50)}...`);
        });
    }
  } catch(e) {
    console.log(`Path: ${path} -> Error: ${e.code || e.message}`);
  }
}

async function run() {
  const uid = 'EcXG0pQYryfMgNFr96u1mFKZIG22'; // the user uid
  const paths = [
    `missions`,
    `events`,
    `catholic_events`,
    `missions_db`,
    `missions_db_maria`,
    `catholicEvents`,
    `users/${uid}/missions`,
    `users/${uid}/events`,
    `users/${uid}/catholicEvents`,
    `users/${uid}/catholic_events`
  ];
  for (const p of paths) {
    await checkPath(p);
  }
  
  try {
     const uDoc = await getDoc(doc(db, `users/${uid}`));
     if(uDoc.exists()) {
        console.log(`Found users doc. keys: ${Object.keys(uDoc.data())}`);
     } else {
        console.log(`No users/${uid} doc`);
     }
  } catch(e){}

  process.exit(0);
}
run();
