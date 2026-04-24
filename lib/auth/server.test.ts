import { afterEach, describe, expect, it, vi } from "vitest";

const redirectMock = vi.fn((url: string) => {
  throw new Error(`redirect:${url}`);
});

vi.mock("next/navigation", () => ({
  redirect: (url: string) => redirectMock(url),
}));

const supabaseStub = {
  auth: { getUser: vi.fn() },
  from: vi.fn(),
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => supabaseStub,
}));

afterEach(() => {
  vi.clearAllMocks();
});

async function loadModule() {
  return await import("./server");
}

function setUser(user: { id: string; email: string } | null) {
  supabaseStub.auth.getUser.mockResolvedValue({
    data: { user },
    error: user ? null : { message: "no session" },
  });
}

function setProfile(role: "owner" | "manager" | "contributor" | "uploader") {
  supabaseStub.from.mockImplementation((table: string) => {
    if (table === "profiles") {
      return {
        select: () => ({
          eq: () => ({
            single: () =>
              Promise.resolve({
                data: {
                  id: "user-1",
                  full_name: "Test User",
                  role,
                  default_brand_id: null,
                },
                error: null,
              }),
          }),
        }),
      };
    }
    throw new Error(`unexpected table: ${table}`);
  });
}

describe("getUser", () => {
  it("returns the user when a session exists", async () => {
    setUser({ id: "user-1", email: "test@example.com" });
    const { getUser } = await loadModule();
    const user = await getUser();
    expect(user).toEqual({ id: "user-1", email: "test@example.com" });
  });

  it("returns null when there is no session", async () => {
    setUser(null);
    const { getUser } = await loadModule();
    expect(await getUser()).toBeNull();
  });
});

describe("requireUser", () => {
  it("redirects to /login when there is no session", async () => {
    setUser(null);
    const { requireUser } = await loadModule();
    await expect(requireUser()).rejects.toThrow("redirect:/login");
    expect(redirectMock).toHaveBeenCalledWith("/login");
  });
});

describe("requireOwner", () => {
  it("redirects non-owners to /", async () => {
    setUser({ id: "user-1", email: "manager@example.com" });
    setProfile("manager");
    const { requireOwner } = await loadModule();
    await expect(requireOwner()).rejects.toThrow("redirect:/");
  });

  it("returns user + profile for owners", async () => {
    setUser({ id: "user-1", email: "owner@example.com" });
    setProfile("owner");
    const { requireOwner } = await loadModule();
    const result = await requireOwner();
    expect(result.profile.role).toBe("owner");
    expect(redirectMock).not.toHaveBeenCalled();
  });
});
