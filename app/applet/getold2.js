import { execSync } from 'child_process';
try {
  console.log(execSync('git log -p src/utils/firebaseDb.ts | grep "path ="').toString());
} catch (e) {
  console.log(e);
}
