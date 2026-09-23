import { expect, test } from "vitest";

import * as z from "zod/v4";

test("passing validations", () => {
  const example1 = z.custom<number>((x) => typeof x === "number");
  example1.parse(1234);
  expect(() => example1.parse({})).toThrow();
});

test("string params", () => {
  const example1 = z.custom<number>((x) => typeof x !== "number", "customerr");
  const result = example1.safeParse(1234);
  expect(result.success).toEqual(false);
  expect(JSON.stringify(result.error).includes("customerr")).toEqual(true);
});

test("instanceof", () => {
  const fn = (value: string) => Uint8Array.from(Buffer.from(value, "base64"));

  // Argument of type 'ZodCustom<Uint8Array<ArrayBuffer>, unknown>' is not assignable to parameter of type '$ZodType<any, Uint8Array<ArrayBuffer>>'.
  z.string().transform(fn).pipe(z.instanceof(Uint8Array));
});

test("non-continuable by default", () => {
  const A = z
    .custom<string>((val) => typeof val === "string")
    .transform((_) => {
      throw new Error("Invalid input");
    });
  expect(A.safeParse(123).error!).toMatchInlineSnapshot(`
    [ZodError: [
      {
        "code": "custom",
        "path": [],
        "message": "Invalid input"
      }
    ]]
  `);
});

// pins the default at packages/zod/src/v4/core/api.ts:1656, `norm.abort ??= true; // default to abort:false`, whose comment said the opposite of the code: `z.custom` stops after its first failing check, `refine` keeps going
test("z.custom aborts by default, unlike refine", () => {
  const custom = z.custom<string>(() => false, "first").check(z.custom<string>(() => false, "second"));
  expect(custom.safeParse("x").error!.issues.map((issue) => issue.message)).toEqual(["first"]);

  const refined = z
    .string()
    .refine(() => false, "first")
    .refine(() => false, "second");
  expect(refined.safeParse("x").error!.issues.map((issue) => issue.message)).toEqual(["first", "second"]);
});
