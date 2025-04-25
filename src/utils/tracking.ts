// src/utils/tracking.ts
import { TRACKING_BASE_URL } from "../config";

export function getTrackingLink(projectId: string) {
  return `${TRACKING_BASE_URL}/${encodeURIComponent(projectId)}`;
}