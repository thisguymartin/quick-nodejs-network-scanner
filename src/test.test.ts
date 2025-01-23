import { getNetworkInfo } from "./networkCheck.ts";
import { assertEquals, assertExists } from "jsr:@std/assert";

await Deno.permissions.request({ name: "net" });
await Deno.permissions.request({ name: "read" });


Deno.test({
  name: "Network Info Test",
  async fn() {
    const networkInfo = await getNetworkInfo();
    
    assertExists(networkInfo);
    assertExists(networkInfo.network_type);
    assertExists(networkInfo.local_ip);
    assertEquals(networkInfo.ip_version, "IPv4");
    assertExists(networkInfo.mac_address);
    assertExists(networkInfo.subnet_mask);

    if (networkInfo.external_ip) {
      const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
      assertEquals(ipRegex.test(networkInfo.external_ip), true);
    }
  }
});