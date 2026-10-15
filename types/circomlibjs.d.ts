declare module "circomlibjs" {
  type Field = {
    toObject(value: unknown): bigint;
  };

  export function buildPoseidon(): Promise<{
    (inputs: Array<bigint | number | string>): unknown;
    F: Field;
  }>;

  export function buildEddsa(): Promise<{
    F: Field;
    prv2pub(privateKey: Uint8Array): [unknown, unknown];
    signPoseidon(privateKey: Uint8Array, message: unknown): {
      R8: [unknown, unknown];
      S: bigint;
    };
    verifyPoseidon(
      message: unknown,
      signature: { R8: [bigint, bigint]; S: bigint },
      publicKey: [bigint, bigint],
    ): boolean;
  }>;
}

