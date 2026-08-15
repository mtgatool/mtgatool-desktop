/* eslint-disable no-script-url */
/**
 * These values become `href`s on a public page, so the interesting cases are
 * the ones that must NOT parse — a link is rebuilt from the captured handle,
 * and anything the pattern lets through is a link we would publish.
 */
import { parseSocialLink, readSocialLinks } from "../socialLinks";

describe("parseSocialLink", () => {
  it("accepts a bare handle and builds the canonical URL", () => {
    expect(parseSocialLink("twitch", "manwe")).toEqual({
      platform: "twitch",
      url: "https://www.twitch.tv/manwe",
      name: "manwe",
    });
  });

  it("accepts full links in the shapes people actually paste", () => {
    const expected = "https://www.twitch.tv/manwe";
    [
      "twitch.tv/manwe",
      "www.twitch.tv/manwe",
      "http://twitch.tv/manwe",
      "https://www.twitch.tv/manwe",
      "https://www.twitch.tv/manwe/",
      "  https://www.twitch.tv/manwe  ",
    ].forEach((input) => {
      expect(parseSocialLink("twitch", input)?.url).toBe(expected);
    });
  });

  it("drops tracking query strings and fragments", () => {
    expect(
      parseSocialLink("instagram", "https://instagram.com/manwe?igsh=abc123")
        ?.url
    ).toBe("https://www.instagram.com/manwe");
  });

  it("reads every YouTube channel shape", () => {
    expect(parseSocialLink("youtube", "@manwe")?.url).toBe(
      "https://www.youtube.com/@manwe"
    );
    // A bare word means the modern handle form.
    expect(parseSocialLink("youtube", "manwe")?.url).toBe(
      "https://www.youtube.com/@manwe"
    );
    expect(
      parseSocialLink(
        "youtube",
        "https://www.youtube.com/channel/UCabcdefghijklmnopqrstuv"
      )?.url
    ).toBe("https://www.youtube.com/channel/UCabcdefghijklmnopqrstuv");
    expect(parseSocialLink("youtube", "youtube.com/c/SomeName")?.name).toBe(
      "SomeName"
    );
    // Nothing names a raw channel id, so the platform stands in.
    expect(
      parseSocialLink("youtube", "youtube.com/channel/UCabcdefghijklmnopqrstuv")
        ?.name
    ).toBe("YouTube");
  });

  it("rejects other hosts, however they are dressed up", () => {
    [
      "https://evil.com/manwe",
      // The host we want appears, but not where it counts.
      "https://evil.com/twitch.tv/manwe",
      "evil.com/www.twitch.tv/manwe",
      "https://twitch.tv.evil.com/manwe",
      "https://twitch.tv@evil.com/manwe",
      "//evil.com/manwe",
    ].forEach((input) => {
      expect(parseSocialLink("twitch", input)).toBeNull();
    });
  });

  it("rejects script and data URLs", () => {
    [
      "javascript:alert(1)",
      "JavaScript:alert(1)",
      "data:text/html,<script>alert(1)</script>",
      "vbscript:msgbox(1)",
      "https://www.twitch.tv/javascript:alert(1)",
    ].forEach((input) => {
      expect(parseSocialLink("twitch", input)).toBeNull();
    });
  });

  it("rejects path traversal and extra path segments", () => {
    [
      "https://www.twitch.tv/manwe/../../etc",
      "https://www.twitch.tv/manwe/videos",
      "https://www.twitch.tv/",
    ].forEach((input) => {
      expect(parseSocialLink("twitch", input)).toBeNull();
    });
  });

  it("rejects handles with characters the platform does not allow", () => {
    expect(parseSocialLink("twitch", "man we")).toBeNull();
    expect(parseSocialLink("twitch", "man<we")).toBeNull();
    expect(parseSocialLink("twitch", "ab")).toBeNull(); // too short
    expect(parseSocialLink("twitch", "a".repeat(26))).toBeNull(); // too long
    expect(parseSocialLink("instagram", "man/we")).toBeNull();
  });

  it("treats an empty input as cleared", () => {
    expect(parseSocialLink("twitch", "")).toBeNull();
    expect(parseSocialLink("twitch", "   ")).toBeNull();
  });

  it("does not let one platform's link be stored under another", () => {
    expect(parseSocialLink("twitch", "https://instagram.com/manwe")).toBeNull();
    expect(parseSocialLink("instagram", "https://twitch.tv/manwe")).toBeNull();
  });
});

describe("readSocialLinks", () => {
  it("returns links in a stable platform order", () => {
    const links = readSocialLinks({
      instagram: "https://www.instagram.com/manwe",
      twitch: "https://www.twitch.tv/manwe",
    });
    expect(links.map((l) => l.platform)).toEqual(["twitch", "instagram"]);
  });

  it("drops a stored value that no longer validates", () => {
    // Whatever wrote this, it is not becoming an href.
    const links = readSocialLinks({
      twitch: "javascript:alert(1)",
      instagram: "https://www.instagram.com/manwe",
    } as never);
    expect(links.map((l) => l.platform)).toEqual(["instagram"]);
  });

  it("handles a missing column", () => {
    expect(readSocialLinks(null)).toEqual([]);
    expect(readSocialLinks(undefined)).toEqual([]);
  });
});
