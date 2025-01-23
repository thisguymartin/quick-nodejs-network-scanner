interface NetworkInterface {
  family: string;
  name: string;
  address: string;
  netmask: string;
  scopeid: number | null;
  cidr: string;
  mac: string;
}

interface NetworkInterfaceInfo {
  network_type: string;
  local_ip: string;
  ip_version: string;
  mac_address: string;
  subnet_mask: string;
  cidr: string;
  external_ip?: string;
}

export async function getNetworkInfo(): Promise<NetworkInterfaceInfo> {
  await Deno.permissions.request({ name: "net" });

  const interfaces = await Deno.networkInterfaces();
  const mainInterface = interfaces.find(iface => 
    iface.family === "IPv4" && 
    iface.name === "en0" && 
    !iface.address.startsWith("127.")
  );

  if (!mainInterface) {
    throw new Error("No valid network interface found");
  }

  const networkInfo: NetworkInterfaceInfo = {
    network_type: mainInterface.name,
    local_ip: mainInterface.address,
    ip_version: mainInterface.family,
    mac_address: mainInterface.mac,
    subnet_mask: mainInterface.netmask,
    cidr: mainInterface.cidr,
  };

  try {
    const response = await fetch("https://api.ipify.org");
    if (response.ok) {
      networkInfo.external_ip = await response.text();
    }
  } catch (error) {
    console.warn("External IP fetch failed:", error);
  }

  console.log(networkInfo);
  return networkInfo;
}