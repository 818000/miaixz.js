import { MiaixzViewError } from "../../src/errors/view-error.js";

describe("MiaixzViewError", () => {
  it("retains only the stable code and diagnostic message", () => {
    const error = new MiaixzViewError("VIEW_OFFICE_SERVER_URL_INVALID");
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("MiaixzViewError");
    expect(error.code).toBe("VIEW_OFFICE_SERVER_URL_INVALID");
    expect(error.message).toBe("[VIEW_OFFICE_SERVER_URL_INVALID]");
  });
});
