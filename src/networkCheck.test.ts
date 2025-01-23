import { getNetworkInfo } from "./networkCheck.ts";
import { assertEquals, assertExists } from "jsr:@std/assert";

await Deno.permissions.request({ name: "net" });
await Deno.permissions.request({ name: "read" });

Deno.test({
    name: "Network Info Complete Test Suite",
    async fn() {
      const info = await getNetworkInfo();
      const platform = Deno.build.os;
      
      // Test primary interface
      assertExists(info.primaryInterface);
      if (platform === 'darwin') {
        assertEquals(info.primaryInterface.network_type, "en0");
      } else if (platform === 'windows') {
        assertEquals(info.primaryInterface.network_type.toLowerCase().includes('ethernet'), true);
      }
      assertEquals(info.primaryInterface.ip_version, "IPv4");
      assertExists(info.primaryInterface.cidr);
      assertExists(info.primaryInterface.mac_address);
      assertExists(info.primaryInterface.subnet_mask);
  
      // Test interface grouping
      assertExists(info.allInterfaces);
      if (platform === 'darwin') {
        assertExists(info.allInterfaces.en0);
        assertExists(info.allInterfaces.lo0);
      }
  
      // Test stats
      assertEquals(typeof info.stats.ipv4Count, "number");
      assertEquals(typeof info.stats.ipv6Count, "number");
      assertEquals(info.stats.interfaceTypes instanceof Set, true);
      assertEquals(typeof info.stats.hasVPN, "boolean");
  
      // Test timestamp
      const timestamp = new Date(info.lastUpdated);
      assertEquals(isNaN(timestamp.getTime()), false);
  
      // Test IP format if exists
      if (info.external_ip) {
        const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
        assertEquals(ipRegex.test(info.external_ip), true);
      }
  
      // Basic sanity checks
      assertEquals(info.stats.ipv4Count > 0, true);
      assertEquals(info.stats.ipv6Count >= 0, true);
      assertEquals(info.stats.interfaceTypes.size > 0, true);
    }
  });