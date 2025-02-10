import { exec } from 'child_process';

export async function getEverquestPids(): Promise<number[]> {
  // Sorrrrrry Linux users, only working on windows for now.
  // It's probably not reading Zeal pipes in the right place on Linux anyhow
  if (process.platform !== 'win32') {
    return [];
  }
  return new Promise<any>((resolve, reject) => {
    exec('tasklist /FI "IMAGENAME eq eqgame.exe"', (err, result) => {
      if (err) {
        return reject(err);
      }
      const eqgamePids = result
        .split('\n')
        .map((line) => {
          const [name, pid, _sessionName, _sessionNumber, _memUsage] =
            line.split(/\s+/);
          return { name, pid };
        })
        .filter((task) => task.name === 'eqgame.exe')
        .map((task) => parseInt(task.pid));
      resolve(eqgamePids);
    });
  });
}
