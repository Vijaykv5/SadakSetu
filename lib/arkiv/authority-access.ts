import { getAddress, isAddress } from "viem";

export function configuredAuthorityAddresses(value: string | undefined) {
  return new Set((value ?? "")
    .split(",")
    .map((address) => address.trim())
    .filter((address) => isAddress(address))
    .map((address) => getAddress(address).toLowerCase()));
}

export function isConfiguredAuthority(address: string, configured: string | undefined) {
  if (!isAddress(address)) return false;
  return configuredAuthorityAddresses(configured).has(getAddress(address).toLowerCase());
}
