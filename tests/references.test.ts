import { describe, expect, it } from "vitest";
import { bookingReference, enquiryReference } from "../src/lib/references";
describe("references", () => { it("creates non-guessable booking references", () => { expect(bookingReference()).toMatch(/^KJ-\d{4}-[A-F0-9]{8}$/); }); it("creates enquiry references", () => { expect(enquiryReference()).toMatch(/^ENQ-[A-F0-9]{8}$/); }); });
