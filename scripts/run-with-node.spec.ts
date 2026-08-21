import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'

const fixtures: string[] = []
const wrapper = fileURLToPath(new URL('./run-with-node.sh', import.meta.url))

afterEach(() => {
  for (const fixture of fixtures.splice(0)) rmSync(fixture, { recursive: true, force: true })
})

describe('Node command bootstrap', () => {
  it.skipIf(process.platform === 'win32')('runs with an NVM Node when Git has a system-only PATH', () => {
    const home = mkdtempSync(join(tmpdir(), 'dsh-run-with-node-'))
    fixtures.push(home)
    const node = join(home, '.nvm', 'versions', 'node', 'v24.0.0', 'bin', 'node')
    mkdirSync(dirname(node), { recursive: true })
    symlinkSync(process.execPath, node)
    const oldNode = join(home, '.nvm', 'versions', 'node', 'v9.0.0', 'bin', 'node')
    mkdirSync(dirname(oldNode), { recursive: true })
    symlinkSync('/usr/bin/false', oldNode)
    const defaultAlias = join(home, '.nvm', 'alias', 'default')
    mkdirSync(dirname(defaultAlias), { recursive: true })
    writeFileSync(defaultAlias, 'v24.0.0\n')

    const result = spawnSync('/bin/sh', [wrapper, 'node', '--version'], {
      encoding: 'utf8',
      env: { HOME: home, PATH: '/usr/bin:/bin' },
    })

    expect(result.status, result.stderr).toBe(0)
    expect(result.stdout.trim()).toBe(process.version)
  })
})
