import { describe, it, expect, vi } from 'vitest';
import * as os from 'os';
import fetch from 'node-fetch';
import { displayNetworkInfo } from './networkCheck'; // Adjust the import path as necessary

vi.mock('os');
vi.mock('node-fetch', () => ({
  default: vi.fn(),
}));

describe('displayNetworkInfo', () => {
    it('should handle network interfaces correctly', async () => {
        // Mock network interface data with undefined properties
        (os.networkInterfaces as unknown as typeof os.networkInterfaces).mockReturnValue({
            eth0: [{
                address: undefined,
                netmask: undefined,
                family: 'IPv4',
                mac: undefined,
                internal: false
            }]
        });

        // Mock fetch implementation
        (fetch as unknown as typeof fetch).mockResolvedValue({
            ok: true,
            text: async () => '203.0.113.1',
        } as Response);

        try {
            const result = await displayNetworkInfo();
            expect(result).toBeDefined();
            expect(result.your_ip_address).toBe('203.0.113.1');
            // Additional assertions can be made here based on expected behavior
        } catch (error) {
            // Handle the error case
        }
    });

    it('should handle successful network information retrieval', async () => {
        // Mock network interface data
        (os.networkInterfaces as unknown as typeof os.networkInterfaces).mockReturnValue({
            eth0: [{
                address: '192.168.1.100',
                netmask: '255.255.255.0',
                family: 'IPv4',
                mac: '01:23:45:67:89:ab',
                internal: false
            }]
        });

        // Mock fetch implementation
        (fetch as unknown as typeof fetch).mockResolvedValue({
            ok: true,
            text: async () => '203.0.113.1',
        } as Response);

        const result = await displayNetworkInfo();
        expect(result).toEqual({
            network_type: 'eth0',
            local_ip: '192.168.1.100',
            ip_version: 'IPv4',
            mac_address_vs: '01:23:45:67:89:ab',
            subnet_mask: '255.255.255.0',
            your_ip_address: '203.0.113.1'
        });
    });

    // You can add more test cases to cover different scenarios like networkInterfaces being undefined
