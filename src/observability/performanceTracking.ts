// ── External Dependencies & Registrations
import { type LCPMetricWithAttribution, type Metric, onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals/attribution';

// ── Local Framework
import { trackEvent } from '@/observability/eventTracking';

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

export function initialise(): void {
    onLCP(trackLCPMetric);
    onINP(trackWebVitalMetric);
    onCLS(trackWebVitalMetric);
    onFCP(trackWebVitalMetric);
    onTTFB(trackWebVitalMetric);
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function trackWebVitalMetric(metric: Metric, data?: Record<string, unknown>): void {
    trackEvent('performance', {
        name: metric.name,
        navigationType: metric.navigationType,
        perfDelta: metric.delta,
        perfRating: metric.rating,
        perfValue: metric.value,
        ...data
    });
}

// LCP is split into its four parts, so a slow value shows whether the time went on the server, an image or rendering.
function trackLCPMetric(metric: LCPMetricWithAttribution): void {
    const { elementRenderDelay, resourceLoadDelay, resourceLoadDuration, target, timeToFirstByte, url } = metric.attribution;
    trackWebVitalMetric(metric, {
        lcpElementRenderDelay: elementRenderDelay,
        lcpResourceLoadDelay: resourceLoadDelay,
        lcpResourceLoadDuration: resourceLoadDuration,
        lcpTarget: target,
        lcpTimeToFirstByte: timeToFirstByte,
        lcpURL: url
    });
}
