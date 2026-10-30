import { randomBytes } from "crypto";
export const bookingReference = () => `KJ-${new Date().getFullYear()}-${randomBytes(4).toString("hex").toUpperCase()}`;
export const enquiryReference = () => `ENQ-${randomBytes(4).toString("hex").toUpperCase()}`;
