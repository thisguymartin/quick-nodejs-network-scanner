import { describe, expect, it } from 'npm:vitest';
import { getNetworkInfo } from "./networkCheck.ts";

describe('Network Info', () => {
  it('gets primary interface properties', async () => {
    const info = await getNetworkInfo();
    expect(info.primaryInterface).toBeDefined();
    expect(info.primaryInterface.local_ip).toBeDefined();
    expect(info.primaryInterface.mac_address).toMatch(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/);
  });

  it('validates network stats', async () => {
    const info = await getNetworkInfo();
    expect(info.stats.ipv4Count + info.stats.ipv6Count).toBeGreaterThan(0);
  });
});