const spawn = require('spawn-please')

const ROBLOX = 'RobloxPlayerBeta.exe'
const HANDLE = __dirname + '\\handle.exe'

const sleep = time => new Promise(resolve => setTimeout(resolve, time))

async function closeRobloxHandle (pid) {
  let checkfail = false
  setTimeout(() => { checkfail = true }, 1000 * 10)
  while (!checkfail) {
    if (!(await getPids()).includes(pid)) return console.log('roblox disappeared')
    const stdout = await spawn(HANDLE, ['-a', '-p', pid, 'ROBLOX_singletonEvent'])
    if (!stdout.includes('No matching handles found.')) break
  }
  const stdout = (await spawn(HANDLE, ['-a', '-p', pid, 'ROBLOX_singletonEvent'])).trim().split('\r\n')
  while (true) {
    const line = stdout.pop().toString()
    if (!line) return
    if (line === 'No matching handles found.') return console.log(line)

    const pid = line.split('pid: ')[1].split(' ')[0]
    const eid = line.split('type: Event          ')[1].split(':')[0]

    console.log(await spawn(HANDLE, ['-p', pid, '-c', eid, '-y']))

    console.log(line)
  }
}

async function getPids() {
  const tasklist = (await spawn('tasklist'))
    .split('\r\n')
    .filter(line => line.startsWith(ROBLOX))
    .map(line => line.split(' Console')[0].split(' ').pop())

  return tasklist
}

;(async () => {
  let pids = []
  while (true) {
    const newpids = await getPids()
    for (const pid of newpids) {
      if (pids.includes(pid)) continue
      console.log('=== new pid:', pid)
      await closeRobloxHandle(pid)
    }
    pids = newpids
    await sleep(1000)
  }
})()
